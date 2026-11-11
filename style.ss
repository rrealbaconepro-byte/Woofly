<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#36bad8"><title>Woofly — What are you doing?</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="topbar"><div class="topinner">
  <a class="brand" href="#home" aria-label="Woofly home"><img src="https://i.postimg.cc/Z52Q1xw6/IMG-1262.png" alt="Woofly"></a>
  <nav class="nav"><a href="#home">Home</a><a href="#profile">Profile</a><a href="#people">Find People</a></nav>
  <input class="search" id="search" placeholder="Search Woofly..." aria-label="Search posts">
  <div class="authbar"><span class="who" id="who"></span><button class="secondary" id="loginOpen">Sign in</button><button id="signupOpen">Join!</button><button class="secondary hidden" id="logout">Sign out</button></div>
</div></header>
<main class="page" id="home">
  <div class="welcome"><strong>What are you doing?</strong><span>Welcome to the old-school web.</span></div>
  <div class="notice" id="notice" role="status"></div>
  <div class="layout">
    <aside class="leftcol">
      <section class="panel" id="profile"><div class="panelhead">Your little corner</div><div class="panelbody">
        <div class="profiletop"><div class="avatar" id="myAvatar">?</div><div><div class="username" id="myName">Welcome!</div><div class="handle" id="myHandle">Sign in to set up your profile</div></div></div>
        <p class="bio" id="myBio">A little place to share quick updates and keep in touch.</p>
        <div class="stats"><div><b id="statPosts">0</b><span>Posts</span></div><div><b id="statFollowing">0</b><span>Following</span></div><div><b id="statFollowers">0</b><span>Followers</span></div></div>
      </div></section>
      <section class="panel"><div class="panelhead">About Woofly</div><div class="panelbody rightbox"><p>A little place to share quick updates, follow friends, and see what's happening.</p><p>Be kind and keep private information private.</p></div></section>
    </aside>
    <section class="centercol">
      <section class="panel compose"><h2>Post a quick update</h2>
        <textarea id="postInput" maxlength="280" placeholder="What are you doing? (280 characters)" disabled></textarea>
        <div class="composefoot"><span class="counter"><span id="count">0</span>/280 characters</span><button id="postButton" disabled>Update</button></div>
      </section>
      <section class="panel"><div class="tabs"><div class="tab active" data-filter="all">Everyone</div><div class="tab" data-filter="following">Following</div></div><div id="feed"><div class="loading">Sign in to see what's happening on Woofly.</div></div></section>
    </section>
    <aside class="rightcol">
      <section class="panel"><div class="panelhead">What's happening?</div><div class="panelbody"><div class="trend"><b>#HelloWoofly</b><span>Say hello to the community</span></div><div class="trend"><b>#OldWeb</b><span>A little nostalgia</span></div><div class="trend"><b>#WeekendPlans</b><span>Share your plans</span></div><div class="trend"><b>#WebDesign</b><span>Made on the internet</span></div></div></section>
      <section class="panel" id="people"><div class="panelhead">People to follow</div><div class="panelbody" id="peopleList"><p class="hint">Sign in to discover people.</p></div></section>
      <section class="panel"><div class="panelhead">A friendly reminder</div><div class="panelbody rightbox"><p>Don't post private information. You can report inappropriate content to the site administrator.</p></div></section>
    </aside>
  </div>
  <footer class="footer">© 2008–2026 Woofly · About · Help · Terms · Privacy</footer>
</main>
<div class="modal-backdrop" id="authModal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="authTitle">
  <h2 id="authTitle">Welcome to Woofly</h2><form id="authForm">
    <label class="hint" for="displayName">Display name</label><input id="displayName" maxlength="40" placeholder="Your name" autocomplete="name">
    <label class="hint" for="username">Username</label><input id="username" maxlength="20" placeholder="yourname" autocomplete="username">
    <label class="hint" for="email">Email</label><input id="email" type="email" required placeholder="you@example.com" autocomplete="email">
    <label class="hint" for="password">Password</label><input id="password" type="password" required minlength="6" placeholder="At least 6 characters" autocomplete="current-password">
    <div class="rowbtn"><button type="submit" id="authSubmit">Sign in</button><button class="secondary" type="button" id="switchAuth">Create account</button><button class="secondary" type="button" id="closeAuth">Cancel</button></div>
  </form><p class="hint">Demo note: Firebase Authentication and Firestore must be enabled in your Firebase project before accounts and posts can work.</p>
</div></div>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>
<script src="/app.js" defer></script>
</body></html>
