# Login 500 Error - Quick Fix Checklist

## Root Cause
Backend cannot connect to MongoDB (IP not whitelisted)

## Step 1: Verify MongoDB Connection ✅

Check your backend terminal for this message:
```
✅ MongoDB connected successfully
```

If you see CONNECTION ERROR instead, continue to Step 2.

---

## Step 2: Add Your IP to MongoDB Atlas Whitelist

### Get Your Current IP:
```powershell
# Copy and paste this in PowerShell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```
Save this IP address.

### Add to MongoDB Atlas:
1. Open: https://www.mongodb.com/cloud/atlas
2. Log in
3. Go to your cluster (Cluster0)
4. Click: **Security** (left sidebar) → **Network Access**
5. Click: **"+ ADD IP ADDRESS"** (top right button)
6. Paste your IP with `/32` suffix
   - Example: `203.0.113.45/32`
7. Click: **"Confirm"**
8. **WAIT 1-2 MINUTES** while it updates

---

## Step 3: Restart Backend & Seed Database

Once MongoDB shows "connected successfully":

```bash
# In backend terminal (press Ctrl+C first if running)
npm run seed
```

This creates the admin user:
```
Email: admin@technoguide.com
Password: password123
```

---

## Step 4: Try Login Again

Refresh the browser and login with the credentials above.

---

## If Still Not Working - Troubleshoot:

### Check Backend Logs
Look at your backend terminal running `node server.js`:
- Do you see `✅ MongoDB connected successfully`?
- Or do you still see the CONNECTION ERROR?

### Verify Seed Completed
```bash
# Check if admin was created
# (requires MongoDB CLI installed locally)
mongosh "mongodb+srv://rananirav474_db_user:KoisSqyiobUzpU7D@cluster0.futpmif.mongodb.net/techno_guild_db"
# Then run: db.admins.find()
```

### Alternative: Use Network Access 0.0.0.0/0 (Development Only)
If whitelisting doesn't work, try allowing all IPs:
1. MongoDB Atlas → Security → Network Access
2. Click **"+ ADD IP ADDRESS"**
3. Enter: `0.0.0.0/0`
4. Click: **"Confirm"**
⚠️ **NOT SAFE for production** but OK for local development

---

## Expected Success Messages

Backend terminal should show:
```
✅ TechnoGuide Server running on http://localhost:5000
✅ MongoDB connected successfully
```

Frontend console (DevTools) should NOT show the 500 error.

Login should work successfully! ✅

---

**Next:** Complete Step 2, then run `npm run seed`, and reply when MongoDB shows "connected"!
