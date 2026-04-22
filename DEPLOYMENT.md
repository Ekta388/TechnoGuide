# TechnoGuide - Deployment Guide

## Deployment Architecture Options

### Option 1: Local Hosting (Development)
- Backend: Node.js server running locally
- Frontend: React dev server or build
- Database: Local MongoDB or MongoDB Atlas (cloud)

### Option 2: Cloud Deployment (Recommended for Production)
- Backend: Heroku, Railway, Render, or AWS
- Frontend: Vercel, Netlify, AWS S3 + CloudFront
- Database: MongoDB Atlas (cloud-hosted)

---

## Prerequisites

### Required Accounts
1. **GitHub** - For version control and CI/CD
2. **MongoDB Atlas** - Free tier (512MB) sufficient for testing
3. **WhatsApp Business API** - For notifications (requires business approval)
4. **Deployment Platform** - Choose one:
   - Heroku (easy, free tier available)
   - Railway (modern, free tier)
   - Render (simple, free tier)
   - AWS (scalable, free tier for first year)

### Required Software
```bash
Node.js v16+ 
npm or yarn
Git
```

---

## Step 1: Prepare Application for Deployment

### Backend .env for Production
```env
# Environment
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/technoguide

# Authentication
JWT_SECRET=your-long-random-secret-key-here-min-32-chars
JWT_EXPIRATION=7d

# WhatsApp Configuration
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUM_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id

# CORS
CORS_ORIGIN=https://yourdomain.com
```

### Frontend .env for Production
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### Update package.json Scripts
Backend:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
  }
}
```

---

## Step 2: Setup MongoDB Atlas

### Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click **Create** (new project)
4. Create a cluster:
   - Select Free tier (M0)
   - Choose region closest to you
   - Click Create Cluster
5. Create database user:
   - Go to Database Access
   - Click Add New Database User
   - Username: `technoguide_user`
   - Password: Generate strong password
6. Allow IP access:
   - Go to Network Access
   - Click Add IP Address
   - For development: Add Your Current IP
   - For production: Add 0.0.0.0/0 (or specific IP ranges)
7. Get connection string:
   - Go to Clusters → Connect
   - Choose "Connect your application"
   - Copy MongoDB+SRV connection string
   - Replace `<password>` with your database password

**Connection String Format:**
```
mongodb+srv://technoguide_user:password@cluster.mongodb.net/technoguide?retryWrites=true&w=majority
```

---

## Step 3: Deploy Backend to Heroku

### Prerequisites
```bash
npm install -g heroku
heroku login
```

### Deployment Steps

1. **Initialize Heroku app**
```bash
cd backend
heroku create your-app-name-backend
```

2. **Set environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set WHATSAPP_API_KEY="your-key"
heroku config:set WHATSAPP_PHONE_NUM_ID="your-id"
heroku config:set WHATSAPP_BUSINESS_ACCOUNT_ID="your-id"
heroku config:set CORS_ORIGIN="https://your-frontend-domain"
```

3. **Create Procfile** (in backend directory)
```
web: node server.js
```

4. **Deploy**
```bash
git add .
git commit -m "Prepare for deployment"
git push heroku main
```

5. **View logs**
```bash
heroku logs --tail
```

6. **Access backend**
```
https://your-app-name-backend.herokuapp.com/api/health
```

### Run seed in production
```bash
heroku run node seed.js
```

---

## Step 4: Deploy Frontend to Vercel

### Prerequisites
```bash
npm install -g vercel
```

### Deployment Steps

1. **Build frontend**
```bash
cd frontend
npm run build
```

2. **Deploy to Vercel**
```bash
vercel --prod
```

3. **Configure environment variables** (Vercel Dashboard):
   - Go to Settings → Environment Variables
   - Add `REACT_APP_API_URL=https://your-backend-domain.com/api`
   - Trigger redeploy

4. **Custom domain** (optional):
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

### Alternative: Deploy to Netlify

1. **Connect GitHub to Netlify**:
   - Go to netlify.com
   - Click "New site from Git"
   - Select your repository
   - Set build command: `npm run build`
   - Set publish directory: `build`

2. **Set environment variables**:
   - Go to Site Settings → Build & Deploy → Environment
   - Add `REACT_APP_API_URL`

3. **Deploy**:
   - Push to main branch
   - Netlify automatically builds and deploys

---

## Step 5: Enable HTTPS & SSL

### Heroku (Automatic)
- All Heroku apps get automatic HTTPS
- Access via `https://your-app.herokuapp.com`

### Vercel (Automatic)
- All Vercel sites get automatic HTTPS and SSL

### Custom Domain with SSL (using Cloudflare)

1. **Add DNS records** to Cloudflare:
```
Type: CNAME
Name: api
Content: your-app.herokuapp.com

Type: CNAME
Name: www
Content: your-frontend.vercel.app
```

2. **Enable SSL** in Cloudflare:
   - SSL/TLS → Full (encrypt between client and server)
   - Get free auto-renewing certificates

---

## Step 6: Configure WhatsApp Business API

### Get WhatsApp Credentials

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create or select app
3. Go to WhatsApp → Getting Started
4. Get your:
   - Phone Number ID
   - Business Account ID
   - API token

### Verify Phone Number
- Go to Phone Numbers section
- Add business phone number
- Verify via SMS code
- Provide business verification (name, address, etc.)

### Update Deployment Credentials
```bash
# For backend environment
WHATSAPP_API_KEY=your_api_token
WHATSAPP_PHONE_NUM_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
```

---

## Step 7: Database Backup & Management

### Automatic Backups (MongoDB Atlas)
- Go to Backup → Snapshots
- Configure auto backup schedule
- Point-in-time restore available

### Manual Backup
```bash
# Export database
mongodump --uri "mongodb+srv://..." --out ./backup

# Restore database
mongorestore --uri "mongodb+srv://..." ./backup
```

---

## Step 8: Monitoring & Maintenance

### Backend Monitoring (Heroku)
```bash
# View logs
heroku logs --tail

# Check dyno status
heroku ps

# Restart app
heroku restart

# Scale dynos (upgrade)
heroku ps:scale web=2
```

### Frontend Monitoring (Vercel)
- Dashboard shows build logs
- Analytics available
- Deployment history tracked

### Database Monitoring (MongoDB Atlas)
- Metrics tab shows CPU, memory, network
- Alerts for performance issues
- Query performance analyzer

---

## Step 9: Performance Optimization

### Backend Optimization
```javascript
// Add caching headers in server.js
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
  }
  next();
});

// Add response compression
const compression = require('compression');
app.use(compression());

// Add rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

### Frontend Optimization
```bash
# Check build size
npm run build
npm install -g serve
serve -s build

# Analyze bundle
npm install --save-dev webpack-bundle-analyzer
# Update package.json: analyze script
```

### Database Optimization
- Add indexes on frequently queried fields
- Archive old notifications monthly
- Delete test data before production

---

## Step 10: Security Checklist

### Backend Security
- [ ] Change JWT_SECRET to long random string
- [ ] Enable HTTPS only (set secureOnly on cookies)
- [ ] Add rate limiting
- [ ] Add request validation/sanitization
- [ ] Hide error details in production
- [ ] Use environment variables for all secrets
- [ ] Enable CORS with specific domains only
- [ ] Add helmet.js for HTTP headers

### Frontend Security
- [ ] Remove debug code and console.logs
- [ ] Add Content Security Policy headers
- [ ] Validate all user inputs
- [ ] Don't store sensitive data in localStorage
- [ ] Use HTTPS only
- [ ] Enable secure cookies

### Database Security
- [ ] Use strong database password
- [ ] Restrict IP access
- [ ] Enable authentication
- [ ] Regular backups
- [ ] Monitor access logs

### WhatsApp API Security
- [ ] Never commit API keys to GitHub
- [ ] Rotate API keys regularly
- [ ] Use environment variables
- [ ] Monitor API usage
- [ ] Set up alerts for unusual activity

---

## Step 11: Domain Configuration

### Point Domain to Deployed App

**For Backend (Heroku):**
1. Get Heroku app URL: `your-app.herokuapp.com`
2. Add CNAME record:
   ```
   api.yourdomain.com → your-app.herokuapp.com
   ```

**For Frontend (Vercel):**
1. Get Vercel app URL: `your-app.vercel.app`
2. Add CNAME record:
   ```
   www.yourdomain.com → cname.vercel-dns.com
   ```

**Update Application URLs:**
```
Backend: https://api.yourdomain.com
Frontend: https://yourdomain.com
Frontend .env: REACT_APP_API_URL=https://api.yourdomain.com/api
```

---

## Troubleshooting

### Backend Issues

**App crashes after deploy:**
```bash
heroku logs --tail
```
Check for MongoDB connection errors, missing env variables.

**WhatsApp notifications not sent:**
- Verify phone number is registered
- Check API key and credentials
- Monitor WhatsApp logs
- Test with test endpoint first

**Database connection timeout:**
- Allow your Heroku IP in MongoDB Network Access
- Verify connection string format
- Check database user credentials

### Frontend Issues

**Blank screen after deploy:**
- Check browser console for errors
- Verify REACT_APP_API_URL is correct
- Build app locally first: `npm run build`

**API calls return 404:**
- Verify backend URL in .env
- Check backend is running
- Verify routes exist

**WhatsApp notifications not received:**
- Verify phone numbers have country code (+91)
- Check WhatsApp business account status
- Verify API credentials
- Check notification type is supported

---

## Cost Estimation (Monthly)

### Development/Testing
- MongoDB Atlas free tier: $0
- Heroku free tier: $0 (no longer available, minimum $7)
- Vercel free tier: $0
- WhatsApp API: $0.0079 per message (~$0-50 depending on volume)
- **Total: ~$7-50/month**

### Production
- MongoDB Atlas M5 (10GB): ~$57/month
- Heroku Standard (professional tier): ~$25/month
- Vercel Pro (optional): ~$20/month
- WhatsApp API: Variable ($0.01-0.05 per message)
- Cloudflare Pro (optional SSL): ~$20/month
- **Total: ~$100-200/month + WhatsApp costs**

---

## Rollback Procedures

### Heroku Rollback
```bash
heroku releases
heroku rollback v5  # or specific version
```

### Vercel Rollback
- Dashboard → Deployments
- Click deployment to revert
- Click "Redeploy"

### Database Rollback
- MongoDB Atlas → Backups → Snapshots
- Click snapshot → Restore to new cluster
- Or use point-in-time restore

---

## Production Checklist

- [ ] All environment variables configured
- [ ] Database backed up and secured
- [ ] HTTPS/SSL enabled
- [ ] WhatsApp API configured and tested
- [ ] Monitoring and alerts set up
- [ ] Demo data removed or secured
- [ ] Error logging configured
- [ ] Rate limiting implemented
- [ ] Security headers added
- [ ] CORS configured for production domain
- [ ] Database indexes created
- [ ] Backup strategy documented
- [ ] Team trained on maintenance
- [ ] Disaster recovery plan ready

---

## Maintenance Tasks

### Daily
- Monitor app logs for errors
- Check WhatsApp API status
- Monitor database performance

### Weekly
- Check error logs and fix issues
- Monitor user feedback
- Verify all notifications sending

### Monthly
- Review and archive old data
- Update dependencies (npm update)
- Test backup/restore process
- Review security logs
- Check database storage usage

### Quarterly
- Rotate API keys
- Security audit
- Performance review
- Capacity planning

---

**Last Updated**: January 2024
**Deployment Status**: Ready for Production
**Support**: Contact TechnoGuide Admin Team
