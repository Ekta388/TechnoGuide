# TechnoGuide API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except login/register) require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### Register Admin
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "securePassword123",
  "role": "Admin",
  "phone": "+919876543210"
}

Response (201):
{
  "message": "Admin registered successfully",
  "token": "jwt_token_here",
  "admin": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": "Admin"
  }
}
```

### Login Admin
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@technoguide.com",
  "password": "password123"
}

Response (200):
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "admin": {
    "id": "admin_id",
    "name": "Admin User",
    "email": "admin@technoguide.com",
    "role": "Super Admin",
    "phone": "+919876543210"
  }
}
```

### Get Current Admin
```http
GET /auth/me
Authorization: Bearer <token>

Response (200):
{
  "_id": "admin_id",
  "name": "Admin User",
  "email": "admin@technoguide.com",
  "role": "Super Admin",
  "phone": "+919876543210",
  "company": "TechnoGuide",
  "isActive": true
}
```

---

## 👥 Clients Endpoints

### Get All Clients
```http
GET /clients
Authorization: Bearer <token>

Response (200): [
  {
    "_id": "client_id",
    "name": "ABC Solutions",
    "email": "contact@abc.com",
    "phone": "+919876543211",
    "company": "ABC Solutions Pvt Ltd",
    "industry": "Marketing",
    "budget": 100000,
    "status": "Active",
    "packages": [],
    "createdAt": "2024-01-20T10:30:00Z"
  },
  ...
]
```

### Get Client by ID
```http
GET /clients/{id}
Authorization: Bearer <token>

Response (200):
{
  "_id": "client_id",
  "name": "ABC Solutions",
  "email": "contact@abc.com",
  "phone": "+919876543211",
  "company": "ABC Solutions Pvt Ltd",
  "industry": "Marketing",
  "address": "123 Business Park",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "budget": 100000,
  "status": "Active",
  "packages": [
    {
      "_id": "package_id",
      "name": "Social Media Monthly Plan",
      "status": "Active"
    }
  ]
}
```

### Add New Client
```http
POST /clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Client",
  "email": "newclient@email.com",
  "phone": "+919876543215",
  "company": "New Company",
  "industry": "Marketing",
  "address": "789 Street Address",
  "city": "Pune",
  "state": "Maharashtra",
  "country": "India",
  "budget": 150000,
  "notes": "VIP Client"
}

Response (201):
{
  "message": "Client added successfully",
  "client": { ... }
}
```

### Update Client
```http
PUT /clients/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "budget": 200000,
  "status": "Active"
}

Response (200):
{
  "message": "Client updated successfully",
  "client": { ... }
}
```

### Update Client Status
```http
PATCH /clients/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Active"
}

Response (200):
{
  "message": "Client status updated",
  "client": { ... }
}
```

### Delete Client
```http
DELETE /clients/{id}
Authorization: Bearer <token>

Response (200):
{
  "message": "Client deleted successfully"
}
```

### Get Client Statistics
```http
GET /clients/stats
Authorization: Bearer <token>

Response (200):
{
  "totalClients": 15,
  "activeClients": 12,
  "pendingClients": 2,
  "inactiveClients": 1,
  "totalBudget": 1500000
}
```

---

## 👨‍💼 Team Endpoints

### Get All Team Members
```http
GET /team
Authorization: Bearer <token>

Response (200): [
  {
    "_id": "team_id",
    "name": "Priya Singh",
    "email": "priya@technoguide.com",
    "phone": "+919876543221",
    "role": "Designer",
    "department": "Design",
    "skills": ["Graphic Design", "UI/UX", "Figma"],
    "experience": 3,
    "status": "Active"
  },
  ...
]
```

### Add Team Member
```http
POST /team
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Team Member Name",
  "email": "team@technoguide.com",
  "phone": "+919876543225",
  "role": "Designer",
  "department": "Design",
  "skills": ["Photoshop", "Figma", "UI Design"],
  "designation": "Senior Designer",
  "experience": 4,
  "salary": 50000
}

Response (201):
{
  "message": "Team member added successfully",
  "member": { ... }
}
```

### Get Team by Role
```http
GET /team/role/Manager
Authorization: Bearer <token>

Response (200): [...]
```

### Get Team by Department
```http
GET /team/department/Design
Authorization: Bearer <token>

Response (200): [...]
```

### Send Daily Reminders
```http
GET /team/reminder/daily
Authorization: Bearer <token>

Response (200):
{
  "message": "Daily reminders sent to all team members",
  "membersNotified": 5
}
```

### Get Team Statistics
```http
GET /team/stats
Authorization: Bearer <token>

Response (200):
{
  "totalMembers": 5,
  "activeMembers": 5,
  "onLeaveMembers": 0,
  "inactiveMembers": 0,
  "roles": [
    { "_id": "Manager", "count": 1 },
    { "_id": "Designer", "count": 2 }
  ],
  "departments": [
    { "_id": "Design", "count": 2 },
    { "_id": "Marketing", "count": 2 }
  ]
}
```

---

## 📦 Packages Endpoints

### Get All Packages
```http
GET /packages
Authorization: Bearer <token>

Response (200): [
  {
    "_id": "package_id",
    "name": "Social Media Monthly Plan",
    "type": "Social Media Management",
    "amount": 25000,
    "duration": 1,
    "durationUnit": "months",
    "budget": 25000,
    "status": "Active",
    "progress": 45,
    "client": { "_id": "...", "name": "ABC Solutions" },
    "manager": { "_id": "...", "name": "Raj Kumar" },
    "assignedTeam": [...]
  },
  ...
]
```

### Create Package
```http
POST /packages
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Package",
  "description": "Complete social media management",
  "type": "Social Media Management",
  "amount": 30000,
  "duration": 1,
  "durationUnit": "months",
  "deliverables": ["8 Posts", "2 Reels"],
  "features": ["Content Planning", "Posting"],
  "client": "client_id",
  "budget": 30000,
  "startDate": "2024-01-20",
  "endDate": "2024-02-20"
}

Response (201):
{
  "message": "Package created successfully",
  "package": { ... }
}
```

### Update Package Progress
```http
PATCH /packages/{id}/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "progress": 75
}

Response (200):
{
  "message": "Package progress updated",
  "package": { ... }
}
```

### Assign Team to Package
```http
PATCH /packages/{id}/assign-team
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamMembers": ["team_id_1", "team_id_2"]
}

Response (200):
{
  "message": "Team assigned to package",
  "package": { ... }
}
```

### Get Package Statistics
```http
GET /packages/stats
Authorization: Bearer <token>

Response (200):
{
  "totalPackages": 10,
  "activePackages": 8,
  "completedPackages": 2,
  "totalBudget": 250000,
  "totalAmount": 260000,
  "packagesByType": [
    { "_id": "Social Media Management", "count": 4 }
  ]
}
```

---

## ✅ Tasks Endpoints

### Get All Tasks
```http
GET /tasks
Authorization: Bearer <token>

Response (200): [
  {
    "_id": "task_id",
    "title": "Social Media Post - Instagram",
    "type": "Post",
    "platform": "Instagram",
    "priority": "High",
    "status": "Pending",
    "dueDate": "2024-01-22T00:00:00Z",
    "client": { "_id": "...", "name": "ABC Solutions" },
    "package": { "_id": "...", "name": "Social Media Plan" },
    "assignedTo": { "_id": "...", "name": "Vikram Patel" }
  },
  ...
]
```

### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Create Instagram Reel",
  "description": "Create promotional reel for product launch",
  "client": "client_id",
  "package": "package_id",
  "assignedTo": "team_member_id",
  "priority": "High",
  "type": "Reel",
  "platform": "Instagram",
  "dueDate": "2024-01-25",
  "instructions": "Use brand colors and include product features"
}

Response (201):
{
  "message": "Task created and assigned successfully",
  "task": { ... }
}
```

### Update Task Status
```http
PATCH /tasks/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Completed"
}

Response (200):
{
  "message": "Task status updated",
  "task": { ... }
}
```

### Get Tasks by Status
```http
GET /tasks/status/Pending
Authorization: Bearer <token>

Response (200): [...]
```

### Get Tasks by Priority
```http
GET /tasks/priority/High
Authorization: Bearer <token>

Response (200): [...]
```

### Get Task Statistics
```http
GET /tasks/stats
Authorization: Bearer <token>

Response (200):
{
  "totalTasks": 25,
  "pendingTasks": 5,
  "inProgressTasks": 10,
  "completedTasks": 8,
  "reviewTasks": 2,
  "overdueTasks": 3,
  "tasksByPriority": [
    { "_id": "High", "count": 8 }
  ],
  "tasksByType": [
    { "_id": "Post", "count": 15 }
  ],
  "tasksByPlatform": [
    { "_id": "Instagram", "count": 12 }
  ]
}
```

---

## 🔔 Notifications Endpoints

### Get All Notifications
```http
GET /notifications
Authorization: Bearer <token>

Response (200): [
  {
    "_id": "notification_id",
    "recipientPhone": "+919876543221",
    "recipientName": "Priya Singh",
    "type": "Task Assignment",
    "title": "New Task Assigned",
    "message": "You have been assigned a new task: Create Instagram Reel",
    "status": "Sent",
    "priority": "High",
    "sentAt": "2024-01-20T10:30:00Z",
    "createdAt": "2024-01-20T10:30:00Z"
  },
  ...
]
```

### Send Test Notification
```http
POST /notifications/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+919876543221"
}

Response (200):
{
  "message": "Test notification sent",
  "result": {
    "success": true,
    "messageId": "wamid.xxx",
    "notificationId": "notification_id"
  }
}
```

### Get Notification Statistics
```http
GET /notifications/stats
Authorization: Bearer <token>

Response (200):
{
  "totalNotifications": 50,
  "sentNotifications": 45,
  "deliveredNotifications": 40,
  "failedNotifications": 2,
  "pendingNotifications": 3,
  "notificationsByType": [
    { "_id": "Task Assignment", "count": 20 }
  ]
}
```

### Retry Failed Notifications
```http
POST /notifications/retry-failed
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "retriedCount": 2
}
```

### Get Pending Notifications
```http
GET /notifications/pending
Authorization: Bearer <token>

Response (200): [...]
```

### Get Notifications by Status
```http
GET /notifications/status/Sent
Authorization: Bearer <token>

Response (200): [...]
```

---

## Error Responses

### Unauthorized (401)
```json
{
  "message": "No token provided"
}
```

### Forbidden (403)
```json
{
  "message": "Forbidden"
}
```

### Not Found (404)
```json
{
  "message": "Client not found"
}
```

### Bad Request (400)
```json
{
  "message": "Validation error description"
}
```

### Server Error (500)
```json
{
  "message": "Internal server error",
  "error": "Error details (only in development)"
}
```

---

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Enums

### Client Status
- `Active`
- `Inactive`
- `Pending`

### Team Role
- `Manager`
- `Designer`
- `Videographer`
- `Content Writer`
- `Social Media Executive`
- `Developer`

### Task Status
- `Pending`
- `In Progress`
- `Review`
- `Completed`
- `On Hold`

### Task Priority
- `Low`
- `Medium`
- `High`
- `Urgent`

### Task Type
- `Post`
- `Reel`
- `Story`
- `Design`
- `Video`
- `Writing`
- `Other`

### Platform
- `Instagram`
- `Facebook`
- `LinkedIn`
- `Twitter`
- `TikTok`
- `Internal`

### Package Status
- `Active`
- `Completed`
- `On Hold`
- `Cancelled`

### Notification Status
- `Pending`
- `Sent`
- `Delivered`
- `Failed`

---

## Rate Limiting

Currently no rate limiting implemented. Recommended for production:
- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Testing with Curl

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@technoguide.com","password":"password123"}'
```

### Get Clients
```bash
curl -X GET http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","client":"id","package":"id","assignedTo":"id","dueDate":"2024-01-25"}'
```

---

**Last Updated**: January 2024
**API Version**: 1.0
**Environment**: Development & Production Ready
