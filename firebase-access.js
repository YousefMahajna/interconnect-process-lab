/* Server rules enforce these grants; this module also drives the UI. */
(function(root){
 'use strict';
 var current=null;
 function key(email){return String(email).trim().toLowerCase().replaceAll('.',',');}
 function url(){return root.LabFirebaseConfig.databaseURL+'/adhesiveAccessV1.json';}
 async function load(){var response=await fetch(url(),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Application permissions could not be loaded.');current=await response.json();return current;}
 function level(email){email=String(email||'').toLowerCase();if(!/^[^@\s]+@nvidia\.com$/.test(email))return 'none';if(email==='ymahajna@nvidia.com')return 'admin';return current?.users?.[key(email)]?.level||current?.defaultLevel||'none';}
 function name(email){return current?.users?.[key(email)]?.name||String(email).split('@')[0];}
 async function sync(rows){
  var user=root.LabFirebaseAuth.user();if(!user||!user.emailVerified||user.email.toLowerCase()!=='ymahajna@nvidia.com')throw Error('Sign in and verify ymahajna@nvidia.com to update shared inventory permissions.');
  var policy=root.LabAccess;if(!policy)throw Error('Permissions module unavailable.');
  var users={};new Set(rows.filter(r=>policy.validEmail(r.email)).map(r=>policy.normalize(r.email))).forEach(function(email){users[key(email)]={name:rows.find(r=>policy.normalize(r.email)===email).name,level:policy.levelFor(email,'adhesives',rows)||'none'};});
  var value={schema:1,defaultLevel:policy.generalLevel('adhesives',rows),users:users,updatedAt:new Date().toISOString()};
  var token=await root.LabFirebaseAuth.getIdToken(),response=await fetch(url()+'?auth='+encodeURIComponent(token),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('The shared inventory permission update failed. Retry Sync permissions from Shared setup.');current=await response.json();return current;
 }
 root.LabFirebaseAccess={load:load,level:level,name:name,sync:sync,isActive:()=>Boolean(current)};
})(globalThis);
