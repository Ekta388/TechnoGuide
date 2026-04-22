# Getting Started Guide - TechnoGuide Marketing Admin Dashboard

## ⚡ Quick Start (5 minutes)

### Step 1: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file and add:
PORT=5000
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/techno_guild_db
JWT_SECRET=your_super_secret_random_string_123
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUM_ID=your_phone_number_id

# Seed database with demo data
npm run seed

# Start server
npm run dev
```

**Backend URL**: http://localhost:5000

### Step 2: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file with:
REACT_APP_API_URL=http://localhost:5000/api

# Start frontend
npm start
```

**Frontend URL**: http://localhost:3000

### Step 3: Login

```
Email: admin@technoguide.com
Password: password123
```

---

## 📊 Core Features Walkthrough

### 1. **Dashboard**
- View all key statistics
- See recent activities
- Monitor alerts and overdue tasks
- Access quick actions

### 2. **Clients Management**
- Add new clients with details
- Assign packages to clients
- Track client budget
- View client status (Active/Pending/Inactive)

### 3. **Team Management**
- Add team members with specific roles
- Assign skills and experience
- Set reporting managers
- Track team member status

### 4. **Packages**
- Create service packages
- Define deliverables and features
- Set budget and duration
- Assign team members
- Track progress

### 5. **Tasks**
- Create daily tasks for team members
- Assign to specific packages
- Set priority and platform
- Automatic WhatsApp notifications
- Track completion status

### 6. **Notifications**
- View all notifications
- Test WhatsApp integration
- Retry failed notifications
- Filter by status

---

## 🔄 Typical Workflow

1. **Add Client** → Clients page → Add Client form
2. **Create Package** → Packages page → Create Package form (select client)
3. **Assign Team** → Packages page → Assign team members
4. **Create Task** → Tasks page → Create Task (select package, assign team member)
5. **Team receives notification** via WhatsApp ✅
6. **Update Task Status** → Change status as work progresses
7. **View Dashboard** → Monitor all activities in real-time

---

## 🔑 Key API Endpoints (for testing with Postman)

### Authentication
```
POST /api/auth/login
Body: { "email": "admin@technoguide.com", "password": "password123" }
Response: { "token": "jwt_token", "admin": {...} }
```

### Create Client
```
POST /api/clients
Headers: Authorization: Bearer <token>
Body: {
  "name": "Client Name",
  "email": "client@email.com",
  "phone": "+91...",
  "company": "Company Name",
  "budget": 100000
}
```

### Create Task & Send Notification
```
POST /api/tasks
Headers: Authorization: Bearer <token>
Body: {
  "title": "Social Media Post",
  "client": "client_id",
  "package": "package_id",
  "assignedTo": "team_member_id",
  "priority": "High",
  "platform": "Instagram",
  "dueDate": "2024-01-20"
}
```

**Action**: Automatic WhatsApp notification sent to team member!

---

## 📱 WhatsApp Notifications

### Auto-Send Triggers
1. ✅ Task Assignment - "New task assigned to you"
2. ✅ Daily Reminder - "You have X pending tasks"
3. ✅ Task Completion Alert - "Task completed by team member"
4. ✅ Client Updates - "Package status updated"

### Test WhatsApp
1. Go to Notifications page
2. Enter phone number
3. Click "Send Test"
4. Check WhatsApp for test message

---

## 🎨 UI Customization

### Color Scheme
- **Primary**: Blue (#2563eb)
- **Success**: Green (#16a34a)
- **Warning**: Yellow (#ca8a04)
- **Danger**: Red (#dc2626)
- **Secondary**: Purple (#9333ea)

### Modify Colors
Edit in component files:
```jsx
className="bg-blue-600 hover:bg-blue-700"
```

---

## 🗄️ Database Collections

### Admin
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['Super Admin', 'Admin', 'Manager'],
  phone: String,
  isActive: Boolean
}
```

### Client
```javascript
{
  name: String,
  email: String,
  phone: String,
  company: String,
  budget: Number,
  status: Enum ['Active', 'Pending', 'Inactive'],
  packages: [ObjectId ref Package],
  createdBy: ObjectId ref Admin
}
```

### Team
```javascript
{
  name: String,
  email: String,
  role: Enum ['Manager', 'Designer', 'Videographer', ...],
  department: String,
  skills: [String],
  status: Enum ['Active', 'On Leave', 'Inactive'],
  assignedTasks: [ObjectId ref Task]
}
```

### Package
```javascript
{
  name: String,
  type: String,
  amount: Number,
  duration: Number,
  budget: Number,
  client: ObjectId ref Client,
  status: Enum ['Active', 'Completed', 'On Hold'],
  progress: Number (0-100),
  manager: ObjectId ref Team
}
```

### Task
```javascript
{
  title: String,
  type: Enum ['Post', 'Reel', 'Story', 'Design', 'Video'],
  platform: Enum ['Instagram', 'Facebook', 'LinkedIn'],
  assignedTo: ObjectId ref Team,
  status: Enum ['Pending', 'In Progress', 'Review', 'Completed'],
  priority: Enum ['Low', 'Medium', 'High', 'Urgent'],
  dueDate: Date
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution**:
- Check MONGODB_URI in .env
- Whitelist your IP on MongoDB Atlas
- Verify username/password

### Issue: "WhatsApp messages not sending"
**Solution**:
- Verify WHATSAPP_API_KEY is valid
- Check phone number format (+country_code)
- Ensure WhatsApp Business account is active

### Issue: "Frontend can't reach backend"
**Solution**:
- Backend running? Check port 5000
- Check REACT_APP_API_URL in frontend .env
- Browser console for CORS errors

### Issue: "Login not working"
**Solution**:
- Run seed script: `npm run seed`
- Check database connection
- Verify JWT_SECRET in .env

---

## 📈 Performance Tips

### Backend
- Use pagination for large datasets
- Index frequently queried fields in MongoDB
- Implement caching for statistics
- Use connection pooling

### Frontend
- Lazy load components
- Implement pagination on tables
- Cache API responses
- Use React.memo for expensive components

---

## 🔒 Security Best Practices

1. **Never commit .env files** to git
2. **Use strong JWT_SECRET** (min 32 characters)
3. **Validate all inputs** on backend
4. **Use HTTPS** in production
5. **Enable CORS only for trusted origins**
6. **Rate limit API endpoints**
7. **Hash passwords** with bcrypt
8. **Implement role-based access control**

---

## 📚 Additional Resources

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [JWT Guide](https://jwt.io/)

---

## ✨ Next Steps

After basic setup:

1. **Customize branding** - Update colors, logo, company name
2. **Configure WhatsApp** - Set up real WhatsApp Business API
3. **Add more team members** - Populate with real team data
4. **Create packages** - Define your service packages
5. **Test automations** - Verify notifications work end-to-end
6. **Deploy** - Get production ready!

---

**Happy Managing! 🚀**

Need help? Check the main README.md or API documentation.
