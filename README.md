# Dunn's Table of Contents Generator — PWA build

## What's in this folder

- `index.html` — the app, rebuilt from your Claude artifact as a standalone page (no more calls into Claude — downloads now use a plain browser save).
- `manifest.json` — makes it installable ("Add to Home Screen" / "Install app").
- `sw.js` — service worker; caches everything so it works fully offline once installed.
- `license-check.js` — the access check / kill switch. **Read the warning at the top of that file before you rely on it — see "How much protection this actually gives you" below.**
- `icons/` — placeholder icons are already included (navy/teal square with "TOC"). Swap in real ones any time.
- `vendor/` — the three library files (`pdf.min.js`, `pdf.worker.min.js`, `jszip.min.js`) are already included here, copied from your Table of Authorities build so you don't have to hunt them down again.

Read this whole file before you host anything.

## Before you host it

### 1. Vendored libraries — already done

Unlike the first time around, this folder ships with `vendor/pdf.min.js`, `vendor/pdf.worker.min.js`, and `vendor/jszip.min.js` already in place — the same files your TOA generator uses. Nothing to do here.

### 2. Icons

Placeholder icons are already in `icons/`. Any square PNG works if you want to replace them — even a plain square with initials. https://realfavicongenerator.net or https://maskable.app/editor can generate a fresh set from one image.

### 3. Host it somewhere with HTTPS

Same as your TOA generator — **GitHub Pages** is the easiest free option: create a new repo (e.g. `toc-generator`), and upload this whole folder's contents to it, keeping the `vendor/` and `icons/` folders as real folders (not files) in the repo. If you hit the "vendor ended up as a file instead of a folder" issue again, the fix is the same one that worked last time: upload the files to the repo root, then use the pencil "Edit this file" icon on each one to rename it with a `vendor/` or `icons/` prefix, which moves it into a real folder.

### 4. Set up the access-control check

`license-check.js` fetches `https://yourdomain.com/access-control.json` — **change that URL** at the top of the file. Since you already have a working distribution host for the TOA generator's kill switch (`https://sldelacruz09808.github.io/app-distribution/access-control.json`), the simplest option is a **second, separate JSON file on that same host** — e.g. `https://sldelacruz09808.github.io/app-distribution/toc-access-control.json` — so you can revoke the TOC generator independently of the TOA generator.

Content when access should work:
```json
{ "status": "active" }
```

Content to revoke access (or delete the file / take the host down entirely — the app treats "unreachable" the same as "revoked" once the 5-day grace period is up):
```json
{ "status": "revoked" }
```

### 5. (Optional) Obfuscate the JavaScript

Same as before — raises the bar for DevTools tampering, though see the caveat below about what it can't do. From a machine with Node.js installed, in this folder:

```bash
npx javascript-obfuscator index.html --output index.obf.html --self-defending true --disable-console-output true
```

That tool works best on plain `.js` files rather than inline `<script>` blocks inside HTML, so for a cleaner result, pull the big inline `<script>` blocks out of `index.html` into their own file (e.g. `app.js`), then run:

```bash
npx javascript-obfuscator app.js --output app.obf.js --self-defending true --disable-console-output true --control-flow-flattening true
```

...and point `index.html` at `app.obf.js` instead. Re-run this any time you edit the app.

## How to install it once it's hosted

- **Windows (Chrome or Edge):** visit the site, click the install icon (⊕) in the address bar, or Menu → "Install Dunn's Table of Contents Generator…" It opens after that as its own window, listed in the Start Menu like a regular app.
- **Android (Chrome):** visit the site, tap the menu (⋮) → "Add to Home screen" / "Install app."

## How much protection this actually gives you — please read

Be realistic about what this setup can and can't do, especially before you rely on it for anything you're charging for:

- **The kill switch is a courtesy gate, not a lock.** Everything — the check itself, the grace period, the lock screen — runs as plain JavaScript on the other person's device. Anyone willing to open DevTools can read `access-control.json`'s URL, block it, or simply edit `localStorage` to make the app think it already passed. Obfuscation (step 5) makes that *more annoying*, not *impossible*.
- **Someone can save a working offline copy before you revoke access.** Once the service worker has cached the app once, it keeps working offline for up to 5 days by design (that's the grace period you asked for) — and a technical user could extend that indefinitely by tampering with the stored timestamp.
- **This is fine for its actual purpose:** stopping the file from quietly circulating past the person you meant to give it to, and giving you a way to turn it off for someone in good faith (a contractor relationship ending, a trial period expiring, etc.). It is not equivalent to a paid product with real licensing — that would need the app's real logic to live on a server you control, with each user's request checked before anything useful is returned, which is a fundamentally different (and more work to build) architecture than a static offline-capable PWA.

If you end up wanting to sell access to this rather than just share it with people you trust, it's worth a short follow-up conversation about that server-backed approach rather than layering more client-side checks onto this one.
