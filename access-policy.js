/* Presentation rules only. These checks are not authentication or authorization. */
(function (root) {
  'use strict';
  var OWNER = 'ymahajna@nvidia.com';
  var OWNER_NAME = 'Yousef Mahajna';
  var LEVELS = { viewer: 'Viewer', editor: 'Editor', manager: 'Manager', admin: 'Administrator' };
  var RANK = { viewer: 1, editor: 2, manager: 3, admin: 4 };
  var DEFAULT_VIEWER = ['adhesives', 'activities', 'recipes'];
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function validEmail(value) { return /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@nvidia\.com$/i.test(String(value || '').trim()); }
  function isOwner(email) { return normalize(email) === OWNER; }
  function ownerRow() { return { name: OWNER_NAME, email: OWNER, platform: '*', level: 'admin' }; }
  function levelFor(email, platform, rows) {
    if (!validEmail(email)) return null;
    if (isOwner(email)) return 'admin';
    var best = DEFAULT_VIEWER.indexOf(platform) !== -1 ? 'viewer' : null;
    rows.forEach(function (row) {
      if (normalize(row.email) === normalize(email) && (row.platform === '*' || row.platform === platform) &&
          ['viewer', 'editor', 'manager'].indexOf(row.level) !== -1 && (!best || RANK[row.level] > RANK[best])) best = row.level;
    });
    return best;
  }
  function editableRows(rows) {
    return [ownerRow()].concat(rows.filter(function (r) { return !isOwner(r.email); }).map(function (r) {
      return { name: String(r.name || ''), email: normalize(r.email), platform: r.platform, level: r.level };
    }));
  }
  function validate(rows, platformIds) {
    var seen = new Set(), names = new Map();
    return rows.map(function (row, index) {
      var n = index + 1;
      var r = { name: String(row.name || '').trim(), email: normalize(row.email), platform: row.platform, level: row.level };
      if (!r.name) throw new Error('Enter a name in row ' + n + '.');
      if (!validEmail(r.email)) throw new Error('Enter an @nvidia.com email in row ' + n + '.');
      if (r.platform !== '*' && platformIds.indexOf(r.platform) === -1) throw new Error('Choose an application in row ' + n + '.');
      if (isOwner(r.email)) {
        if (r.name !== OWNER_NAME || r.platform !== '*' || r.level !== 'admin') throw new Error('Keep Yousef Mahajna as Administrator for all applications.');
      } else if (['viewer', 'editor', 'manager'].indexOf(r.level) === -1) throw new Error('Choose a permission level in row ' + n + '.');
      var key = r.email + '|' + r.platform;
      if (seen.has(key)) throw new Error('Row ' + n + ' repeats the same email and application. Update the existing row.');
      if (names.has(r.email) && names.get(r.email) !== r.name) throw new Error('Use the same name for ' + r.email + ' in every row.');
      seen.add(key); names.set(r.email, r.name);
      return r;
    });
  }
  var api = { OWNER: OWNER, LEVELS: LEVELS, normalize: normalize, validEmail: validEmail, isOwner: isOwner,
    ownerRow: ownerRow, levelFor: levelFor, editableRows: editableRows,
    validate: function (rows, ids) {
      var clean = validate(rows, ids);
      if (!clean.some(function (r) { return isOwner(r.email); })) throw new Error('Keep Yousef Mahajna as Administrator for all applications.');
      return clean;
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LabAccess = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
