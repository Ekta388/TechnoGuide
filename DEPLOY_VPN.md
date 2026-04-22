# TechnoGuide VPN Deployment Guide

This guide provides the exact commands needed to host your website on a Linux VPS (Ubuntu) and restrict access to your private VPN.

## Prerequisites
- A Linux VPS (Ubuntu 22.04+ recommended)
- Root or sudo access
- A Tailscale account (Free)

---

## Step 1: Install Tailscale (The VPN)
Tailscale creates a secure, private network between your devices.

```bash
# Install Tailscale on the server
curl -fsSL https://tailscale.com/install.sh | sh

# Log in and join your network
sudo tailscale up
```
*Take note of the private IP address shown (e.g., `100.64.0.5`). This is your **VPN IP**.*

---

## Step 2: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js & NPM
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Install PM2 globally
sudo npm install -g pm2
```

---

## Step 3: Deploy Your Code
1.  **Clone your repository** (or upload your files) to `/var/www/technoguide`.
2.  **Setup Backend Environment**:
    ```bash
    cd /var/www/technoguide/backend
    cp .env.production.template .env
    # Edit .env with your production database and VPN IP
    nano .env 
    ```
3.  **Setup Frontend Environment**:
    ```bash
    cd /var/www/technoguide/frontend
    cp .env.production.template .env
    # Ensure REACT_APP_API_URL uses your VPN IP
    nano .env
    # Build the frontend
    npm install
    npm run build
    ```

---

## Step 4: Configure Node.js with PM2
This ensures your backend restarts automatically.

```bash
cd /var/www/technoguide
pm2 start ecosystem.config.js --env production
pm2 save
sudo pm2 startup
```

---

## Step 5: Configure Nginx
This makes your site accessible on Port 80 via the VPN IP.

```bash
# Copy the provided config
sudo cp nginx/technoguide.conf /etc/nginx/sites-available/technoguide

# Enable the site and disable default
sudo ln -s /etc/nginx/sites-available/technoguide /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 6: Security Hardening (Firewall)
**CRITICAL**: This blocks everyone except people on your VPN.

```bash
# Allow Tailscale traffic
sudo ufw allow in on tailscale0

# (Optional) Allow SSH from anywhere (or just VPN)
sudo ufw allow ssh

# Enable Firewall
sudo ufw enable
```

---

## How to Access
1.  Connect your Laptop/Phone to **Tailscale**.
2.  Visit `http://<YOUR_VPN_IP>` (e.g., `http://100.64.0.5`) in your browser.
3.  The dashboard should load, and API calls will work securely over the private network.
