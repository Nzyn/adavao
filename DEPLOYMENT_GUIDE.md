# 🚀 AlertDavao Deployment Guide

This guide is tailored to your code and the `fordeployment` branch we just pushed.

**Repository:** [https://github.com/Nzyn/aldavao](https://github.com/Nzyn/aldavao)
**Branch to Deploy:** `fordeployment` (Use this branch for everything!)

---

## ✅ STEP 1 — Create Your MySQL Database (Railway)

1.  Go to [Railway.app](https://railway.app/).
2.  Create a **New Project** → Select **MySQL**.
3.  Wait for it to deploy.
4.  Click the MySQL card → **Connect** tab.
5.  Copy the values for:
    *   `MYSQLHOST`
    *   `MYSQLPORT`
    *   `MYSQLUSER`
    *   `MYSQLPASSWORD`
    *   `MYSQLDATABASE`

---

## ✅ STEP 2 — Deploy NODE Backend (Render)

1.  Go to [Render.com](https://render.com/).
2.  **New Web Service** → Connect GitHub Account.
3.  Select repo: `Nzyn/aldavao`.
4.  **Important:**
    *   **Root Directory:** `UserSide/backends` (This is where `server.js` lives).
    *   **Branch:** `fordeployment`.
5.  **Build Command:** `npm install`
6.  **Start Command:** `node server.js`
7.  **Environment Variables** (Add these):
    *   `DB_HOST` = (Paste MySQL Host)
    *   `DB_PORT` = (Paste MySQL Port)
    *   `DB_USERNAME` = (Paste MySQL User)
    *   `DB_PASSWORD` = (Paste MySQL Password)
    *   `DB_DATABASE` = (Paste MySQL Database Name)
    *   `PORT` = `10000`
8.  Click **Deploy**.
9.  **Copy the URL** it gives you (e.g., `https://alertdavao-api.onrender.com`).

---

## ✅ STEP 3 — Deploy LARAVEL Admin (Railway)

1.  Go back to your [Railway Project](https://railway.app/).
2.  Click **New** → **GitHub Repo**.
3.  Select `Nzyn/aldavao`.
4.  **Configure**:
    *   Click the new repo card → **Settings** → **Root Directory**.
    *   Set Root Directory to: `/AdminSide/admin`
    *   **Branch:** `fordeployment` (This contains the Dockerfile).
5.  **Variables**: 
    *   Add all the DB variables (same as Node).
    *   `APP_KEY`: Get this from your `secrets_backup.txt` (local file) or run `php artisan key:generate --show`.
    *   `APP_URL`: Set this to your Railway URL (after it generates).
6.  Railway will detect the `Dockerfile` in `/AdminSide/admin` and deploy automatically.

---

## ✅ STEP 4 — Connect Mobile App (UserSide)

1.  Open `d:\Codes\alertdavao\alertdavao\UserSide\config\api.ts`.
2.  Replace the dynamic `getBackendUrlSync` line with your **Production Node URL**:
    ```typescript
    // production config
    export const API_CONFIG = {
      BASE_URL: 'https://your-node-app.onrender.com', // <--- PASTE RENDER URL HERE
      // ...
    }
    ```
    *(Or simply ensure `app.json` has `apiBaseUrl` set correctly if you kept my dynamic code).*
3.  Build your APK using EAS or standard build command.

---

## ✅ STEP 5 — Verify Layout (Done)

*   Node connects to MySQL? ✅ (via Env Vars)
*   Laravel connects to MySQL? ✅ (via Env Vars)
*   App connects to Node? ✅ (via Step 4 URL)
