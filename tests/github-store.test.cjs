const { test } = require('node:test');
const assert = require('node:assert/strict');
const Store = require('../github-store.js');
const Policy = require('../access-policy.js');
const seed = () => ({ platforms: [{ id: 'adhesives', title: 'Adhesives' }], access: [Policy.ownerRow()] });
function fixture() {
  const f = { data: seed(), sha: 'current-file-sha', calls: [], writes: 0, identity: { id: 329372258, login: 'YousefMahajna' }, status: 200, failPut: false };
  f.fetch = async (url, options) => {
    f.calls.push({ url, options });
    if (f.status !== 200) return { ok: false, status: f.status };
    if (url.endsWith('/user')) return { ok: true, json: async () => f.identity };
    if (options.method === 'PUT') {
      if (f.failPut) return { ok: false, status: 409 };
      const body = JSON.parse(options.body);
      assert.equal(body.sha, f.sha); assert.equal(body.branch, 'main');
      f.data = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
      f.writes++; f.sha = 'next-file-sha';
      return { ok: true, json: async () => ({ commit: { sha: 'confirmed-commit' } }) };
    }
    return { ok: true, json: async () => ({ sha: f.sha, encoding: 'base64', content: Buffer.from(JSON.stringify(f.data)).toString('base64') }) };
  };
  f.store = Store.create(f.fetch, Policy);
  return f;
}
const grant = () => ({ name: 'משתמש Test', email: 'test@nvidia.com', platform: 'adhesives', level: 'editor' });
test('load reads the latest shared GitHub list without a credential', async () => {
  const f = fixture(); assert.deepEqual(await f.store.load(), seed());
  assert.equal(f.calls[0].options.cache, 'no-store'); assert.equal(f.calls[0].options.headers.Authorization, undefined);
});
test('save persists UTF-8 grants, preserves the newest platform fields, and uses SHA concurrency', async () => {
  const f = fixture(); const baseline = seed().access;
  f.data.platforms[0].title = 'Updated elsewhere'; f.data.custom = { retain: true };
  const result = await f.store.save(' credential ', baseline, [...baseline, grant()]);
  assert.equal(f.writes, 1); assert.equal(result.data.access[1].name, grant().name);
  assert.equal(result.data.platforms[0].title, 'Updated elsewhere'); assert.deepEqual(result.data.custom, { retain: true });
  assert.equal(result.commitSha, 'confirmed-commit');
  assert.ok(f.calls.every(c => !c.url.includes('credential') && !(c.options.body || '').includes('credential')));
  assert.ok(f.calls.every(c => c.options.headers.Authorization === 'Bearer credential'));
  assert.deepEqual((await f.store.load()).access, result.data.access);
});
test('an unverified email selection cannot substitute for the owner GitHub identity', async () => {
  const f = fixture(); f.identity = { id: 123, login: 'another-user' };
  await assert.rejects(f.store.save('credential', seed().access, seed().access), /Only the YousefMahajna/);
  assert.equal(f.calls.length, 1); assert.equal(f.writes, 0);
});
test('blank tokens make no requests', async () => {
  const f = fixture(); await assert.rejects(f.store.save(' ', seed().access, seed().access), /Enter a GitHub token/);
  assert.equal(f.calls.length, 0);
});
test('changed shared permissions are never silently overwritten', async () => {
  const f = fixture(); f.data.access.push(grant());
  await assert.rejects(f.store.save('credential', seed().access, seed().access), /Nothing was overwritten/);
  assert.equal(f.writes, 0);
});
test('401 and 403 errors leave the shared list untouched', async () => {
  for (const status of [401, 403]) {
    const f = fixture(); f.status = status;
    await assert.rejects(f.store.save('credential', seed().access, seed().access), status === 401 ? /did not accept/ : /access was denied/);
    assert.equal(f.writes, 0);
  }
});
test('PUT conflicts do not report success', async () => {
  const f = fixture(); f.failPut = true;
  await assert.rejects(f.store.save('credential', seed().access, seed().access), /could not apply/);
  assert.equal(f.writes, 0);
});
test('lost PUT responses report an unconfirmed save without retrying', async () => {
  const f = fixture(); const fetcher = f.fetch;
  f.store = Store.create(async (url, options) => { if (options.method === 'PUT') throw new Error('Disconnected'); return fetcher(url, options); }, Policy);
  await assert.rejects(f.store.save('credential', seed().access, seed().access), /save could not be confirmed/);
  assert.equal(f.writes, 0);
});
test('invalid grants cannot be saved even with an owner credential', async () => {
  const f = fixture();
  await assert.rejects(f.store.save('credential', seed().access, [...seed().access, { ...grant(), email: 'test@gmail.com' }]), /@nvidia.com/);
  assert.equal(f.writes, 0);
});
test('one explicit connection supports repeated saves until disconnected', async () => {
  const f = fixture();
  assert.equal(f.store.isConnected(), false);
  await f.store.connect('credential'); assert.equal(f.store.isConnected(), true);
  const first = await f.store.saveConnected(seed().access, [...seed().access, grant()]);
  await f.store.saveConnected(first.data.access, first.data.access);
  assert.equal(f.writes, 2); assert.equal(f.store.isConnected(), true);
  f.store.disconnect(); assert.equal(f.store.isConnected(), false);
  await assert.rejects(f.store.saveConnected(f.data.access, f.data.access), /Connect GitHub/);
  assert.equal(f.writes, 2);
});
test('failed connections never enable shared saving', async () => {
  const f = fixture(); f.identity = { id: 12, login: 'other' };
  await assert.rejects(f.store.connect('credential'), /Only the YousefMahajna/);
  assert.equal(f.store.isConnected(), false);
});
test('revoked credentials end an established page connection', async () => {
  const f = fixture(); await f.store.connect('credential'); f.status = 401;
  await assert.rejects(f.store.saveConnected(seed().access, seed().access), /did not accept/);
  assert.equal(f.store.isConnected(), false); assert.equal(f.writes, 0);
});
