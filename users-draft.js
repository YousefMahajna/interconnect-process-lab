/* Browser draft recovery only. Recovered rows never grant application access. */
(function (root) {
  'use strict';
  var KEY = 'ipl-users-draft-v1';
  function clean(rows) {
    if (!Array.isArray(rows)) throw new Error('Invalid draft');
    return rows.map(function (r) { return { name: String(r.name || ''), email: String(r.email || ''), platform: String(r.platform || ''), level: String(r.level || '') }; });
  }
  function id(r) { return r.email.trim().toLowerCase() + '|' + r.platform; }
  function version(r) { return r ? JSON.stringify([r.name, r.email.trim().toLowerCase(), r.platform, r.level]) : ''; }
  function keyed(rows) {
    var counts = new Map();
    return new Map(clean(rows).map(function (r) {
      var key = id(r), count = counts.get(key) || 0; counts.set(key, count + 1);
      return [key + (count ? '|duplicate-' + count : ''), r];
    }));
  }
  function recover(base, draft, current, choice) {
    var b = keyed(base), l = keyed(draft), c = keyed(current);
    var rows = [], conflicts = [];
    new Set([].concat(Array.from(c.keys()), Array.from(l.keys()), Array.from(b.keys()))).forEach(function (key) {
      var before = b.get(key), local = l.get(key), remote = c.get(key), selected;
      if (version(local) === version(before)) selected = remote;
      else if (version(remote) === version(before) || version(remote) === version(local)) selected = local;
      else { conflicts.push(key); selected = choice === 'remote' ? remote : local; }
      if (selected) rows.push(selected);
    });
    return { rows: rows, conflicts: conflicts };
  }
  function create(storage) {
    return {
      read: function () {
        var raw = storage.getItem(KEY); if (!raw) return null;
        var d = JSON.parse(raw); if (d.version !== 1) throw new Error('Unsupported saved draft');
        return { base: clean(d.base), rows: clean(d.rows) };
      },
      write: function (base, rows) { storage.setItem(KEY, JSON.stringify({ version: 1, base: clean(base), rows: clean(rows) })); },
      clear: function () { storage.removeItem(KEY); }
    };
  }
  var api = { create: create, recover: recover, KEY: KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LabUsersDraft = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
