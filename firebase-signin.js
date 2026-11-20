(function(root){
 'use strict';
 var dialog,pending;
 function open(){
  if(dialog?.open)return pending;
  if(!dialog){
   dialog=document.createElement('dialog');dialog.id='firebaseSignIn';dialog.style.cssText='background:#202020;color:white;border:1px solid #76b900;border-radius:18px;padding:28px;max-width:430px;width:calc(100% - 60px);font:15px system-ui;';
   dialog.innerHTML='<form method="dialog"><h2>Shared inventory sign-in</h2><p>Use your NVIDIA email and a separate lab-app password.</p><label>Email<input name="email" type="email" autocomplete="username" required style="display:block;width:95%;padding:10px;margin:8px 0 16px"></label><label>Lab-app password<input name="password" type="password" autocomplete="current-password" style="display:block;width:95%;padding:10px;margin:8px 0 16px"></label><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-action="signIn">Sign in</button><button type="button" data-action="register">Create account</button><button type="button" data-action="refresh">I verified my email</button><button type="button" data-action="sendVerification">Resend verification</button><button type="button" data-action="resetPassword">Reset password</button><button value="cancel">Close</button></div><p role="status" style="line-height:1.5;overflow-wrap:anywhere"></p></form>';
   document.body.append(dialog);
  }
  var form=dialog.querySelector('form'),status=dialog.querySelector('[role=status]');status.textContent='';
  form.email.value=root.LabFirebaseAuth.user()?.email||new URLSearchParams(location.hash.slice(1)).get('email')||'';
  pending=new Promise(function(resolve){dialog.onclose=function(){form.password.value='';resolve(root.LabFirebaseAuth.user());};});
  dialog.onclick=async function(event){
   var action=event.target.dataset.action;if(!action)return;
   var controls=[...form.querySelectorAll('button')];controls.forEach(b=>b.disabled=true);status.textContent='Please wait…';
   try{
    if(action==='signIn'||action==='register')await root.LabFirebaseAuth[action](form.email.value,form.password.value);
    else if(action==='resetPassword'){await root.LabFirebaseAuth.resetPassword(form.email.value);status.textContent='If this account is registered, a password reset email will arrive.';return;}
    else await root.LabFirebaseAuth[action]();
    form.password.value='';var user=root.LabFirebaseAuth.user();
    if(user?.emailVerified){status.textContent='Signed in.';dialog.close('success');}
    else status.textContent='Open the verification email in your NVIDIA inbox, then click “I verified my email”.';
   }catch(error){status.textContent=error.message;}finally{controls.forEach(b=>b.disabled=false);}
  };
  dialog.showModal();form.email.focus();return pending;
 }
 root.LabFirebaseSignIn={open:open};
})(globalThis);
