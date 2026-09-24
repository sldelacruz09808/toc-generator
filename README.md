# Dunn's Table of Authorities Generator — PWA build

## What's in this folder

- `index.html` — the app, rebuilt from your Claude artifact as a standalone page (no more calls into Claude — downloads now use a plain browser save).
- `manifest.json` — makes it installable ("Add to Home Screen" / "Install app").
- `sw.js` — service worker; caches everything so it works fully offline once installed.
- `license-check.js` — the access check / kill switch. **Read the warning at the top of that file before you rely on it — see "How much protection this actually gives you" below.**
- `icons/` — you need to add real icon files here (see step 2).
- `vendor/` — you need to add the two library files here (see step 1). Empty for now.

Read this whole file before you host anything — a few steps below are things only you can do (there's no server-side code here for me to run on your behalf).

## Before you host it

### 1. Add the vendored libraries

The app now loads `pdf.js` and `JSZip` from your own site instead of a CDN, so the service worker can reliably cache them for offline use. Download these three files and put them in `vendor/`:

- https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
- https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
- https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

Save each with the same filename, inside `vendor/`.

### 2. Add real icons

`manifest.json` and `index.html` point at:
- `icons/icon-192.png` (192×192)
- `icons/icon-512.png` (512×512)
- `icons/icon-maskable-512.png` (512×512, your logo with generous padding so it survives being cropped to a circle/rounded-square on Android)

Any square PNG works to start — even a plain navy square with "TOA" in white letters. https://realfavicongenerator.net or https://maskable.app/editor can generate all three from one image.

### 3. Host it somewhere with HTTPS

PWAs require HTTPS (or `localhost` for testing) — plain HTTP won't install. Easiest free options for a static site like this:
- **GitHub Pages** — free, gives you `https://<you>.github.io/<repo>/`
- **Netlify** or **Vercel** — free tier, drag-and-drop deploy from a folder

Upload this whole folder (after steps 1 and 2) to whichever you pick.

### 4. Set up the access-control check

`license-check.js` fetches `https://yourdomain.com/access-control.json` — **change that URL** at the top of the file to wherever you'll host that one JSON file (it can be a separate tiny file on the same host, or even a different free static host — it doesn't need to live next to the app).

Content when access should work:
```json
{ "status": "active" }
```

Content to revoke access (or delete the file / take the host down entirely — the app treats "unreachable" the same as "revoked" once the 5-day grace period is up):
```json
{ "status": "revoked" }
```

### 5. (Optional) Obfuscate the JavaScript

This raises the bar for someone poking at your code in DevTools, though see the caveat below about what it can't do. From a machine with Node.js installed, in this folder:

```bash
npx javascript-obfuscator index.html --output index.obf.html --self-defending true --disable-console-output true
```

That tool works best on plain `.js` files rather than inline `<script>` blocks inside HTML, so for a cleaner result, pull the big inline `<script>` block out of `index.html` into its own file (e.g. `app.js`), then run:

```bash
npx javascript-obfuscator app.js --output app.obf.js --self-defending true --disable-console-output true --control-flow-flattening true
```

...and point `index.html` at `app.obf.js` instead. Re-run this any time you edit the app.

## How to install it once it's hosted

- **Windows (Chrome or Edge):** visit the site, click the install icon (⊕) in the address bar, or Menu → "Install Dunn's Table of Authorities Generator…" It opens after that as its own window, listed in the Start Menu like a regular app.
- **Android (Chrome):** visit the site, tap the menu (⋮) → "Add to Home screen" / "Install app."

## How much protection this actually gives you — please read

Be realistic about what this setup can and can't do, especially before you rely on it for anything you're charging for:

- **The kill switch is a courtesy gate, not a lock.** Everything — the check itself, the grace period, the lock screen — runs as plain JavaScript on the other person's device. Anyone willing to open DevTools can read `access-control.json`'s URL, block it, or simply edit `localStorage` to make the app think it already passed. Obfuscation (step 5) makes that *more annoying*, not *impossible*.
- **Someone can save a working offline copy before you revoke access.** Once the service worker has cached the app once, it keeps working offline for up to 5 days by design (that's the grace period you asked for) — and a technical user could extend that indefinitely by tampering with the stored timestamp.
- **This is fine for its actual purpose:** stopping the file from quietly circulating past the person you meant to give it to, and giving you a way to turn it off for someone in good faith (a contractor relationship ending, a trial period expiring, etc.). It is not equivalent to a paid product with real licensing — that would need the app's real logic to live on a server you control, with each user's request checked before anything useful is returned, which is a fundamentally different (and more work to build) architecture than a static offline-capable PWA.

If you end up wanting to sell access to this rather than just share it with people you trust, it's worth a short follow-up conversation about that server-backed approach rather than layering more client-side checks onto this one.
