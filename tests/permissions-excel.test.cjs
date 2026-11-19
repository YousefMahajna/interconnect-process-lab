const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Policy = require('../access-policy.js');
const JSZip = require('../vendor/jszip.min.js');
const context = vm.createContext({ LabAccess: Policy, JSZip });
vm.runInContext(fs.readFileSync(require.resolve('../permissions-excel.js'), 'utf8'), context);
const Excel = context.LabPermissionsExcel;
const platforms = [{ id: 'adhesives', title: 'Adhesive Inventory' }, { id: 'engineers', title: 'Practical Engineers' }];
const rows = [Policy.ownerRow(), { name: 'Test User', email: 'test@nvidia.com', platform: 'adhesives', level: 'editor' }];
test('matrix includes all known users, general levels and blocked application entries', () => {
  const matrix = JSON.parse(JSON.stringify(Excel.matrix(platforms, rows)));
  assert.equal(matrix[0].general, 'viewer'); assert.equal(matrix[1].general, 'none');
  assert.deepEqual(matrix[0].users[1], ['Test User', 'test@nvidia.com', 'Yes', 'Editor']);
  assert.deepEqual(matrix[1].users[1], ['Test User', 'test@nvidia.com', 'No', 'No access']);
  for (const sheet of matrix) assert.deepEqual(sheet.users[0], ['Yousef Mahajna', Policy.OWNER, 'Yes', 'Administrator']);
});
test('XLSX exports one worksheet per application with editable Yes/No and level fields', async () => {
  const bytes = await Excel.exportWorkbook(platforms, rows); const zip = await JSZip.loadAsync(bytes);
  const workbook = await zip.file('xl/workbook.xml').async('string');
  assert.equal((workbook.match(/<sheet /g) || []).length, 2);
  for (let n = 1; n <= 2; n++) {
    const sheet = await zip.file('xl/worksheets/sheet' + n + '.xml').async('string');
    for (const text of ['*@nvidia.com', 'NVIDIA email', 'Can enter', 'IPL Users v1', 'Administrator', 'dataValidations', 'state="frozen"']) assert.ok(sheet.includes(text), text);
    assert.ok(sheet.includes(platforms[n - 1].id));
  }
});
test('text values remain literal strings and XML markup is escaped', async () => {
  const data = [Policy.ownerRow(), { name: '=Test <& "User">', email: 'test@nvidia.com', platform: '*', level: 'viewer' }];
  const zip = await JSZip.loadAsync(await Excel.exportWorkbook(platforms, data));
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  assert.ok(sheet.includes('=Test &lt;&amp; &quot;User&quot;&gt;'));
  assert.equal(/<f[ >]/.test(sheet), false);
});
test('long colliding application names get distinct legal sheet names', async () => {
  const apps = Array.from({ length: 3 }, (_, i) => ({ id: 'app' + i, title: 'A very long identical application name / []' }));
  const zip = await JSZip.loadAsync(await Excel.exportWorkbook(apps, [Policy.ownerRow()]));
  const xml = await zip.file('xl/workbook.xml').async('string');
  const names = [...xml.matchAll(/<sheet name="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(names).size, 3); assert.ok(names.every(n => n.length <= 31 && !/[\\/*?:\[\]]/.test(n)));
});
