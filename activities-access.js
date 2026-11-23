(function(root){
 'use strict';let current=null;
 const key=email=>String(email).trim().toLowerCase().replaceAll('.',',');
 const url=()=>root.LabFirebaseConfig.databaseURL+'/activitiesAccessV1.json';
 async function load(){const r=await fetch(url(),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Activities permissions could not be loaded. Complete Shared setup or retry.');current=await r.json();return current;}
 function level(email){email=String(email||'').toLowerCase();if(!/^[^@\s]+@nvidia\.com$/.test(email))return 'none';if(email==='ymahajna@nvidia.com')return 'admin';return current?.users?.[key(email)]?.level||current?.defaultLevel||'none';}
 const role=email=>({viewer:'guest',editor:'lab',manager:'admin',admin:'admin'})[level(email)]||null;
 const name=email=>current?.users?.[key(email)]?.name||String(email).split('@')[0];
 async function sync(rows){
  const user=root.LabFirebaseAuth.user();if(!user?.emailVerified||user.email.toLowerCase()!=='ymahajna@nvidia.com')throw Error('Verified owner sign-in is required to update Activities permissions.');
  const p=root.LabAccess,users={};new Set(rows.filter(r=>p.validEmail(r.email)).map(r=>p.normalize(r.email))).forEach(email=>{users[key(email)]={name:rows.find(r=>p.normalize(r.email)===email).name,level:p.levelFor(email,'activities',rows)||'none'};});
  const data={schema:1,defaultLevel:p.generalLevel('activities',rows),users,updatedAt:new Date().toISOString()},token=await root.LabFirebaseAuth.getIdToken();
  const r=await fetch(url()+'?auth='+encodeURIComponent(token),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Activities permission sync failed. Open Shared setup and retry Sync permissions.');current=await r.json();return current;
 }
 root.ActivitiesFirebaseAccess={load,level,role,name,sync};
})(globalThis);
