const { test } = require('node:test');
const assert = require('node:assert/strict');
const Draft = require('../users-draft.js');
const owner = { name: 'Yousef Mahajna', email: 'ymahajna@nvidia.com', platform: '*', level: 'admin' };
const oleg = { name: 'Oleg', email: 'olegm@nvidia.com', platform: 'adhesives', level: 'editor' };
const other = { name: 'Other', email: 'other@nvidia.com', platform: 'recipes', level: 'viewer' };
test('draft survives recreation and includes only grant fields, never credentials', () => {
  const values = new Map(); const storage = { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) };
  Draft.create(storage).write([owner], [owner, { ...oleg, token: 'secret' }]);
  assert.deepEqual(Draft.create(storage).read(), { base: [owner], rows: [owner, oleg] });
  assert.equal(values.get(Draft.KEY).includes('secret'), false);
  Draft.create(storage).clear(); assert.equal(Draft.create(storage).read(), null);
});
test('new saved users and new draft users both survive a revision update', () => {
  assert.deepEqual(Draft.recover([owner], [owner, oleg], [owner, other]), { rows: [owner, other, oleg], conflicts: [] });
});
test('a matching successful save is recovered without duplicate grants', () => {
  assert.deepEqual(Draft.recover([owner], [owner, oleg], [owner, oleg]), { rows: [owner, oleg], conflicts: [] });
});
test('local removals and edits preserve unrelated saved changes', () => {
  const result = Draft.recover([owner, oleg], [owner], [owner, oleg, other]);
  assert.deepEqual(result, { rows: [owner, other], conflicts: [] });
});
test('conflicting edits require an explicit value choice', () => {
  const local = { ...oleg, level: 'manager' }, remote = { ...oleg, level: 'viewer' };
  assert.deepEqual(Draft.recover([owner, oleg], [owner, local], [owner, remote]).conflicts, ['olegm@nvidia.com|adhesives']);
  assert.deepEqual(Draft.recover([owner, oleg], [owner, local], [owner, remote], 'local').rows, [owner, local]);
  assert.deepEqual(Draft.recover([owner, oleg], [owner, local], [owner, remote], 'remote').rows, [owner, remote]);
});
test('incomplete and duplicate rows are preserved for correction', () => {
  const blank = { name: '', email: '', platform: 'adhesives', level: 'viewer' };
  assert.deepEqual(Draft.recover([owner], [owner, blank, { ...blank, name: 'Partial' }, oleg, oleg], [owner]).rows,
    [owner, blank, { ...blank, name: 'Partial' }, oleg, oleg]);
});
test('unavailable storage errors are visible to the caller', () => {
  const storage = { getItem() { throw new Error('Storage disabled'); }, setItem() { throw new Error('Storage disabled'); } };
  assert.throws(() => Draft.create(storage).read(), /Storage disabled/);
  assert.throws(() => Draft.create(storage).write([owner], [owner, oleg]), /Storage disabled/);
});
