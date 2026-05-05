# Leining App

A web app for practising Torah reading (leining) with cantillation marks (ta'amim / trop).

## Features

- **Word-by-word playback** — step through the text at an adjustable speed
- **Ta'am display** — shows the cantillation mark name for the currently highlighted word
- **Two navigation modes**
  - *Manual* — choose any book, chapter, and verse range from the full Tanach
  - *Parasha* — load the current week's Torah portion directly from the Sefaria calendar
- **Progress persistence** — your last reading position is saved so you can pick up where you left off
- **User accounts** — register/login to sync your highlights, speed, and reading position across devices
- **Right-to-left Hebrew UI** with Frank Ruhl Libre typeface
- **Sefer Torah mode** to see which aliyah is how long

## Screenshots

Choose a parasha:

<img width="1920" height="1080" alt="Screenshot from 2026-03-26 23-43-15" src="https://github.com/user-attachments/assets/abadd92a-6dcc-463d-bd62-d43641659880" />

Read along (or ahead) in your own set pace (WPM = words per minute):

<img width="1920" height="1080" alt="Screenshot from 2026-03-26 23-43-26" src="https://github.com/user-attachments/assets/c7dd2fcb-e514-4fcd-a7e9-4a427327ad4b" />

Sefer Torah mode (with aliyos showing):

<img width="1920" height="1080" alt="Screenshot from 2026-03-26 23-43-34" src="https://github.com/user-attachments/assets/47756a5a-7815-4f60-bb43-e31fa2f8a402" />

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 18](https://react.dev/) |
| Language | TypeScript |
| Build tool | [Vite](https://vitejs.dev/) |
| Text source | [Sefaria API](https://www.sefaria.org/developers) |
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken) |

## Getting Started (local development)

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
cd server
npm install
cp .env.example .env   # edit .env and set JWT_SECRET
cd ..
```

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
│   ├── auth.js           # POST /api/auth/register, /api/auth/login, GET /api/auth/me
│   └── user.js           # GET/PUT /api/user/data
├── package.json
└── .env.example          # Sample environment variables

src/
├── components/           # React UI components
│   ├── AuthModal         # Login / Register modal
│   ├── Controls          # Playback controls (play/pause, speed)
│   ├── Navigation        # Book/chapter/parasha selector
│   ├── TaamPanel         # Cantillation mark display
│   └── TextDisplay       # Hebrew text with word highlighting
├── hooks/
│   └── usePlayback       # Playback state and timer logic
├── utils/
│   ├── auth.ts           # Auth API client + JWT/cache helpers
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
5. **Account** — click *כניסה / הרשמה* in the top-right corner to register or log in. Your highlights, speed setting, and reading position are then saved on the server and synced across devices.

---

## VPS Deployment (Ubuntu / Debian)

This section documents how to install the app on a VPS and keep it up to date.

### Server requirements

- Ubuntu 22.04 (or similar Debian-based distro)
- Node.js 18+ (`nvm` recommended)
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
nano .env          # set PORT, JWT_SECRET, ALLOWED_ORIGINS, DATA_DIR
```

Recommended `.env` values for production:

```
PORT=3001
JWT_SECRET=<long-random-string>
ALLOWED_ORIGINS=https://yourdomain.com
DATA_DIR=/var/www/leining-app/server/data
```

Generate a strong secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

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
    location /api/ {
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

