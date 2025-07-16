# Fix Google OAuth Origin Issue

## Current Error
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

## Problem
Your Google OAuth client ID `791634680391-j71tp9g348el3j1k1c9fdt9op95eo76s.apps.googleusercontent.com` is not configured to allow requests from your current frontend URL.

## Solution Steps

### Step 1: Determine Your Frontend URL
Your frontend is likely running on one of these URLs:
- `http://localhost:5173` (Vite default)
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

### Step 2: Configure Google OAuth Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Configuration**
   - Go to "APIs & Services" → "Credentials"
   - Find your OAuth 2.0 Client ID: `791634680391-j71tp9g348el3j1k1c9fdt9op95eo76s.apps.googleusercontent.com`
   - Click "Edit" (pencil icon)

3. **Add Authorized JavaScript Origins**
   Add ALL of these URLs:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://localhost:3000
   http://127.0.0.1:3000
   https://sec-frontend-791634680391.us-central1.run.app
   https://sec-insights-app-d9wp.vercel.app
   ```

4. **Add Authorized Redirect URIs**
   Add ALL of these URLs:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://localhost:3000
   http://127.0.0.1:3000
   https://sec-frontend-791634680391.us-central1.run.app
   https://sec-insights-app-d9wp.vercel.app
   ```

5. **Save Changes**
   - Click "Save" at the bottom of the page
   - Wait a few minutes for changes to propagate

### Step 3: Verify Your Frontend URL

Check what URL your frontend is actually running on:

1. **Start your frontend server:**
   ```bash
   cd sec_frontend
   npm run dev
   ```

2. **Look at the terminal output** - it should show something like:
   ```
   Local:   http://localhost:5173/
   Network: http://192.168.1.100:5173/
   ```

3. **Note the exact URL** - this is what you need to add to Google OAuth console

### Step 4: Test the Fix

1. **Clear browser cache** or open an incognito window
2. **Restart your frontend server** if needed
3. **Try the Google Sign-in again**

### Step 5: Alternative - Check Network Tab

If you're still having issues, check the browser's Network tab:

1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to sign in with Google
4. Look for the failed request to `accounts.google.com/gsi/button`
5. Check the exact URL that's being blocked

## Common Issues

### Issue 1: Wrong Port
- Make sure you're adding the correct port (5173, 3000, etc.)
- Check your terminal output for the exact URL

### Issue 2: Protocol Mismatch
- Use `http://` for local development
- Use `https://` for production
- Don't mix them up

### Issue 3: Trailing Slash
- Some configurations are sensitive to trailing slashes
- Try both with and without trailing slash:
  ```
  http://localhost:5173
  http://localhost:5173/
  ```

### Issue 4: Changes Not Propagated
- Google OAuth changes can take 5-10 minutes to propagate
- Wait a few minutes after saving changes
- Try clearing browser cache

## Quick Test

To quickly test if the origin is now allowed:

1. Open your browser console
2. Run this JavaScript:
   ```javascript
   fetch('https://accounts.google.com/gsi/status?client_id=791634680391-j71tp9g348el3j1k1c9fdt9op95eo76s.apps.googleusercontent.com')
     .then(response => console.log('Status:', response.status))
     .catch(error => console.log('Error:', error));
   ```

If you get a 200 status, the origin is allowed. If you get a 403, the origin is still not configured correctly.

## Emergency Fix

If you need to test immediately and can't wait for Google OAuth changes:

1. **Use a different port** that's already configured
2. **Use the production URL** if available
3. **Temporarily disable origin checking** (not recommended for production)

## Next Steps

After fixing the origin issue:
1. Test the Google Sign-in flow
2. Check that the backend receives the token correctly
3. Verify that users are created/logged in properly 