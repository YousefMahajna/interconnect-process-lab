/* Local XLSX interchange for the lab permissions workbook. No uploads or macros. */
(function (root) {
  'use strict';
  var P = root.LabAccess;
  var NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  var REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  var XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  var HEADERS = ['Name', 'NVIDIA email', 'Can enter', 'Level'];
  function esc(s) { return String(s).replace(/[<>&"']/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]; }); }
  function cell(col, row, value, style) { return '<c r="' + col + row + '" s="' + (style || 0) + '" t="inlineStr"><is><t xml:space="preserve">' + esc(value) + '</t></is></c>'; }
  function row(n, values, style) { return '<row r="' + n + '" ht="25" customHeight="1">' + values.map(function (v, i) { return cell('ABCD'[i], n, v, style); }).join('') + '</row>'; }
  function matrix(platforms, rows) {
    P.validate(rows, platforms.map(function (p) { return p.id; }));
    var users = new Map(); rows.filter(function (r) { return !P.isGeneral(r.email); }).forEach(function (r) { users.set(P.normalize(r.email), r.name); });
    var people = Array.from(users).sort(function (a, b) { return P.isOwner(a[0]) ? -1 : P.isOwner(b[0]) ? 1 : a[1].localeCompare(b[1]); });
    return platforms.map(function (p) {
      var general = P.generalLevel(p.id, rows);
      return { id: p.id, title: p.title, general: general, users: people.map(function (u) {
        var level = P.levelFor(u[0], p.id, rows) || 'none';
        return [u[1], u[0], level === 'none' ? 'No' : 'Yes', P.LEVELS[level]];
      }) };
    });
  }
  async function exportWorkbook(platforms, rows) {
    var sheets = matrix(platforms, rows), zip = new root.JSZip(), names = new Set();
    var workbook = '<workbook xmlns="' + NS + '" xmlns:r="' + REL + '"><sheets>';
    var relationships = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    var types = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
    sheets.forEach(function (s, index) {
      var n = index + 1, baseName = s.title.replace(/[\\/*?:\[\]]/g, ' ').slice(0, 31), name = baseName, suffix = 0;
      while (names.has(name.toLowerCase())) name = baseName.slice(0, 26) + ' ' + (++suffix);
      names.add(name.toLowerCase());
      workbook += '<sheet name="' + esc(name) + '" sheetId="' + n + '" r:id="rId' + n + '"/>';
      relationships += '<Relationship Id="rId' + n + '" Type="' + REL + '/worksheet" Target="worksheets/sheet' + n + '.xml"/>';
      types += '<Override PartName="/xl/worksheets/sheet' + n + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      var body = row(1, [s.title], 1) + row(2, ['Application ID', s.id, 'Format', 'IPL Users v1'], 3)
        + row(3, ['General NVIDIA users'], 2) + row(4, HEADERS, 2)
        + row(5, ['All NVIDIA users', '*@nvidia.com', s.general === 'none' ? 'No' : 'Yes', P.LEVELS[s.general]], 4)
        + row(6, ['Listed users become personal application rules on import. Unlisted users follow the general rule.'], 3)
        + row(7, ['User permissions'], 2) + row(8, HEADERS, 2);
      s.users.forEach(function (u, i) { body += row(i + 9, u, P.isOwner(u[1]) ? 3 : 0); });
      var last = Math.max(9, s.users.length + 8);
      var xml = '<worksheet xmlns="' + NS + '"><dimension ref="A1:D' + last + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="8" topLeftCell="A9" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="25"/><cols><col min="1" max="1" width="27" customWidth="1"/><col min="2" max="2" width="36" customWidth="1"/><col min="3" max="3" width="15" customWidth="1"/><col min="4" max="4" width="22" customWidth="1"/></cols><sheetData>' + body + '</sheetData><autoFilter ref="A8:D' + last + '"/><mergeCells count="4"><mergeCell ref="A1:D1"/><mergeCell ref="A3:D3"/><mergeCell ref="A6:D6"/><mergeCell ref="A7:D7"/></mergeCells><dataValidations count="2"><dataValidation type="list" allowBlank="0" showErrorMessage="1" errorTitle="Choose Yes or No" error="Choose Yes or No." sqref="C5 C9:C' + last + '"><formula1>"Yes,No"</formula1></dataValidation><dataValidation type="list" allowBlank="0" showErrorMessage="1" errorTitle="Choose an access level" error="Choose a listed access level." sqref="D5 D9:D' + last + '"><formula1>"No access,Viewer,Editor,Manager,Administrator"</formula1></dataValidation></dataValidations><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/></worksheet>';
      zip.file('xl/worksheets/sheet' + n + '.xml', XML + xml);
    });
    relationships += '<Relationship Id="styles" Type="' + REL + '/styles" Target="styles.xml"/></Relationships>';
    zip.file('xl/workbook.xml', XML + workbook + '</sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels', XML + relationships);
    zip.file('[Content_Types].xml', XML + types + '</Types>');
    zip.file('_rels/.rels', XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + REL + '/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/styles.xml', XML + '<styleSheet xmlns="' + NS + '"><fonts count="4"><font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font><font><b/><sz val="17"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><sz val="10"/><color rgb="FF475569"/><name val="Calibri"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF1F6"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0"/><xf numFmtId="49" fontId="2" fillId="2" borderId="0" xfId="0"/><xf numFmtId="49" fontId="3" fillId="3" borderId="0" xfId="0"/><xf numFmtId="49" fontId="0" fillId="4" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  }
  function doc(text) {
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Excel files with external entities are not supported.');
    var d = new DOMParser().parseFromString(text, 'application/xml');
    if (d.getElementsByTagName('parsererror').length) throw new Error('The Excel file contains invalid XML.');
    return d;
  }
  function all(d, tag) { return Array.from(d.getElementsByTagNameNS('*', tag)); }
  function text(d, tag) { return all(d, tag).map(function (n) { return n.textContent; }).join(''); }
  function archiveLimits(buffer) {
    var bytes = new Uint8Array(buffer), v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), end = -1;
    if (bytes.length > 2097152 || bytes.length < 22) throw new Error('Choose an .xlsx file smaller than 2 MB.');
    for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { end = i; break; }
    if (end < 0) throw new Error('This is not a supported Excel workbook.');
    var count = v.getUint16(end + 10, true), pos = v.getUint32(end + 16, true), total = 0;
    if (count > 150 || count === 65535) throw new Error('The Excel workbook is too complex.');
    for (var n = 0; n < count; n++) {
      if (pos + 46 > bytes.length || v.getUint32(pos, true) !== 0x02014b50) throw new Error('The Excel archive is invalid.');
      if (v.getUint16(pos + 8, true) & 1) throw new Error('Password-protected workbooks are not supported.');
      total += v.getUint32(pos + 24, true);
      if (total > 10485760) throw new Error('The uncompressed Excel workbook is too large.');
      pos += 46 + v.getUint16(pos + 28, true) + v.getUint16(pos + 30, true) + v.getUint16(pos + 32, true);
    }
  }
  async function importWorkbook(buffer, platforms) {
    archiveLimits(buffer);
    var zip = await root.JSZip.loadAsync(buffer, { checkCRC32: true });
    if (Object.keys(zip.files).some(function (p) { return /vbaProject|externalLinks/i.test(p); })) throw new Error('Macros and external links are not supported.');
    async function xml(path) {
      if (!zip.file(path)) throw new Error('Missing workbook data: ' + path);
      return doc(await zip.file(path).async('string'));
    }
    var shared = zip.file('xl/sharedStrings.xml') ? all(await xml('xl/sharedStrings.xml'), 'si').map(function (s) { return text(s, 't'); }) : [];
    var wb = await xml('xl/workbook.xml'), rels = all(await xml('xl/_rels/workbook.xml.rels'), 'Relationship');
    if (rels.some(function (r) { return r.getAttribute('TargetMode') === 'External'; })) throw new Error('External workbook links are not supported.');
    var sheets = all(wb, 'sheet');
    if (sheets.length !== platforms.length) throw new Error('Keep exactly one sheet for each of the ' + platforms.length + ' applications.');
    var seen = new Set(), rows = [P.ownerRow()];
    for (var s of sheets) {
      var rel = rels.find(function (r) { return r.getAttribute('Id') === s.getAttributeNS(REL, 'id'); });
      if (!rel) throw new Error('The workbook sheet link is missing.');
      var target = rel.getAttribute('Target');
      if (!target || /\.\.|:|\\/.test(target)) throw new Error('Invalid workbook sheet path.');
      var path = target[0] === '/' ? target.slice(1) : 'xl/' + target;
      var sheet = await xml(path), values = new Map();
      if (all(sheet, 'f').length) throw new Error('Use plain values, not formulas, in permission workbooks.');
      all(sheet, 'c').forEach(function (c) {
        var type = c.getAttribute('t'), value = type === 'inlineStr' ? text(c, 't') : text(c, 'v');
        if (type === 's') { var index = Number(value); if (!Number.isInteger(index) || shared[index] == null) throw new Error('Invalid shared text in workbook.'); value = shared[index]; }
        if (type === 'e') throw new Error('Fix Excel cell errors before importing.');
        values.set(c.getAttribute('r'), value.trim());
      });
      var id = values.get('B2'), platform = platforms.find(function (p) { return p.id === id; });
      if (!platform || seen.has(id) || values.get('D2') !== 'IPL Users v1') throw new Error('Use the exported template and keep its application IDs and format labels unchanged.');
      seen.add(id);
      for (var h = 0; h < 4; h++) if (values.get('ABCD'[h] + '8') !== HEADERS[h]) throw new Error('Keep the user table column headers unchanged on ' + platform.title + '.');
      function levelAt(n, general) {
        var yes = P.normalize(values.get('C' + n)), label = P.normalize(values.get('D' + n));
        if (yes === 'no') return 'none';
        if (yes !== 'yes') throw new Error(platform.title + ', row ' + n + ': Can enter must be Yes or No.');
        var level = Object.keys(P.LEVELS).find(function (k) { return P.normalize(P.LEVELS[k]) === label || k === label; });
        if (!level || level === 'none' || (general && level === 'admin')) throw new Error(platform.title + ', row ' + n + ': choose Viewer, Editor, or Manager. Administrator is reserved for Yousef.');
        return level;
      }
      if (values.get('B5') !== '*@nvidia.com') throw new Error('Keep the general NVIDIA rule at row 5 on ' + platform.title + '.');
      rows.push({ name: 'All NVIDIA users', email: '*@nvidia.com', platform: id, level: levelAt(5, true) });
      var ownerFound = false, emails = new Set();
      var max = Math.max(8, ...all(sheet, 'row').map(function (r) { return Number(r.getAttribute('r')); }));
      if (max > 5000) throw new Error('Use fewer than 5,000 rows per application.');
      for (var n = 9; n <= max; n++) {
        var name = values.get('A' + n) || '', email = P.normalize(values.get('B' + n));
        if (!name && !email && !values.get('C' + n) && !values.get('D' + n)) continue;
        if (!name || !P.validEmail(email) || emails.has(email)) throw new Error(platform.title + ', row ' + n + ': enter a name and unique NVIDIA email.');
        emails.add(email); var level = levelAt(n, false);
        if (P.isOwner(email)) {
          if (name !== P.ownerRow().name || level !== 'admin') throw new Error('Keep Yousef Mahajna as Administrator on every application.');
          ownerFound = true;
        } else rows.push({ name: name, email: email, platform: id, level: level });
      }
      if (!ownerFound) throw new Error('Keep Yousef Mahajna in the users table on ' + platform.title + '.');
    }
    return P.validate(rows, platforms.map(function (p) { return p.id; }));
  }
  root.LabPermissionsExcel = { exportWorkbook: exportWorkbook, importWorkbook: importWorkbook, matrix: matrix };
})(typeof globalThis !== 'undefined' ? globalThis : this);
