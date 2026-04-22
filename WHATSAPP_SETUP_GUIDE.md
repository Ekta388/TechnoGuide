# WhatsApp Integration Setup Guide

## Overview
This guide explains how to properly set up WhatsApp notifications for TechnoGuide. When tasks are assigned to team members, they will receive WhatsApp notifications with task details.

## Prerequisites
- WhatsApp Business Account
- Meta/Facebook Developer Account
- Access to Meta Cloud API

## Step 1: Get WhatsApp API Credentials

### 1.1 Create/Access Meta Developer Account
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app or access existing app
3. Add WhatsApp product to your app

### 1.2 Get Phone Number ID
1. Go to WhatsApp Business API dashboard
2. Navigate to "Phone Numbers" section
3. Copy your Phone Number ID (should look like: `123456789123456789`)

### 1.3 Get Business Account ID
1. In WhatsApp dashboard, go to "Settings" or "Account"
2. Find and copy Business Account ID

### 1.4 Generate API Key/Access Token
1. Go to Settings > Accounts
2. Generate a permanent access token with WhatsApp Business Account permissions
3. This token allows API access to send messages

## Step 2: Update Environment Variables

Edit `backend/.env` file and update:

```env
PORT=5000
MONGODB_URI=mongodb+srv://rananirav474_db_user:KoisSqyiobUzpU7D@cluster0.futpmif.mongodb.net/techno_guild_db
JWT_SECRET=your_super_secret_random_string_123

# WhatsApp Configuration
WHATSAPP_API_KEY=YOUR_ACCESS_TOKEN_HERE
WHATSAPP_PHONE_NUM_ID=YOUR_PHONE_NUMBER_ID_HERE
WHATSAPP_BUSINESS_ACCOUNT_ID=YOUR_BUSINESS_ACCOUNT_ID_HERE
```

**Replace the following:**
- `YOUR_ACCESS_TOKEN_HERE` - Use your permanent access token from Step 1.4
- `YOUR_PHONE_NUMBER_ID_HERE` - Use your Phone Number ID from Step 1.2
- `YOUR_BUSINESS_ACCOUNT_ID_HERE` - Use your Business Account ID from Step 1.3

## Step 3: Verify Team Member Phone Numbers

Ensure all team members have properly formatted phone numbers in the database:

1. Go to Team Management page in TechnoGuide
2. Each team member must have a phone number in format: `+91 9876543210` (with country code)
3. The system will automatically strip non-digit characters for API calls

## Step 4: Test Configuration

### Test via Notifications Page
1. Navigate to **Notifications** page in TechnoGuide
2. Scroll to "Test WhatsApp Integration" section
3. Enter a phone number (e.g., `+91 9876543210`)
4. Click "Send Test" button
5. You should receive a test message on WhatsApp

### Test via Task Assignment
1. Go to **Tasks** management
2. Create a new task and assign it to a team member
3. The team member should receive a WhatsApp notification with task details

## Step 5: Monitor Notifications

### Check Notification Status
1. Go to **Notifications** page
2. View all sent notifications with status indicators:
   - 🟢 **Sent** - Successfully sent to WhatsApp API
   - 🔵 **Delivered** - Delivered to recipient's phone
   - 🟠 **Pending** - Waiting to be sent
   - 🔴 **Failed** - Failed to send

### Retry Failed Notifications
1. Click "Retry Failed" button if there are failed notifications
2. System will attempt to resend up to 3 times

## Troubleshooting

### Issue: "retryFailedNotifications is not a function"
- **Cause**: API method was missing
- **Fix**: This has been resolved in the latest update
- **Verify**: Refresh the notifications page

### Issue: NaN appearing in notification statistics
- **Cause**: Stats values not properly initialized
- **Fix**: Stats initialization has been improved with default values
- **Verify**: Clear browser cache and reload

### Issue: Notifications not sending to team members
- **Checklist**:
  1. Verify WHATSAPP_API_KEY is set correctly in `.env`
  2. Verify WHATSAPP_PHONE_NUM_ID is correct
  3. Check team member phone numbers are in correct format (`+[country-code][number]`)
  4. Test with Send Test button first
  5. Check backend logs for errors: `npm run dev` in `backend/` folder
  6. Verify WhatsApp Business Account status is active

### Issue: "Invalid phone number format"
- **Cause**: Phone not in correct format
- **Fix**: Use format `+[country-code][number]` e.g., `+91 9876543210`
- **System handles**: Non-digit characters are automatically removed

### Issue: "Template not found"
- **Cause**: WhatsApp template not created
- **Current implementation**: Uses text messages instead of templates
- **Note**: Pre-defined templates can be created in Meta dashboard for production

## WhatsApp Message Format

### Task Assignment Message
```
🎯 NEW TASK ASSIGNMENT

Task: [Task Title]
Client: [Client Name]
Package: [Package Name]
Due: [Due Date]
Priority: [Priority Level]

Check dashboard for details.
```

### Other Message Types
- Daily Reminder
- Task Completion Alert
- Client Activity Alert
- System Alerts

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notifications` | GET | Get all notifications |
| `/api/notifications/stats` | GET | Get notification statistics |
| `/api/notifications/test` | POST | Send test notification |
| `/api/notifications/retry-failed` | POST | Retry failed notifications |
| `/api/notifications/:id/mark-read` | PATCH | Mark notification as delivered |

## Security Notes

1. **Never commit `.env` file** to version control
2. **Rotate access tokens** regularly (every 90 days recommended)
3. **Use environment variables** for all credentials
4. **Monitor API usage** in Meta dashboard for suspicious activity

## Recent Fixes (v1.1)

1. Added missing `retryFailedNotifications()` method to API service
2. Fixed NaN warning in notification statistics display
3. Improved error handling in WhatsApp service
4. Added validation for team member phone numbers
5. Better error logging for debugging

## Support

For issues or questions:
1. Check backend logs: `npm run dev`
2. Verify `.env` configuration
3. Test with the Test Notification feature
4. Review troubleshooting section above
