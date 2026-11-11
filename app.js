(() => {
  const $ = (id) => document.getElementById(id);
  const state = { user: null, profile: null, mode: 'login', posts: [], following: new Set(), unsubFeed: null, unsubFollowing: null };
  const notice = (message) => { $('notice').textContent = message; $('notice').style.display = 'block'; clearTimeout(notice.timer); notice.timer = setTimeout(() => $('notice').style.display = 'none', 3500); };
  const escapeText = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const timeAgo = (stamp) => { const date = stamp && stamp.toDate ? stamp.toDate() : new Date(); const seconds = Math.max(0, Math.floor((Date.now()-date.getTime())/1000)); if(seconds<60)return 'just now'; if(seconds<3600)return `${Math.floor(seconds/60)} min ago`; if(seconds<86400)return `${Math.floor(seconds/3600)} hr ago`; return date.toLocaleDateString(); };
  let db, auth, firebaseReady = false;

  async function boot() {
    try {
      const response = await fetch('/api/firebase-config');
      const config = await response.json();
      if (!config.apiKey || !config.projectId || !config.appId) throw new Error('Firebase configuration is missing. Add the FIREBASE_* environment variables in Render.');
      firebase.initializeApp(config); auth = firebase.auth(); db = firebase.firestore(); firebaseReady = true;
      auth.onAuthStateChanged(handleAuth);
    } catch (error) { $('feed').innerHTML = `<div class="empty">${escapeText(error.message)}<br><br>Set up Firebase and refresh this page.</div>`; notice(error.message); }
  }

  function openAuth(mode) {
    if (!firebaseReady) { notice('Firebase is not configured yet. Add your Firebase web config in Render.'); return; }
    state.mode = mode; $('authTitle').textContent = mode === 'signup' ? 'Join Woofly!' : 'Welcome back!';
    $('displayName').classList.toggle('hidden', mode !== 'signup'); $('username').classList.toggle('hidden', mode !== 'signup');
    $('authSubmit').textContent = mode === 'signup' ? 'Create account' : 'Sign in'; $('switchAuth').textContent = mode === 'signup' ? 'I already have an account' : 'Create account';
    $('password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password'; $('authModal').classList.add('open');
  }
  $('loginOpen').addEventListener('click', () => openAuth('login'));
  $('signupOpen').addEventListener('click', () => openAuth('signup'));
  $('closeAuth').addEventListener('click', () => $('authModal').classList.remove('open'));
  $('switchAuth').addEventListener('click', () => openAuth(state.mode === 'signup' ? 'login' : 'signup'));
  $('authModal').addEventListener('click', e => { if(e.target === $('authModal')) $('authModal').classList.remove('open'); });

  $('authForm').addEventListener('submit', async e => {
    e.preventDefault(); if(!firebaseReady) return;
    const email = $('email').value.trim(), password = $('password').value;
    $('authSubmit').disabled = true;
    try {
      if(state.mode === 'signup') {
        const displayName = $('displayName').value.trim(), username = $('username').value.trim().replace(/^@/,'').toLowerCase();
        if(!displayName || !/^[a-z0-9_]{3,20}$/.test(username)) throw new Error('Choose a display name and a username (3–20 letters, numbers or underscores).');
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        await db.collection('users').doc(credential.user.uid).set({ uid: credential.user.uid, displayName, username, bio: 'Just joined Woofly!', photoURL: '', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      } else await auth.signInWithEmailAndPassword(email, password);
      $('authModal').classList.remove('open'); $('authForm').reset();
    } catch(error) { notice(error.message); }
    finally { $('authSubmit').disabled = false; }
  });
  $('logout').addEventListener('click', () => auth && auth.signOut());

  async function handleAuth(user) {
    state.user = user || null;
    if(state.unsubFeed) state.unsubFeed(); if(state.unsubFollowing) state.unsubFollowing();
    state.unsubFeed = state.unsubFollowing = null; state.following = new Set(); state.posts = [];
    $('loginOpen').classList.toggle('hidden', !!user); $('signupOpen').classList.toggle('hidden', !!user); $('logout').classList.toggle('hidden', !user);
    $('who').textContent = user ? 'Signed in' : '';
    $('postInput').disabled = !user; $('postButton').disabled = !user;
    if(!user) { state.profile=null; renderProfile(); $('feed').innerHTML='<div class="empty">Sign in to see the Woofly timeline.</div>'; $('peopleList').innerHTML='<p class="hint">Sign in to discover people.</p>'; return; }
    try {
      const ref = db.collection('users').doc(user.uid); let snap = await ref.get();
      if(!snap.exists) { const fallback = {uid:user.uid,displayName:user.displayName || 'Woofly User',username:(user.email||'member').split('@')[0].replace(/[^a-z0-9_]/gi,'').slice(0,20) || 'member',bio:'Just hanging out on Woofly!',photoURL:'',createdAt:firebase.firestore.FieldValue.serverTimestamp()}; await ref.set(fallback); snap=await ref.get(); }
      state.profile = snap.data(); renderProfile(); startFeed(); loadPeople(); loadStats();
    } catch(error) { notice('Could not load your profile: '+error.message); }
  }
  function renderProfile() {
    const p=state.profile; $('myName').textContent=p?p.displayName:'Welcome!'; $('myHandle').textContent=p?'@'+p.username:'Sign in to set up your profile'; $('myBio').textContent=p?(p.bio||''):'A little place to share quick updates and keep in touch.'; $('myAvatar').textContent=p?(p.displayName||'?').charAt(0).toUpperCase():'?';
  }
  function startFeed() {
    state.unsubFeed = db.collection('posts').orderBy('createdAt','desc').limit(60).onSnapshot(snapshot => {
      state.posts=snapshot.docs.map(doc=>({id:doc.id,...doc.data()})); renderFeed();
      $('statPosts').textContent=String(state.posts.filter(p=>p.uid===state.user.uid).length);
    }, error => { notice('Feed error: '+error.message+' Check Firestore rules.'); });
    state.unsubFollowing = db.collection('users').doc(state.user.uid).collection('following').onSnapshot(snap=>{state.following=new Set(snap.docs.map(d=>d.id));renderFeed();loadStats();},()=>{});
  }
  function renderFeed() {
    const query=$('search').value.trim().toLowerCase(); const followingOnly=document.querySelector('.tab.active')?.dataset.filter==='following';
    const posts=state.posts.filter(p=>(!followingOnly || p.uid===state.user.uid || state.following.has(p.uid)) && (!query || `${p.text} ${p.displayName} ${p.username}`.toLowerCase().includes(query)));
    if(!posts.length){$('feed').innerHTML='<div class="empty">No posts here yet. Be the first to say something!</div>';return;}
    $('feed').innerHTML=posts.map(p=>`<article class="post" data-post="${escapeText(p.id)}"><div class="avatar">${escapeText((p.displayName||'?').charAt(0).toUpperCase())}</div><div class="postmain"><div class="posthead"><strong>${escapeText(p.displayName||'Woofly user')}</strong><span>@${escapeText(p.username||'member')} · ${timeAgo(p.createdAt)}</span></div><div class="posttext">${escapeText(p.text)}</div><div class="actions"><button class="like" data-action="like">♡ Like</button><button data-action="comments">Reply</button>${p.uid===state.user.uid?'<button data-action="delete">Delete</button>':''}</div><div class="replylist" data-replies></div></div></article>`).join('');
    posts.forEach(p=>watchPostBits(p));
  }
  function watchPostBits(post) {
    const el=$(`feed`).querySelector(`[data-post="${post.id}"]`); if(!el)return;
    db.collection('posts').doc(post.id).collection('likes').doc(state.user.uid).get().then(s=>{const b=el.querySelector('[data-action="like"]');if(b){b.textContent=s.exists?'♥ Liked':'♡ Like';b.classList.toggle('liked',s.exists);}}).catch(()=>{});
    db.collection('posts').doc(post.id).collection('comments').orderBy('createdAt','asc').limit(3).onSnapshot(s=>{const target=el.querySelector('[data-replies]');if(target)target.innerHTML=s.docs.map(d=>{const c=d.data();return `<div class="replyitem"><b>${escapeText(c.displayName||'Member')}:</b> ${escapeText(c.text)}</div>`}).join('');});
  }
  $('postInput').addEventListener('input',()=> $('count').textContent=$('postInput').value.length);
  $('postButton').addEventListener('click',async()=>{
    const text=$('postInput').value.trim(); if(!state.user){notice('Sign in to post.');return;} if(!text)return;
    $('postButton').disabled=true;
    try { await db.collection('posts').add({uid:state.user.uid,displayName:state.profile.displayName,username:state.profile.username,text,createdAt:firebase.firestore.FieldValue.serverTimestamp()}); $('postInput').value='';$('count').textContent='0';notice('Your update is live on Woofly!'); }
    catch(error){notice('Could not publish: '+error.message);} finally{$('postButton').disabled=false;}
  });
  $('feed').addEventListener('click',async e=>{
    const b=e.target.closest('button[data-action]'); if(!b)return;const postEl=b.closest('[data-post]'),postId=postEl.dataset.post,post=state.posts.find(p=>p.id===postId);if(!post)return;
    try {
      if(b.dataset.action==='like'){const ref=db.collection('posts').doc(postId).collection('likes').doc(state.user.uid);const liked=await ref.get();if(liked.exists)await ref.delete();else await ref.set({uid:state.user.uid,createdAt:firebase.firestore.FieldValue.serverTimestamp()});b.textContent=liked.exists?'♡ Like':'♥ Liked';b.classList.toggle('liked',!liked.exists);}
      if(b.dataset.action==='comments'){let box=postEl.querySelector('.replybox');if(box){box.remove();return;}box=document.createElement('div');box.className='replybox';box.innerHTML='<input maxlength="280" placeholder="Write a reply..." aria-label="Write a reply"><button>Send</button>';postEl.querySelector('.postmain').appendChild(box);box.querySelector('button').addEventListener('click',async()=>{const value=box.querySelector('input').value.trim();if(!value)return;await db.collection('posts').doc(postId).collection('comments').add({uid:state.user.uid,displayName:state.profile.displayName,text:value,createdAt:firebase.firestore.FieldValue.serverTimestamp()});box.remove();});}
      if(b.dataset.action==='delete' && confirm('Delete this post?')) await db.collection('posts').doc(postId).delete();
    } catch(error){notice('Action failed: '+error.message);}
  });
  document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');renderFeed();}));
  $('search').addEventListener('input',renderFeed);
  async function loadPeople(){try{const snap=await db.collection('users').limit(12).get();const people=snap.docs.map(d=>d.data()).filter(p=>p.uid!==state.user.uid).slice(0,6);$('peopleList').innerHTML=people.length?people.map(p=>`<div class="person"><div class="avatar">${escapeText((p.displayName||'?').charAt(0).toUpperCase())}</div><div class="personinfo"><b>${escapeText(p.displayName||'Member')}</b><small>@${escapeText(p.username||'member')}</small></div><button class="follow ${state.following.has(p.uid)?'follow-state':''}" data-follow="${escapeText(p.uid)}">${state.following.has(p.uid)?'✓ Following':'+ Follow'}</button></div>`).join(''):'<p class="hint">You are one of the first here. Invite a friend!</p>'; }catch(e){/* Firestore may be warming up */}}
  $('peopleList').addEventListener('click',async e=>{const b=e.target.closest('[data-follow]');if(!b)return;const target=b.dataset.follow,ref=db.collection('users').doc(state.user.uid).collection('following').doc(target);try{if(state.following.has(target)){await ref.delete();await db.collection('users').doc(target).collection('followers').doc(state.user.uid).delete();}else{await ref.set({uid:target,createdAt:firebase.firestore.FieldValue.serverTimestamp()});await db.collection('users').doc(target).collection('followers').doc(state.user.uid).set({uid:state.user.uid,createdAt:firebase.firestore.FieldValue.serverTimestamp()});await db.collection('users').doc(target).collection('notifications').add({fromUid:state.user.uid,type:'follow',createdAt:firebase.firestore.FieldValue.serverTimestamp(),read:false});}loadPeople();}catch(error){notice('Could not update follow: '+error.message);}});
  async function loadStats(){if(!state.user)return;try{const [f1,f2]=await Promise.all([db.collection('users').doc(state.user.uid).collection('following').get(),db.collection('users').doc(state.user.uid).collection('followers').get()]);$('statFollowing').textContent=f1.size;$('statFollowers').textContent=f2.size;}catch(e){}}
  boot();
})();
