# MongoDB Atlas Setup & IP Whitelist Fix

## Problem
```
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster
IP that isn't whitelisted. Make sure your current IP address is on your Atlas cluster's IP whitelist
```

## Solution: Add Your IP to MongoDB Atlas

### Step 1: Find Your Current IP Address

**On Windows PowerShell:**
```powershell
# Find your public IP (the one MongoDB sees)
Invoke-WebRequest -Uri "https://api.ipify.org?format=json" | Select-Object -ExpandProperty Content
```

Or simply visit: https://www.whatismyipaddress.com

### Step 2: Add IP to MongoDB Atlas Whitelist

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Log in to your account
3. Click on your project/cluster
4. Go to **Security** → **Network Access**
5. Click **"+ ADD IP ADDRESS"**
6. Enter your IP address in the format: `YOUR_IP/32`
   - Example: `203.0.113.45/32`
7. Click **"Confirm"**

### Step 3: Wait for Changes to Apply

- Changes usually apply within 1-2 minutes
- You may see a "Updating..." message during this time

### Step 4: Restart Your Backend Server

```bash
# Press Ctrl+C to stop the server
# Then restart it
node server.js
```

---

## Alternative: Allow All IPs (Development Only)

**⚠️ NOT RECOMMENDED for production** but useful for local development:

1. MongoDB Atlas → Security → Network Access
2. Click **"+ ADD IP ADDRESS"**
3. Enter: `0.0.0.0/0`
4. Click **"Confirm"**

This allows connections from any IP, but **NEVER do this in production**.

---

## Alternative: Use Local MongoDB

If you prefer local MongoDB instead of Atlas:

### On Windows

**Option 1: Using Chocolatey**
```powershell
# Install MongoDB
choco install mongodb

# Start MongoDB service
mongod
```

**Option 2: Download & Install**
- Download from: https://www.mongodb.com/try/download/community
- Install and follow setup wizard
- Start MongoDB: `mongod`

**Option 3: Using WSL + Linux MongoDB**
```bash
# In WSL terminal
sudo apt-get install -y mongodb
sudo service mongodb start
```

### Update .env for Local MongoDB

**backend/.env:**
```env
MONGODB_URI=mongodb://localhost:27017/technoguide
```

Then restart the server.

---

## Verify Connection Success

After adding your IP, you should see:

```
✅ TechnoGuide Server running on http://localhost:5000
📊 Dashboard available at http://localhost:3000
✅ MongoDB connected successfully
```

## Common IP Issues

### Problem: IP Changes Frequently
- Use `0.0.0.0/0` for development (temporary)
- Or add multiple IPs to the whitelist
- For production, use a static IP or deploy on cloud

### Problem: Still Can't Connect
1. Double-check the IP address is correct
2. Wait 2-3 minutes for firewall changes to apply
3. Try restarting MongoDB Atlas cluster:
   - Atlas Dashboard → Clusters → ... → Restart Cluster
4. Verify your .env MONGODB_URI is correct

---

## MongoDB Atlas Connection String Format

```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority
```

- `USERNAME`: Database user (e.g., `technoguide_user`)
- `PASSWORD`: Password (URL-encode special characters like @,%,etc)
- `cluster`: Your cluster name
- `DATABASE`: Database name (e.g., `technoguide`)

---

## Next Steps

Once MongoDB is connected:

1. **Seed demo data:**
```bash
cd backend
npm run seed
```

2. **In another terminal, start frontend:**
```bash
cd frontend
npm start
```

3. **Login:**
```
Email: admin@technoguide.com
Password: password123
```

---

**Last Updated**: March 2026
**Status**: MongoDB Connection Troubleshooting Guide
