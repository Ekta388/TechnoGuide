# Deployment Guide: Render (Backend) & Vercel (Frontend)

This guide provides step-by-step instructions for deploying your TechnoGuide project to the cloud.

## 1. Prepare GitHub Repository

1.  **Initialize Git** (if not done already):
    ```bash
    git init
    git add .
    git commit -m "Initial commit with deployment configuration"
    ```
2.  **Create a Repository** on GitHub.
3.  **Push to GitHub**:
    ```bash
    git remote add origin https://github.com/yourusername/technoguide.git
    git branch -M main
    git push -u origin main
    ```

---

## 2. Deploy Backend to Render

1.  **Sign in** to [Render](https://render.com).
2.  **New +** → **Web Service**.
3.  **Connect your GitHub repository**.
4.  **Configure Service**:
    - **Name**: `technoguide-backend`
    - **Region**: Choose closest to you.
    - **Branch**: `main`
    - **Root Directory**: `backend`
    - **Language**: `Docker` (Render will automatically detect the `Dockerfile`).
5.  **Service Plan**:
    - Select the **Free** instance type ($0/month). I have optimized the code (extreme low-memory mode) to fit within the 512MB RAM limit.
6.  **Environment Variables**:
    - Add the following in **Advanced** → **Add Environment Variable**:
        - `MONGODB_URI`: Your MongoDB Atlas connection string.
        - `JWT_SECRET`: A long random string.
        - `NODE_ENV`: `production`
        - `PORT`: `5000`
        - `CORS_ORIGIN`: `https://your-frontend.vercel.app` (You'll get this after the Vercel step).

---

## 3. Deploy Frontend to Vercel

1.  **Sign in** to [Vercel](https://vercel.com).
2.  **Add New** → **Project**.
3.  **Import your GitHub repository**.
4.  **Configure Project**:
    - **Root Directory**: `frontend`
    - **Framework Preset**: `Vite` (or `Create React App` depending on your version).
5.  **Environment Variables**:
    - Under **Environment Variables**, add:
        - `REACT_APP_API_URL`: `https://technoguide-backend.onrender.com/api` (The URL of your Render service).
6.  **Deploy**.

---

## 4. WhatsApp Session & Persistence

> [!WARNING]
> **Ephemeral Filesystem**: Without a "Render Disk", your WhatsApp login will be cleared every time the server restarts or you push new code.

### To enable persistence on Render:
1.  In your Render Service Dashboard, go to **Settings** → **Disks**.
2.  **Add Disk**:
    - **Name**: `wwebjs-auth`
    - **Mount Path**: `/app/.wwebjs_auth`
    - **Size**: 1GB (Minimum).
3.  **Update Environment Variable**:
    - Add `WWEBJS_SESSION_PATH`: `/app/.wwebjs_auth` (Note: You may need to update the `LocalAuth` path in `whatsappService.js` if you want to use this custom path).

---

## 5. Troubleshooting Cloud WhatsApp

- **Initialization Failure**: If the log shows "Navigating frame was detached", it usually means the service is still booting up (the Free Tier CPU is slow). I have increased the timeout to 90 seconds to handle this.
- **Out of Memory**: The Free tier has 512MB. The code is now locked to a 384MB limit for both Node and Chromium to ensure stability.
- **Port Matching**: Ensure Render's Port is set to `5000` or matched to your code.
