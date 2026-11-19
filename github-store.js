/* Shared configuration persistence. Credentials stay in the current request only. */
(function (root) {
  'use strict';
  var REPO = 'YousefMahajna/interconnect-process-lab';
  var OWNER_ID = 329372258;
  var FILE = 'https://api.github.com/repos/' + REPO + '/contents/platforms.json';
  function encode(text) {
    var bytes = new TextEncoder().encode(text), binary = '';
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function decode(content) {
    var binary = atob(content.replace(/\s/g, ''));
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, function (c) { return c.charCodeAt(0); }));
  }
  function validData(data) {
    if (!data || !Array.isArray(data.platforms) || !Array.isArray(data.access)) throw new Error('The saved applications or Users list is invalid.');
    return data;
  }
  function accessVersion(rows) {
    // Ignore JSON formatting and row order, but never overwrite changed grants.
    return JSON.stringify(rows.map(function (r) {
      return JSON.stringify([r.name || '', String(r.email || '').trim().toLowerCase(), r.platform, r.level]);
    }).sort());
  }
  function create(fetcher, policy) {
    var activeToken = '';
    async function request(url, token, options) {
      var headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
      if (token) headers.Authorization = 'Bearer ' + token;
      if (options && options.body) headers['Content-Type'] = 'application/json';
      var response;
      try {
        response = await fetcher(url, Object.assign({ cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000) }, options, { headers: headers }));
      } catch (e) {
        throw new Error(options && options.method === 'PUT'
          ? 'The save could not be confirmed. Keep your edits and reload the list before trying again; GitHub may have received the change.'
          : 'Could not reach GitHub. Check your connection and try again.');
      }
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          var error = new Error(response.status === 401 ? 'GitHub did not accept this token. Connect GitHub again with a valid token.' : 'GitHub access was denied. Connect with a token that has Contents: Read and write for interconnect-process-lab under YousefMahajna. Repository rules may also block direct saves.');
          error.status = response.status; throw error;
        }
        if (response.status === 409 || response.status === 422) throw new Error('GitHub could not apply this update. Keep a copy of your edits and reload the list before trying again.');
        throw new Error('GitHub returned an error (' + response.status + '). Your edits are still on this screen.');
      }
      return response.json();
    }
    async function read(token) {
      var file = await request(FILE + '?ref=main', token);
      if (file.encoding !== 'base64' || typeof file.content !== 'string' || !file.sha) throw new Error('GitHub returned an unreadable users file.');
      return { data: validData(JSON.parse(decode(file.content))), sha: file.sha };
    }
    var api = {
      load: async function () { return (await read('')).data; },
      connect: async function (token) {
        activeToken = '';
        token = String(token || '').trim();
        if (!token) throw new Error('Enter a GitHub token to connect.');
        var identity = await request('https://api.github.com/user', token);
        if (identity.id !== OWNER_ID || String(identity.login).toLowerCase() !== 'yousefmahajna') throw new Error('Only the YousefMahajna GitHub account can save the Users list.');
        await read(token);
        activeToken = token;
        return { login: identity.login };
      },
      disconnect: function () { activeToken = ''; },
      isConnected: function () { return Boolean(activeToken); },
      saveConnected: async function (baseline, draft) {
        if (!activeToken) throw new Error('Connect GitHub before saving changes for everyone. Your browser draft is kept.');
        try { return await api.save(activeToken, baseline, draft); }
        catch (error) { if ([401, 403, 404].indexOf(error.status) !== -1) activeToken = ''; throw error; }
      },
      save: async function (token, baselineAccess, draft) {
        if (!token || !token.trim()) throw new Error('Enter a GitHub token in Save setup to save the shared Users list.');
        token = token.trim();
        var identity = await request('https://api.github.com/user', token);
        if (identity.id !== OWNER_ID || String(identity.login).toLowerCase() !== 'yousefmahajna') throw new Error('Only the YousefMahajna GitHub account can save the Users list.');
        var latest = await read(token);
        if (accessVersion(latest.data.access) !== accessVersion(baselineAccess)) throw new Error('The shared Users list changed since you opened this page. Copy your edits, reload, and apply them to the latest list. Nothing was overwritten.');
        var rows = policy.validate(draft, latest.data.platforms.map(function (p) { return p.id; }));
        var updated = Object.assign({}, latest.data, { access: rows });
        var result = await request(FILE, token, { method: 'PUT', body: JSON.stringify({
          message: 'Update shared Users list from lab hub', branch: 'main', sha: latest.sha,
          content: encode(JSON.stringify(updated, null, 2) + '\n')
        }) });
        if (!result.commit || !result.commit.sha) throw new Error('GitHub did not confirm the save. Keep your edits and reload before trying again.');
        return { data: updated, commitSha: result.commit.sha };
      }
    };
    return api;
  }
  var api = { create: create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LabGithubStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
