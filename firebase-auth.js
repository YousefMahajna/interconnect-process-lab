/* Shared Firebase session across the lab's pages on the same origin. */
(function(root){
 'use strict';
 var readyPromise,auth,sdk,listeners=[];
 function valid(email){return /^[A-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@nvidia\.com$/i.test(String(email||'').trim());}
 async function ready(){
  if(!readyPromise)readyPromise=(async function(){
   var modules=await Promise.all([import('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js')]);
   sdk=modules[1];var name='interconnect-shared',app=modules[0].getApps().find(function(a){return a.name===name;})||modules[0].initializeApp(root.LabFirebaseConfig,name);
   auth=sdk.getAuth(app);await sdk.setPersistence(auth,sdk.browserLocalPersistence);await auth.authStateReady();
   sdk.onAuthStateChanged(auth,function(){listeners.forEach(function(fn){fn(user());});});return auth;
  })().catch(function(error){readyPromise=null;throw error;});return readyPromise;
 }
 function user(){return auth&&auth.currentUser;}
 async function signIn(email,password){email=String(email).trim().toLowerCase();if(!valid(email))throw Error('Use your NVIDIA email address.');await ready();return sdk.signInWithEmailAndPassword(auth,email,password);}
 async function register(email,password){email=String(email).trim().toLowerCase();if(!valid(email))throw Error('Use your NVIDIA email address.');if(String(password).length<12)throw Error('Choose a separate lab-app password with at least 12 characters.');await ready();var result=await sdk.createUserWithEmailAndPassword(auth,email,password);await sdk.sendEmailVerification(result.user);return result;}
 async function verify(){await ready();if(!user())throw Error('Sign in first.');await sdk.sendEmailVerification(user());}
 async function refresh(){await ready();if(user()){await sdk.reload(user());await user().getIdToken(true);}listeners.forEach(function(fn){fn(user());});return user();}
 async function token(){await ready();var current=user();if(!current)return null;if(!valid(current.email)||!current.emailVerified)throw Error('Verify your NVIDIA email before saving shared changes.');return current.getIdToken();}
 async function reset(email){email=String(email).trim().toLowerCase();if(!valid(email))throw Error('Use your NVIDIA email address.');await ready();await sdk.sendPasswordResetEmail(auth,email);}
 async function signOut(){await ready();return sdk.signOut(auth);}
 root.LabFirebaseAuth={ready:ready,user:user,signIn:signIn,register:register,sendVerification:verify,refresh:refresh,getIdToken:token,resetPassword:reset,signOut:signOut,onChange:function(fn){listeners.push(fn);return function(){listeners=listeners.filter(function(f){return f!==fn;});};}};
})(globalThis);
