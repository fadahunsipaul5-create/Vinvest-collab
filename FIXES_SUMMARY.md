# Google OAuth Fixes Summary

## ✅ Issues Fixed

### 1. Backend Server Error (500 Internal Server Error)
**Problem**: `'Request' object is not callable`
**Solution**: Fixed import in `backend/account/views.py`
```python
# Before (line 44):
idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)

# After:
idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
```

### 2. CORS Configuration
**Problem**: Cross-origin requests blocked
**Solution**: Updated `backend/backend/settings.py`
- Added more allowed origins: `http://localhost:3000`, `http://127.0.0.1:5173`, `http://127.0.0.1:3000`
- Added comprehensive CORS headers and methods
- Enabled CORS credentials

### 3. Frontend API Configuration
**Problem**: Hardcoded backend URL
**Solution**: Updated `sec_frontend/src/components/api.ts`
```typescript
// Now uses local backend for development, production for production
const baseUrl = import.meta.env.DEV 
  ? 'http://127.0.0.1:8000' 
  : 'https://sec-insights-backend-791634680391.us-central1.run.app'
```

### 4. Register Component API Call
**Problem**: Hardcoded localhost URL
**Solution**: Updated `sec_frontend/src/components/register.tsx`
```typescript
// Before:
const response = await axios.post(`http://127.0.0.1:8000/account/google-auth/`, {

// After:
const response = await axios.post(`${baseUrl}/account/google-auth/`, {
```

### 5. Error Handling
**Added**: Better error handling in both frontend and backend
- Backend: Added detailed error logging and GOOGLE_CLIENT_ID validation
- Frontend: Added user-friendly error messages and network error detection

## 🔧 Files Modified

1. `backend/account/views.py` - Fixed Google token verification
2. `backend/backend/settings.py` - Enhanced CORS configuration
3. `sec_frontend/src/components/api.ts` - Dynamic backend URL
4. `sec_frontend/src/components/register.tsx` - Fixed API call and error handling
5. `backend/.env` - Created environment configuration template

## 🚀 Next Steps

### 1. Configure Google OAuth Console
Go to [Google Cloud Console](https://console.cloud.google.com/) and add these **Authorized JavaScript origins**:
```
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000
https://sec-frontend-791634680391.us-central1.run.app
https://sec-insights-app-d9wp.vercel.app
```

### 2. Update Environment Variables
Edit `backend/.env` and replace placeholder values:
- `GOOGLE_CLIENT_SECRET` - Get from Google Cloud Console
- `SECRET_KEY` - Generate a secure Django secret key
- Database credentials
- Email settings

### 3. Start Servers
```bash
# Backend
cd backend
python manage.py runserver

# Frontend (in new terminal)
cd sec_frontend
npm run dev
```

### 4. Test Authentication
1. Open `http://localhost:5173`
2. Click Google Sign-in
3. Check browser console and backend logs for any remaining issues

## 🐛 Troubleshooting

### "The given origin is not allowed for the given client ID"
- Verify your frontend URL is added to Google OAuth console
- Check that the URL exactly matches (including protocol and port)

### "GOOGLE_CLIENT_ID not configured"
- Ensure `.env` file exists in `backend/` directory
- Verify `GOOGLE_CLIENT_ID` is set correctly

### CORS Errors
- Backend now includes comprehensive CORS configuration
- Ensure frontend is running on an allowed origin

### 500 Internal Server Error
- Check backend console for detailed error messages
- Verify all environment variables are set correctly
- Ensure `google-auth` package is installed

## 📝 Notes

- The backend now uses `google_requests.Request()` instead of `requests.Request()`
- CORS is configured to allow credentials and all necessary headers
- Frontend automatically switches between local and production backend URLs
- Error handling provides detailed logging for debugging 