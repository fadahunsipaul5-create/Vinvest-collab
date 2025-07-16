# Google OAuth Setup Guide

## Issues Fixed

1. ✅ **Backend Error**: Fixed `requests.Request()` → `google_requests.Request()`
2. ✅ **CORS Configuration**: Added proper CORS headers and origins
3. ✅ **Error Handling**: Added better error handling and logging

## Required Setup

### 1. Backend Environment Variables

Create a `.env` file in the `backend/` directory with:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=791634680391-j71tp9g348el3j1k1c9fdt9op95eo76s.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Django Settings
SECRET_KEY=your_django_secret_key_here
DEBUG=True

# Database Settings (for local development)
DB_NAME=sec_insights_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=127.0.0.1
DB_PORT=5432

# Email Settings
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password_here
DEFAULT_FROM_EMAIL=your_email@gmail.com

# SEC API Settings
SEC_API_KEY=your_sec_api_key_here
SEC_API_BASE_URL=https://api.sec-api.io
SEC_USER_AGENT=Nanik Workforce paul@nanikworkforce.com

# Redis Settings
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Site URL
SITE_URL=http://localhost:5173
```

### 2. Google OAuth Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Find your OAuth 2.0 Client ID: `791634680391-j71tp9g348el3j1k1c9fdt9op95eo76s.apps.googleusercontent.com`
5. Click "Edit"
6. Add these **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://localhost:3000
   http://127.0.0.1:3000
   https://sec-frontend-791634680391.us-central1.run.app
   https://sec-insights-app-d9wp.vercel.app
   ```
7. Add these **Authorized redirect URIs**:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://localhost:3000
   http://127.0.0.1:3000
   https://sec-frontend-791634680391.us-central1.run.app
   https://sec-insights-app-d9wp.vercel.app
   ```

### 3. Start the Servers

**Backend:**
```bash
cd backend
python manage.py runserver
```

**Frontend:**
```bash
cd sec_frontend
npm run dev
```

### 4. Test the Setup

1. Open your browser to `http://localhost:5173`
2. Click the Google Sign-in button
3. Check the browser console for any remaining errors
4. Check the backend console for authentication logs

## Troubleshooting

### "The given origin is not allowed for the given client ID"
- Make sure you've added your frontend URL to the Google OAuth console
- Check that the URL exactly matches (including protocol and port)

### "GOOGLE_CLIENT_ID not configured"
- Ensure your `.env` file is in the `backend/` directory
- Verify the `GOOGLE_CLIENT_ID` variable is set correctly

### CORS Errors
- The backend now includes all necessary CORS headers
- Make sure your frontend is running on one of the allowed origins

### 500 Internal Server Error
- Check the backend console for detailed error messages
- Verify all environment variables are set correctly 