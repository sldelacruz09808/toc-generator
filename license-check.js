/* Dunn's Table of Contents Generator — access check / "kill switch"
   ------------------------------------------------------------------
   IMPORTANT — read this before relying on it:
   This is a SOFT gate, not real security. It stops casual re-sharing (someone
   who installs the PWA normally and doesn't dig into DevTools). It will NOT
   stop someone who is willing to open DevTools, because:
     - all the logic below ships as plain JS to their machine
     - they can block/redirect requests to access-control.json
     - they can edit localStorage by hand
     - they can save a working copy of the page before you revoke it
   Real access control would mean the app's actual content is only served
   by a server that checks a login/token first — not something a static,
   offline-capable PWA can do by design. Treat this as a "please stop using
   this" switch for people acting in good faith, not a lock. */

(function () {
  'use strict';

  // ---- CONFIGURE THIS VALUE ----
  const CONFIG_URL = 'https://sldelacruz09808.github.io/toc-generator/';
  const GRACE_PERIOD_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
  // -------------------------------

  const LS_LAST_OK = 'toc_license_last_ok';   // timestamp (ms) of last confirmed "active"
  const LS_EVER_OK = 'toc_license_ever_ok';   // '1' once we've ever confirmed active

  function lock(message) {
    const el = document.getElementById('lockScreen');
    const msg = document.getElementById('lockMessage');
    if (msg && message) msg.textContent = message;
    if (el) el.style.display = 'flex';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlock() {
    const el = document.getElementById('lockScreen');
    if (el) el.style.display = 'none';
    document.documentElement.style.overflow = '';
  }

  async function checkAccess() {
    let data = null;
    try {
      const res = await fetch(`${CONFIG_URL}?t=${Date.now()}`, { cache: "no-store", mode: "cors" });
      if (res.ok) data = await res.json();
    } catch (err) {
      data = null; // offline, host removed, CORS blocked, etc. — treated the same as "couldn't reach it"
    }

        // 1. If the internet confirms it's active, save approval and unlock immediately
    if (data && data.status === 'active') {
        localStorage.setItem(LS_LAST_OK, String(Date.now()));
        localStorage.setItem(LS_EVER_OK, '1');
        unlock();
        return;
    }

    // 2. If the internet says revoked, explicitly lock them out
    if (data && data.status === 'revoked') {
        lock('Access to Dunnʻs Table of Authorities Generator has expired. Please contact the administrator.');
        return;
    }

    // 3. Offline / Network Delay Fallback: If it has worked before, let it run offline
    if (localStorage.getItem(LS_EVER_OK) === '1') {
        const lastOk = parseInt(localStorage.getItem(LS_LAST_OK) || '0', 10);
        const age = Date.now() - lastOk;
        
        // Allow running offline for up to 5 days before forcing an online check
        if (age < GRACE_PERIOD_MS) {
            unlock();
            return;
        } else {
            lock('This app hasnʻt been able to verify access in over 5 days. Please reconnect to the internet to continue.');
            return;
        }
    }

    // 4. Total Fail: No internet and has never been successfully activated before
    lock('Couldnʻt verify access. Please connect to the internet once to activate this app.');


  checkAccess();
})();
