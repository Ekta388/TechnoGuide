# TechnoGuide - Troubleshooting Guide

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Backend Issues](#backend-issues)
3. [Frontend Issues](#frontend-issues)
4. [Database Issues](#database-issues)
5. [WhatsApp Notifications Issues](#whatsapp-notifications-issues)
6. [Authentication Issues](#authentication-issues)
7. [Deployment Issues](#deployment-issues)

---

## Installation Issues

### Problem: npm install fails

**Error**: 
```
npm ERR! code EACCES
npm ERR! syscall open
```

**Solution**:
```bash
# Option 1: Use sudo (not recommended)
sudo npm install

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 3: Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

### Problem: Node version incompatibility

**Error**:
```
The engine "node" is incompatible with this package
```

**Solution**:
```bash
# Check Node version
node --version

# Install correct Node version (v16+)
# Using nvm (Node Version Manager):
nvm install 18
nvm use 18

# Or download from nodejs.org
```

---

### Problem: Port already in use

**Error**:
```
Error: listen EADDRINUSE :::5000
```

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill process (replace PID)
kill -9 <PID>

# Or change port in .env
PORT=5001

# Or on Windows, use different terminal
# Each terminal can run different port
```

---

## Backend Issues

### Problem: Cannot connect to MongoDB

**Error**:
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Causes**:
1. MongoDB not running locally
2. Wrong connection string
3. IP not whitelisted in MongoDB Atlas
4. Database credentials incorrect

**Solutions**:

**For Local MongoDB:**
```bash
# Start MongoDB service
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**For MongoDB Atlas:**
1. Verify connection string format:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
```

2. Check IP whitelisting:
   - Go to MongoDB Atlas → Security → Network Access
   - Add current IP or 0.0.0.0/0 for development

3. Verify credentials:
   - username and password must match database user
   - Special characters must be URL-encoded
   - @ character should be %40

4. Test connection:
```bash
# In backend directory
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected!'))
  .catch(e => console.log('Error:', e.message));
"
```

---

### Problem: Server starts but crashes immediately

**Error**:
```
Cannot find module 'express'
```

**Solution**:
```bash
# In backend directory
npm install

# Or specific package
npm install express
```

---

### Problem: Routes return 404

**Symptoms**:
```
POST /api/clients → 404 Not Found
GET /api/team → 404 Not Found
```

**Check**:
```bash
# 1. Verify server is running on correct port
curl http://localhost:5000/api/health

# 2. Check if routes are registered in server.js
# Should see:
# Using routes: /api/auth
# Using routes: /api/clients
# etc.

# 3. Verify route files exist
ls backend/routes/

# 4. Verify imports in server.js
# Should have: const clientRoutes = require('./routes/clientRoutes');
```

---

### Problem: Authentication fails with 401

**Error**:
```
{"message":"No token provided"}
```

**Solutions**:

1. **Token not in request**:
```bash
# Include Authorization header
curl -X GET http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

2. **Invalid token**:
```bash
# Login first to get new token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@technoguide.com","password":"password123"}'
```

3. **Expired token**:
```bash
# Tokens expire after 7 days
# Need to login again for new token
```

---

### Problem: WhatsApp test notification fails

**Error**:
```
Status: 400 Bad Request
"The phone number format is incorrect"
```

**Solutions**:

1. **Phone number format**:
```javascript
// WRONG: 9876543210
// RIGHT: +919876543210
// Must include country code (+91 for India)
// Must start with +
// Must be valid for country code
```

2. **API credentials missing**:
```bash
# Check .env has all WhatsApp variables
WHATSAPP_API_KEY=xxx
WHATSAPP_PHONE_NUM_ID=xxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx

# Verify in server logs:
# console.log during whatsappService.js calls
```

3. **API key invalid**:
   - Go to Meta for Developers
   - Check API token is current
   - Generate new token if needed
   - Update .env and restart server

---

### Problem: CORS errors

**Error**:
```
Access to XMLHttpRequest from 'http://localhost:3000' blocked by CORS policy
```

**Solution**:
```javascript
// In backend server.js, verify CORS is configured:
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// For development, allow all:
app.use(cors());

// Restart server after change
```

---

## Frontend Issues

### Problem: Blank white screen on load

**Causes**:
1. API URL wrong
2. JavaScript error
3. Build files missing
4. React not rendering

**Solutions**:

1. **Check browser console**:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red error messages
   - Copy error message

2. **Check if API is accessible**:
```bash
# In terminal:
curl http://localhost:5000/api/health

# Should return:
# {"message":"Server is running"}
```

3. **Verify API URL**:
```bash
# In frontend/.env
REACT_APP_API_URL=http://localhost:5000/api

# Check App.js and api.js import this correctly
```

4. **Rebuild frontend**:
```bash
cd frontend
npm install
npm start
```

---

### Problem: Login always shows "Invalid credentials"

**Causes**:
1. Backend not running
2. Seed data not loaded
3. Wrong email/password
4. Database empty

**Solutions**:

1. **Verify backend is running**:
```bash
curl http://localhost:5000/api/health
```

2. **Load seed data**:
```bash
cd backend
npm run seed
```

3. **Verify database has data**:
```javascript
// In MongoDB Atlas or local MongoDB
db.admins.find()
// Should return admin document with email: admin@technoguide.com
```

4. **Try demo credentials**:
```
Email: admin@technoguide.com
Password: password123
```

---

### Problem: API calls return wrong data

**Symptoms**:
- Empty arrays when should have data
- Old data not updated
- Changes not persisting

**Solutions**:

1. **Check if data exists**:
```bash
# In MongoDB terminal:
use technoguide
db.clients.find()
db.teams.find()
```

2. **Re-run seed**:
```bash
cd backend
npm run seed
```

3. **Clear browser cache**:
```
Ctrl+Shift+Delete (Windows)
Cmd+Shift+Delete (Mac)
```

4. **Check API response**:
   - Open DevTools Network tab
   - Make request (e.g., click Clients menu)
   - Click request in Network tab
   - Check Response tab
   - Verify data is correct in backend

---

### Problem: Notifications not appearing

**Causes**:
1. Notifications endpoint failing
2. Backend not sending data
3. Frontend not fetching

**Solutions**:

1. **Check network request**:
   - DevTools Network tab
   - Search for `/notifications`
   - Verify response status is 200
   - Check Response has data

2. **Verify backend notifications endpoint**:
```bash
curl -X GET http://localhost:5000/api/notifications/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Check notification polling interval**:
```javascript
// In Navbar.js:
useEffect(() => {
  const interval = setInterval(() => {
    // This runs every 30 seconds
    // Increase interval if too frequent:
    // Change 30000 to 60000 (1 minute)
  }, 30000);
}, []);
```

---

### Problem: Forms submit but nothing happens

**Causes**:
1. API calls failing
2. Error not shown to user
3. Form validation blocking submission

**Solutions**:

1. **Check console for errors**:
   - DevTools Console tab
   - Look for red messages
   - Copy full error message

2. **Verify all required fields filled**:
   - Create/Edit modal
   - Check all fields have values
   - Check field validation rules

3. **Check API response**:
   - DevTools Network tab
   - Look for POST/PUT request
   - Check Response for errors
   - Common: 400 Bad Request (validation error)

---

## Database Issues

### Problem: Seed script fails

**Error**:
```
Error: db.admins.insertOne is not a function
```

**Solution**:
```bash
# Ensure MongoDB is connected
# In backend directory
npm run seed

# If still fails, check MongoDB:
# 1. Is MongoDB running?
# 2. Is MONGODB_URI correct in .env?
# 3. Does database exist?
```

---

### Problem: Cannot access MongoDB Atlas

**Error**:
```
MongoNetworkError: connect ETIMEDOUT
```

**Solutions**:

1. **Check IP whitelist**:
   - MongoDB Atlas → Security → Network Access
   - Your IP must be listed
   - Or add 0.0.0.0/0 for development

2. **Check internet connection**:
```bash
ping google.com
```

3. **Check cluster status**:
   - MongoDB Atlas Dashboard
   - Verify cluster is "Running" (not paused)
   - Resume if paused

---

### Problem: Database running out of space

**Symptoms**:
```
Error: no space left on device
Database becomes read-only
```

**Solutions**:

1. **Check storage usage**:
   - MongoDB Atlas → Metrics
   - View Storage section
   - See if near 512MB (free tier limit)

2. **Archive old data**:
```bash
# Delete old notifications (>30 days)
db.notifications.deleteMany({
  createdAt: {
    $lt: new Date(Date.now() - 30*24*60*60*1000)
  }
})
```

3. **Upgrade cluster**:
   - MongoDB Atlas → Clusters
   - Modify → Change tier to M5 or higher

---

## WhatsApp Notifications Issues

### Problem: Notifications show "Failed" status

**Causes**:
1. Invalid phone number
2. API credentials wrong
3. WhatsApp API down
4. Business account not verified

**Solutions**:

1. **Verify phone number format**:
```
Format: +[country_code][number]
Valid: +919876543210
Invalid: 9876543210
Invalid: +1 987 654 3210 (spaces)
```

2. **Check API credentials**:
```bash
# In backend .env:
WHATSAPP_API_KEY=...  (should not be empty)
WHATSAPP_PHONE_NUM_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...

# Test with curl:
curl -X POST https://graph.instagram.com/v18.0/YOUR_PHONE_NUM_ID/messages \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

3. **Check WhatsApp Business account status**:
   - Meta for Developers → WhatsApp
   - Check account is verified
   - Check phone number is verified
   - Check you're using correct API version

4. **Check WhatsApp API status**:
   - Is Meta API service down?
   - Check Meta status page
   - Try again in few minutes

---

### Problem: Notifications "Pending" but never sent

**Causes**:
1. Background job not running
2. Retry mechanism not triggered
3. API timeout

**Solutions**:

1. **Manually retry failed**:
```bash
# Go to Notifications page
# Click "Retry Failed" button
# Or via API:
curl -X POST http://localhost:5000/api/notifications/retry-failed \
  -H "Authorization: Bearer TOKEN"
```

2. **Check notification logs**:
```bash
# In MongoDB:
db.notifications.find({status: "Pending"})
# Should show pending notifications

# Look at failure reason if failed
db.notifications.find({status: "Failed"})
```

3. **Check server logs**:
```bash
# In backend running terminal:
# Look for error messages from whatsappService
# Look for "Sending notification to: +91..."
```

---

### Problem: Same notification sent multiple times

**Causes**:
1. Retry mechanism running multiple times
2. Manual retry + automatic retry
3. Server restart during sending

**Solutions**:

1. **Check notification records**:
```bash
db.notifications.aggregate([
  {$group: {_id: {phone: "$recipientPhone", message: "$message"}, count: {$sum: 1}}},
  {$match: {count: {$gt: 1}}}
])
```

2. **Clean duplicates**:
```bash
# Identify duplicate within last hour
db.notifications.deleteMany({
  createdAt: {$gte: new Date(Date.now() - 60*60*1000)},
  status: "Delivered"
})
```

---

## Authentication Issues

### Problem: Token not saving after login

**Cause**: localStorage not working or token not provided

**Solution**:

1. **Check if token received**:
   - DevTools Network tab
   - Click Login request
   - Response should have "token" field

2. **Check localStorage**:
   - DevTools → Application tab
   - Storage → localStorage
   - Should have `token` key with JWT value
   - Should have `user` key with user data

3. **Check AuthContext**:
```javascript
// In AuthContext.js, verify token is saved:
localStorage.setItem('token', response.token)
setUser(response.admin)
setToken(response.token)
```

---

### Problem: Logged in but redirected to login page

**Causes**:
1. Token expired
2. Token invalid
3. Session not persisting

**Solutions**:

1. **Check token validity**:
   - Go to [jwt.io](https://jwt.io)
   - Paste token from localStorage
   - Check exp (expiration) field
   - Is it current date or past date?

2. **Check useAuth hook**:
```javascript
// In any page, add:
const { user, isAuthenticated } = useAuth()
console.log('User:', user)
console.log('Is Authenticated:', isAuthenticated)
```

3. **Re-login**:
   - Clear localStorage
   - Log out completely
   - Log in again
   - Check token is saved

---

### Problem: "Forbidden" error on specific pages

**Error**:
```
403 Forbidden
```

**Causes**:
1. Wrong user role
2. Missing authorization header
3. Invalid token

**Solutions**:

1. **Check user role**:
```bash
# Login and check user object
# Should have role: "Manager", "Admin", or "Super Admin"
```

2. **Verify authorization header**:
```bash
# Check api.js setToken() was called
# Verify token in all requests

# In api.js:
getHeaders() {
  return {
    'Authorization': `Bearer ${this.token}`,
    'Content-Type': 'application/json'
  }
}
```

---

## Deployment Issues

### Problem: App crashes after deploying to Heroku

**Error**:
```
Application crashed
H10 error
```

**Solutions**:

1. **Check logs**:
```bash
heroku logs --tail
```

2. **Common causes**:
   - Missing environment variables
   - MongoDB connection failed
   - Port not set correctly

3. **Set environment variables**:
```bash
heroku config:set MONGODB_URI="..."
heroku config:set JWT_SECRET="..."
```

---

### Problem: Frontend deployed but blank page

**Causes**:
1. API URL pointing to wrong backend
2. Build failed silently
3. .env not set during build

**Solutions**:

1. **Verify .env set in deployment**:
   - Vercel/Netlify Dashboard
   - Settings → Environment Variables
   - Add `REACT_APP_API_URL=https://your-backend.com/api`

2. **Trigger rebuild**:
   - Vercel: Push to main branch
   - Netlify: Manual redeploy

3. **Check build logs**:
   - Vercel/Netlify Dashboard
   - Deployments → Click failed deploy
   - Check Error section

---

### Problem: Deployed backend can't reach database

**Cause**: IP not whitelisted in MongoDB Atlas

**Solution**:
1. MongoDB Atlas → Security → Network Access
2. Add Heroku/deployment server IP
3. Or add 0.0.0.0/0 for testing (not secure)

---

## Getting Help

### Debug Mode
```bash
# In backend, add to server.js:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  console.log('Headers:', req.headers)
  console.log('Body:', req.body)
  next()
})
```

### Request/Response Logging
```bash
# In browser DevTools:
# Network tab captures all requests
# Inspect request headers and response body
```

### Database Query Testing
```bash
# In MongoDB:
db.admins.findOne({email: "admin@technoguide.com"})
db.clients.count()
db.notifications.find({status: "Failed"}).limit(5)
```

### Common Fix Checklist
- [ ] Restart server
- [ ] Clear cache (npm cache clean --force)
- [ ] Delete node_modules and reinstall
- [ ] Check all .env variables are set
- [ ] Verify database is running
- [ ] Check logs for error messages
- [ ] Test API with curl/Postman
- [ ] Clear browser cache
- [ ] Try incognito/private mode
- [ ] Restart computer

---

**Last Updated**: January 2024
**Troubleshooting Guide Version**: 1.0
**For more help**: Check README.md and QUICKSTART.md
