# TechnoGuide - Marketing Admin Dashboard

A complete admin/management website for TechnoGuide marketing company built with **Node.js/Express** backend and **React** frontend with **Tailwind CSS**.

## 🎯 Features

### Core Modules
- **Clients Management** - Add, edit, delete, and manage client information
- **Team Management** - Manage team members with roles, departments, and skills
- **Packages** - Create and manage service packages with budgets and deliverables
- **Tasks** - Assign daily tasks to team members with priorities and platforms
- **Dashboard** - Real-time analytics, alerts, and status overview
- **Notifications** - WhatsApp integration for automated notifications

### Key Capabilities
✅ Client CRUD operations with status tracking
✅ Team member management with role-based assignments
✅ Package creation with budget management
✅ Daily task assignments with automatic WhatsApp notifications
✅ Real-time dashboard with statistics and alerts
✅ Task status tracking (Pending → In Progress → Review → Completed)
✅ Multi-platform support (Instagram, Facebook, LinkedIn, Twitter, TikTok)
✅ WhatsApp Business API integration for instant notifications
✅ User authentication with JWT
✅ Role-based access control

---

## 📋 Prerequisites

- **Node.js** 14.x or higher
- **npm** or **yarn**
- **MongoDB** (Atlas or Local)
- **WhatsApp Business API** credentials

---

## 🚀 Installation & Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Update .env file with your credentials
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# WHATSAPP_API_KEY=your_whatsapp_api_key
# WHATSAPP_PHONE_NUM_ID=your_phone_number_id

# Start backend server
npm run dev   # For development with nodemon
# or
npm start     # For production
```

Backend runs on: `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Update .env file
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Login admin
- `GET /api/auth/me` - Get current admin

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/stats` - Get client statistics

### Team
- `GET /api/team` - Get all team members
- `POST /api/team` - Add team member
- `GET /api/team/:id` - Get member details
- `PUT /api/team/:id` - Update team member
- `DELETE /api/team/:id` - Delete team member
- `GET /api/team/stats` - Get team statistics
- `GET /api/team/reminder/daily` - Send daily reminders

### Packages
- `GET /api/packages` - Get all packages
- `POST /api/packages` - Create package
- `GET /api/packages/:id` - Get package details
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package
- `GET /api/packages/stats` - Get package statistics
- `PATCH /api/packages/:id/progress` - Update progress

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats` - Get task statistics

### Notifications
- `GET /api/notifications` - Get all notifications
- `POST /api/notifications/test` - Send test notification
- `GET /api/notifications/stats` - Get notification statistics
- `POST /api/notifications/retry-failed` - Retry failed notifications

---

## 🔐 Demo Login Credentials

```
Email: admin@technoguide.com
Password: password123
```

> **Note**: You can create more admin accounts using the registration endpoint

---

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your_super_secret_random_string_123
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUM_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📱 WhatsApp Integration

### Automatic Notifications
1. **Task Assignment** - When a task is assigned to a team member
2. **Daily Reminders** - Morning reminders for pending tasks
3. **Task Completion** - Alert to manager when task is completed
4. **Client Activity** - Updates about client package status

### Setup WhatsApp Business API
1. Go to [WhatsApp Business Platform](https://www.whatsapp.com/business/downloads/)
2. Create a business account
3. Get your API key and Phone Number ID
4. Configure in `.env` file
5. Test with `/api/notifications/test` endpoint

---

## 📊 Database Schema

### Collections
- **Admin** - Admin users with roles
- **Client** - Client information and packages
- **Team** - Team members with roles and skills
- **Package** - Service packages with deliverables
- **Task** - Daily tasks assigned to team members
- **Notification** - WhatsApp notification logs

---

## 🎨 UI Features

- **Modern Dashboard** - Real-time statistics and alerts
- **Responsive Design** - Works on desktop and mobile
- **Interactive Tables** - Search, filter, and sort
- **Color-coded Status** - Easy status identification
- **Modal Forms** - Inline data entry
- **Notification Panel** - Real-time notification updates
- **Dark/Light Mode Ready** - Extendable theme support

---

## 📈 Dashboard Widgets

- Total Clients & Active Count
- Team Members Distribution
- Package Statistics
- Task Status Overview (Completed, In Progress, Pending)
- Overdue Task Alerts
- Recent Activity Feed
- Quick Action Buttons

---

## 🛡️ Security Features

- JWT authentication
- Password hashing with bcryptjs
- Role-based access control
- Input validation
- CORS enabled
- Environment variables for sensitive data

---

## 🚀 Deployment

### Deploy Backend (Heroku)
```bash
# Create Heroku app
heroku create technoguide-api

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret
heroku config:set WHATSAPP_API_KEY=your_key

# Deploy
git push heroku main
```

### Deploy Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the build folder to Vercel/Netlify
```

---

## 📝 Project Structure

```
technoguide/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Auth & validation
│   ├── services/          # Business logic (WhatsApp)
│   ├── server.js          # Main server file
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   ├── services/      # API client
    │   ├── context/       # React context
    │   ├── App.js
    │   └── index.js
    ├── package.json
    ├── tailwind.config.js
    └── .env
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify connection string in `.env`
- Check IP whitelist on MongoDB Atlas
- Ensure database credentials are correct

### WhatsApp API Not Working
- Verify phone number format (+country_code followed by number)
- Check API key validity
- Ensure WhatsApp Business account is verified

### Frontend Can't Connect to Backend
- Check backend is running on port 5000
- Verify `REACT_APP_API_URL` in frontend `.env`
- Check CORS settings in backend

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Verify environment variables

---

## 📄 License

This project is proprietary software for TechnoGuide.

---

## 🎉 Getting Started Quick Tips

1. **First Time Setup**:
   - Set up MongoDB Atlas free tier
   - Get WhatsApp Business API credentials
   - Configure environment variables
   - Run `npm install` in both directories

2. **Create First Admin**:
   - Use POST `/api/auth/register` endpoint
   - Or use demo credentials above

3. **Add Clients**:
   - Navigate to Clients page
   - Click "Add Client"
   - Fill in details and submit

4. **Assign Tasks**:
   - Create clients and packages first
   - Go to Tasks
   - Select client, package, and team member
   - Task will be automatically assigned via WhatsApp

5. **Monitor Dashboard**:
   - Check real-time statistics
   - Review alerts and pending items
   - Track team activity

---

**Built with ❤️ for TechnoGuide Marketing**
