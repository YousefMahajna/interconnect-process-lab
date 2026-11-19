const { test } = require('node:test');
const assert = require('node:assert/strict');
const p = require('../access-policy.js');
const grant = (overrides = {}) => ({ name: 'Test User', email: 'test@nvidia.com', platform: 'adhesives', level: 'viewer', ...overrides });
const ids = ['adhesives', 'recipes'];
test('only the exact NVIDIA email domain is accepted and normalized', () => {
  assert.equal(p.validEmail(' Test.User@NVIDIA.COM '), true);
  assert.equal(p.normalize(' Test.User@NVIDIA.COM '), 'test.user@nvidia.com');
  for (const email of ['', '@nvidia.com', 'user@gmail.com', 'user@nvidia.com.attacker.com', 'user@sub.nvidia.com', 'user name@nvidia.com', 'user@@nvidia.com', 'user@nvidiaXcom']) assert.equal(p.validEmail(email), false, email);
});
test('Yousef has the highest presentation level for every application', () => {
  for (const id of ids) assert.equal(p.levelFor('YMAHAJNA@nvidia.com', id, []), 'admin');
  assert.equal(p.isOwner('other@nvidia.com'), false);
});
test('unlisted NVIDIA emails get only the three default Viewer applications', () => {
  for (const id of ['adhesives', 'activities', 'recipes']) assert.equal(p.levelFor(' Unknown@NVIDIA.COM ', id, []), 'viewer');
  for (const id of ['engineers', 'xsection', 'unknown']) assert.equal(p.levelFor('unknown@nvidia.com', id, []), null);
});
test('non-NVIDIA emails have no grants even on default applications', () => {
  assert.equal(p.levelFor('test@gmail.com', 'adhesives', [grant({ email: 'test@gmail.com' })]), null);
  assert.equal(p.levelFor('test@nvidia.com.attacker.com', 'recipes', []), null);
});
test('grants apply only to the selected user and application', () => {
  const rows = [grant(), grant({ email: 'other@nvidia.com', platform: 'recipes', level: 'manager' })];
  assert.equal(p.levelFor('test@nvidia.com', 'adhesives', rows), 'viewer');
  assert.equal(p.levelFor('test@nvidia.com', 'recipes', rows), 'viewer');
  assert.equal(p.levelFor('test@nvidia.com', 'engineers', rows), null);
});
test('wildcard grants combine with application grants using the highest level', () => {
  const rows = [grant({ platform: '*', level: 'editor' }), grant({ level: 'manager' })];
  assert.equal(p.levelFor('test@nvidia.com', 'adhesives', rows), 'manager');
  assert.equal(p.levelFor('test@nvidia.com', 'recipes', rows), 'editor');
});
test('administrator is reserved for the owner; invalid levels do not elevate default grants', () => {
  assert.equal(p.levelFor('test@nvidia.com', 'adhesives', [grant({ level: 'admin' })]), 'viewer');
  assert.equal(p.levelFor('test@nvidia.com', 'engineers', [grant({ platform: '*', level: 'admin' })]), null);
  assert.throws(() => p.validate([p.ownerRow(), grant({ level: 'admin' })], ids), /permission level/);
});
test('drafts migrate legacy owner entries and retain per-platform user names', () => {
  assert.deepEqual(p.editableRows([{ email: p.OWNER, platform: '*', level: 'manager' }, grant()]), [p.ownerRow(), grant()]);
});
test('exports normalize addresses and validate all user fields', () => {
  assert.equal(p.validate([p.ownerRow(), grant({ email: ' TEST@NVIDIA.COM ' })], ids)[1].email, 'test@nvidia.com');
  for (const overrides of [{ name: '' }, { email: 'test@gmail.com' }, { platform: 'unknown' }, { level: 'owner' }]) assert.throws(() => p.validate([p.ownerRow(), grant(overrides)], ids));
});
test('owner cannot be removed, renamed, demoted, or limited to one platform', () => {
  assert.throws(() => p.validate([grant()], ids), /Keep Yousef/);
  for (const patch of [{ name: 'Someone Else' }, { level: 'manager' }, { platform: 'adhesives' }]) assert.throws(() => p.validate([{ ...p.ownerRow(), ...patch }], ids), /Keep Yousef/);
});
test('duplicate grants and conflicting names are rejected', () => {
  assert.throws(() => p.validate([p.ownerRow(), grant(), grant({ email: 'TEST@nvidia.com' })], ids), /repeats/);
  assert.throws(() => p.validate([p.ownerRow(), grant(), grant({ platform: 'recipes', name: 'Different Name' })], ids), /same name/);
  assert.equal(p.validate([p.ownerRow(), grant(), grant({ platform: 'recipes', level: 'editor' })], ids).length, 3);
});
