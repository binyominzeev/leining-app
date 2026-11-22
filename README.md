# Leining App

A web app for practising Torah reading (leining) with cantillation marks (ta'amim / trop).

## Features

- **Word-by-word playback** — step through the text at an adjustable speed
- **Ta'am display** — shows the cantillation mark name for the currently highlighted word
- **Two navigation modes**
  - *Manual* — choose any book, chapter, and verse range from the full Tanach
  - *Parasha* — load the current week's Torah portion directly from the Sefaria calendar
- **Progress persistence** — your last reading position is saved so you can pick up where you left off
- **Pocket ID accounts** — sync highlights, speed, reading position, and scroll font size across devices
- **Right-to-left Hebrew UI** with Frank Ruhl Libre typeface
- **Sefer Torah mode** — column view with playback, word highlighting, hand-sign videos, and aliyah markers

## Screenshots

Choose a parasha:

<img width="1920" height="1080" alt="Screenshot from 2026-03-26 23-43-15" src="https://github.com/user-attachments/assets/abadd92a-6dcc-463d-bd62-d43641659880" />

Read along (or ahead) in your own set pace (WPM = words per minute):

<img width="1920" height="1080" alt="Screenshot from 2026-03-26 23-43-26" src="https://github.com/user-attachments/assets/c7dd2fcb-e514-4fcd-a7e9-4a427327ad4b" />

Sefer Torah mode (with aliyos showing):

<img width="1920" height="1080" alt="Screenshot from 2026-03-26 23-43-34" src="https://github.com/user-attachments/assets/47756a5a-7815-4f60-bb43-e31fa2f8a402" />

## Hand-sign (trop) videos

While reading, the app converts each word's ta'am to a hand-sign name (e.g. `mercha`, `tipcha`, `etnachta`) and plays the clip matching the **longest sequence** that starts at the current word (within one verse). If Mercha is followed by another cantillation mark on the same word, Mercha is ignored for video playback. Enable it with the "סרטון טעמים" checkbox.

### Adding a clip

1. Name the file after the sequence, signs joined by `_`, lowercase: `src/assets/taam-videos/mercha_tipcha_etnachta.mp4`. A single sign is a one-element sequence: `munach.mp4`.
2. Drop it into `src/assets/taam-videos/` (`.mp4` or `.webm`). Files starting with `_` are ignored.
3. Restart `npm run dev` (or rebuild). No code changes or manifest needed.

Sign names (also in `TAAM_SLUGS` in `src/utils/taamim.ts`): etnachta, segol, shalshelet, zakef-katon, zakef-gadol, tipcha, revia, zarka, pashta, yetiv, tevir, geresh, geresh-muqdam, gershayim, karnei-para, telisha-gedola, pazer, etnachta-hafuch, munach, mapach, mercha, mercha-kefula, darga, kadma, telisha-ketana, yerach-ben-yomo, ole, iluy, dechi, zinor, and `silluk` (last word of a verse). Example sequence: `mercha_tipcha_etnachta`.

### Recommended format

MP4 (H.264, `yuv420p`, no audio), 480p, 30 fps, 2–5 s, short keyframe interval for fast starts and switching. The same framing and background in every clip avoids visual jumps. The clip's playback rate is adjusted (0.5×–2×) to fit the current reading speed.

```bash
ffmpeg -i in.mov -an -vf scale=-2:480 -r 30 -c:v libx264 -pix_fmt yuv420p \
  -crf 26 -g 15 -movflags +faststart mercha_tipcha_etnachta.mp4
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 18](https://react.dev/) |
| Language | TypeScript |
| Build tool | [Vite](https://vitejs.dev/) |
| Text source | [Sefaria API](https://www.sefaria.org/developers) |
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Auth | Pocket ID OIDC (Authorization Code + PKCE, JWT verification with jose) |

## Getting Started (local development)

### Prerequisites

- Node.js 20, 22, 23, 24 or 25 (required by better-sqlite3)
- npm 9 or later
- A Pocket ID client with a registered redirect URI

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
cd server
npm install
cp .env.example .env   # edit .env and configure Pocket ID
cd ..
```

Set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`
and `CORS_ORIGIN` in `server/.env`. The redirect URI must exactly match the
registered Pocket ID URI and the frontend origin followed by `/` (for example
`http://localhost:5173/`). Set `OIDC_AUDIENCE` if access tokens have an
audience to enforce. The client secret stays on the backend; the frontend gets
the public issuer and client ID from `/api/auth/config`.

### Pocket ID Callback URL

In the Pocket ID client settings, set the **Callback URL / Redirect URI** to
the frontend's origin followed by `/`:

- Local development: `http://localhost:5173/`
- Production: `https://yourdomain.com/` (replace with your frontend domain)

Set `OIDC_REDIRECT_URI` in `server/.env` to exactly the same URL, including
the trailing slash. The protocol, hostname and port must also match the URL
used to open the frontend.

### Start the backend

```bash
cd server
npm run dev      # uses node --watch for auto-reload
```

The API server starts on `http://localhost:3001`.

### Start the frontend dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Vite automatically proxies `/api` requests to the backend.

### Production build

```bash
npm run build
```

The compiled output is placed in the `dist/` directory.

### Lint

Run `npm run lint` from the project root to check the frontend and server code.

### Preview production build

```bash
npm run preview
```

## Project Structure

```
server/                   # Node.js/Express API backend
├── index.js              # Entry point – starts the server
├── db.js                 # SQLite database setup
├── routes/
│   ├── auth.js           # Pocket ID token proxy and JWT validation
│   └── user.js           # Profile data and local-data import
├── package.json
└── .env.example          # Sample environment variables

src/
├── components/           # React UI components
│   ├── Controls          # Playback controls (play/pause, speed)
│   ├── Navigation        # Book/chapter/parasha selector
│   ├── TaamPanel         # Cantillation mark display
│   └── TextDisplay       # Hebrew text with word highlighting
├── hooks/
│   └── usePlayback       # Playback state and timer logic
├── utils/
│   ├── auth.ts           # OIDC client, token refresh and pending sync
│   ├── hebrew.ts         # Hebrew text parsing helpers
│   ├── sefaria.ts        # Sefaria API client + book/parasha data
│   ├── storage.ts        # LocalStorage position persistence (anonymous)
│   └── taamim.ts         # Cantillation mark name and image maps
├── assets/
│   └── powered-by-sefaria.svg
├── types.ts              # Shared TypeScript types
└── main.tsx              # App entry point
```

## Usage

1. **Select a passage** — use the *בחר קטע* (Manual) tab to pick a book, chapter, and verse range, or switch to *פרשת השבוע* (Weekly Parasha) to load the current Torah portion.
2. **Load** — press the *טען* button to fetch the Hebrew text from Sefaria.
3. **Read** — click the play button (▶) to advance through the words automatically, or click any word to jump to it.
4. **Adjust speed** — use the speed slider in the controls bar to set a comfortable pace.
5. **Account** — click *כניסה עם Pocket ID* and sign in. Highlights, speed,
   reading position, and scroll font size are saved per Pocket ID subject. Failed writes are kept
   locally and retried on reload or when the tab becomes visible.
6. **Sefer Torah practice** — in the column view, select *הסתר ניקוד וטעמים*
   to hide all vowel and cantillation marks while the active word is highlighted.
   Optionally select *הצג באיחור* and set a distance in words: at word 30, a
   distance of 10 shows marks through word 20. Paragraph and aliyah markers do
   not count as words. In the unmarked text, a maqaf is replaced by a space;
   it remains visible when the marked text is revealed. Hover over any word to
   temporarily reveal its marks and show an enlarged version above or below it.
   The setting does not affect the normal reading view. The selected view is
   remembered in this browser, along with these checkboxes and the delay;
   book/chapter readings still use the normal view. Use the −/+ buttons to
   adjust the scroll font size; it is saved to your account when signed in,
   or in this browser when anonymous.

Access and refresh tokens are stored in browser localStorage, as in the
Pocket ID setup guide. A script injection could read them; use HTTPS and protect
the app against XSS. Signing out clears the app's tokens, but does not log the
user out of Pocket ID itself.

---

## VPS Deployment (Ubuntu / Debian)

This section documents how to install the app on a VPS and keep it up to date.

### Server requirements

- Ubuntu 22.04 (or similar Debian-based distro)
- Node.js 20+ supported by better-sqlite3 (`nvm` recommended)
- Nginx (as a reverse proxy)
- PM2 (process manager for the Node.js backend)

### First-time installation

#### 1. Install Node.js (via nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

#### 2. Install PM2 globally

```bash
npm install -g pm2
```

#### 3. Clone the repository

```bash
cd /var/www
git clone https://github.com/binyominzeev/leining-app.git
cd leining-app
```

#### 4. Install dependencies and build the frontend

```bash
npm install
npm run build
```

#### 5. Set up the backend

```bash
cd server
npm install
cp .env.example .env
nano .env          # configure the Pocket ID client and deployment
```

Recommended `.env` values for production:

```
PORT=3001
OIDC_ISSUER=https://auth.binjomin.hu
OIDC_CLIENT_ID=<pocket-id-client-id>
OIDC_CLIENT_SECRET=<pocket-id-client-secret>
OIDC_REDIRECT_URI=https://yourdomain.com/
CORS_ORIGIN=https://yourdomain.com
DATA_DIR=/var/www/leining-app/server/data
```

Register the exact redirect URI in Pocket ID. The API binds to `127.0.0.1`;
use the reverse proxy for external access. An empty `CORS_ORIGIN` disables CORS.

#### 6. Start the backend with PM2

```bash
# from /var/www/leining-app/server
pm2 start index.js --name leining-api
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
```

#### 7. Configure Nginx

Create `/etc/nginx/sites-available/leining-app`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve the static frontend
    root /var/www/leining-app/dist;
    index index.html;

    # Single-page app fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the Node.js backend
    location ^~ /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/leining-app /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

#### 8. (Optional) Enable HTTPS with Certbot

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com
```

---

### Updating the app

After pushing changes to the repository, SSH into the server and run:

```bash
cd /var/www/leining-app

# Pull the latest code
git pull

# Rebuild the frontend
npm install          # only needed if package.json changed
npm run build

# Update backend dependencies (only needed if server/package.json changed)
cd server
npm install
cd ..

# Restart the backend
pm2 restart leining-api
```

Nginx serves the new `dist/` files immediately — no restart required for frontend-only changes.
For account-backed scroll font size, deploy the updated backend and restart it
before deploying the frontend. On startup the backend automatically adds the
new SQLite column without removing existing user data. Back up the database
before updating. `npm run deploy` uploads only the frontend, not the backend.

### API returns the frontend HTML

If `https://lein.myshiurim.com/api/auth/config` returns the HTML page instead of
JSON, the request is reaching the SPA fallback rather than the API. `npm run
deploy` uploads **only** the built frontend to `/var/www/leining-app/`; it does
not install, configure or start the backend, or configure Nginx. The frontend
and backend must both be deployed.

On the server, keep the existing frontend `root` and TLS configuration. Install
the repository's `server/` directory separately, configure its `.env` as above
with `OIDC_REDIRECT_URI=https://lein.myshiurim.com/` and
`CORS_ORIGIN=https://lein.myshiurim.com`, and start it with PM2. The static
deployment directory itself does not contain the backend.

Add this location **inside the active HTTPS `server` block** for
`lein.myshiurim.com`, alongside the existing SPA `location /`:

```nginx
location ^~ /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Keep `proxy_pass` without a trailing slash so the backend receives the `/api/`
prefix. Adjust the port if `PORT` differs. Validate the existing Nginx
configuration with `sudo nginx -t`, then reload it with
`sudo systemctl reload nginx`.

Verify the backend on the server first, then the HTTPS proxy:

```bash
curl -i http://127.0.0.1:3001/api/health
curl -i https://lein.myshiurim.com/api/health
curl -i https://lein.myshiurim.com/api/auth/config
```

The health endpoints should return JSON `{"ok":true}`. The config endpoint
should return JSON containing the public `issuer` and `clientId`; a JSON 503
means the Pocket ID server configuration is incomplete. A 502 indicates that
Nginx cannot reach the backend; inspect `pm2 status` and `pm2 logs leining-api`.
If HTML is still returned, check the active HTTPS virtual host and its location
rules with `sudo nginx -T`.

### Backup the database

The SQLite database is stored in `server/data/leining.db`. Back it up with:

```bash
cp /var/www/leining-app/server/data/leining.db \
   /var/backups/leining-$(date +%Y%m%d).db
```

Consider scheduling this with cron.

---

## License

This project is private. All rights reserved.
