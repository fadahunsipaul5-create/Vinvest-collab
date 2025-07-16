# Update Backend to Use New Client ID

## ✅ Frontend Updated
The frontend has been updated to use your new client ID: `791634680391-elnan8tnv6tp3247anotm14g6g671uvi.apps.googleusercontent.com`

## 🔧 Backend Configuration Required

You need to update your backend `.env` file to use the same client ID.

### Step 1: Edit backend/.env
Open `backend/.env` and change this line:
```bash
# Before:
GOOGLE_CLIENT_ID=791634680391-j71tp9g348el3j1k1c9fdt9op95eo76s.apps.googleusercontent.com

# After:
GOOGLE_CLIENT_ID=791634680391-elnan8tnv6tp3247anotm14g6g671uvi.apps.googleusercontent.com
```

### Step 2: Restart Backend Server
After updating the `.env` file, restart your backend server:
```bash
cd backend
python manage.py runserver
```

### Step 3: Configure Google OAuth Console
Make sure your new client ID is configured in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Find your new client ID: `791634680391-elnan8tnv6tp3247anotm14g6g671uvi.apps.googleusercontent.com`
4. Click "Edit"
5. Add these **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://localhost:3000
   http://127.0.0.1:3000
   https://sec-frontend-791634680391.us-central1.run.app
   https://sec-insights-app-d9wp.vercel.app
   ```
6. Add these **Authorized redirect URIs**:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://localhost:3000
   http://127.0.0.1:3000
   https://sec-frontend-791634680391.us-central1.run.app
   https://sec-insights-app-d9wp.vercel.app
   ```
7. Save changes

## 🎯 Result
After these changes:
- **Frontend**: Uses `791634680391-elnan8tnv6tp3247anotm14g6g671uvi.apps.googleusercontent.com`
- **Backend**: Expects tokens from `791634680391-elnan8tnv6tp3247anotm14g6g671uvi.apps.googleusercontent.com`
- **Google OAuth**: Configured to allow your frontend URLs

## 🚀 Test
1. Restart both frontend and backend servers
2. Try Google authentication
3. Check that users are created/logged in properly

## 📝 Notes
- Both frontend and backend must use the same client ID
- The new client ID should resolve the "wrong audience" error
- Make sure to wait a few minutes after updating Google OAuth console for changes to propagate 