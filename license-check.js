/* Dunn's Table of Authorities Generator — access check / "kill switch"
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

  // ---- CONFIGURE THESE TWO VALUES ----
  const CONFIG_URL = 'https://yourdomain.com/access-control.json';
  const GRACE_PERIOD_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
  // -------------------------------------

  const LS_LAST_OK = 'toa_license_last_ok';   // timestamp (ms) of last confirmed "active"
  const LS_EVER_OK = 'toa_license_ever_ok';   // '1' once we've ever confirmed active

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
      const res = await fetch(CONFIG_URL, { cache: 'no-store', mode: 'cors' });
      if (res.ok) data = await res.json();
    } catch (err) {
      data = null; // offline, host removed, CORS blocked, etc. — treated the same as "couldn't reach it"
    }

    if (data && data.status === 'active') {
      localStorage.setItem(LS_LAST_OK, String(Date.now()));
      localStorage.setItem(LS_EVER_OK, '1');
      unlock();
      return;
    }

    if (data && data.status === 'revoked') {
      lock('Access to Dunn’s Table of Authorities Generator has expired. Please contact the administrator.');
      return;
    }

    // Couldn't reach the config file at all (offline, or the host is gone).
    const everOk = localStorage.getItem(LS_EVER_OK) === '1';
    if (!everOk) {
      // Never once confirmed active on this device — don't allow first run offline.
      lock('Couldn’t verify access. Please connect to the internet once to activate this app.');
      return;
    }
    const lastOk = parseInt(localStorage.getItem(LS_LAST_OK) || '0', 10);
    const age = Date.now() - lastOk;
    if (age > GRACE_PERIOD_MS) {
      lock('This app hasn’t been able to verify access in over 5 days. Please reconnect to the internet to continue.');
      return;
    }
    // Within the offline grace period — let it run.
    unlock();
  }

  checkAccess();
})();
