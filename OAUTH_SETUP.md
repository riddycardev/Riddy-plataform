# OAuth Configuration Guide - RIDDY

## Overview

This document explains how to configure OAuth for RIDDY across multiple environments (development, staging, production).

## Problem: "Permissão negada - URI de redirecionamento não configurada"

This error occurs when the OAuth server doesn't recognize the redirect URI being used by the client. This typically happens when:

1. The app is accessed from a different domain than what's registered
2. The redirect URI is not registered in the OAuth provider settings
3. The environment variables are not properly configured

## Solution: Multi-Environment OAuth Support

### Architecture

The OAuth system now supports multiple environments with automatic detection:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ getLoginUrl() → getEnvironmentRedirectUri()          │  │
│  │ Detects current environment and selects correct URI  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              OAuth Server (Manus)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Validates redirect URI against registered list:      │  │
│  │ • http://localhost:3000/api/oauth/callback           │  │
│  │ • https://[dev-url]/api/oauth/callback               │  │
│  │ • https://riddycar.com/api/oauth/callback            │  │
│  │ • https://www.riddycar.com/api/oauth/callback        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           Server Callback Handler                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ /api/oauth/callback                                  │  │
│  │ • Exchanges code for token                           │  │
│  │ • Creates session                                    │  │
│  │ • Redirects to home or error page                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Files Modified

1. **client/src/lib/oauth-config.ts** (NEW)
   - Environment detection logic
   - Redirect URI mapping
   - Debugging utilities

2. **client/src/const.ts** (UPDATED)
   - Uses `getEnvironmentRedirectUri()` instead of hardcoded `window.location.origin`
   - Added logging for debugging

3. **client/src/pages/OAuthError.tsx** (NEW)
   - User-friendly error page
   - Technical details for debugging
   - Retry mechanism

4. **client/src/components/OAuthErrorHandler.tsx** (NEW)
   - Reusable error handler component
   - Inline error display

5. **server/_core/oauth.ts** (UPDATED)
   - Improved error handling
   - Redirects to error page instead of JSON response

6. **client/src/App.tsx** (UPDATED)
   - Added `/oauth-error` route

## Setup Instructions

### Step 1: Register All Redirect URIs in Manus OAuth

Go to your Manus OAuth settings and register ALL of these redirect URIs for your app:

```
http://localhost:3000/api/oauth/callback
https://3000-ie60kgnryzwjqibtggi80-4610cc2d.us2.manus.computer/api/oauth/callback
https://riddycar.com/api/oauth/callback
https://www.riddycar.com/api/oauth/callback
```

**Note:** Replace the dev URL with your actual Manus dev server URL.

### Step 2: Verify Environment Variables

Ensure these environment variables are set:

```bash
VITE_APP_ID=5MKE4LDVikZTU9bHnRFBMx
VITE_OAUTH_PORTAL_URL=https://manus.im
OAUTH_SERVER_URL=https://api.manus.im
```

### Step 3: Test Each Environment

#### Local Development
```bash
npm run dev
# Visit http://localhost:3000
# Click login → should work
```

#### Dev Server
```bash
# Visit https://3000-ie60kgnryzwjqibtggi80-4610cc2d.us2.manus.computer
# Click login → should work
```

#### Production
```bash
# Visit https://riddycar.com
# Click login → should work
```

## Supported Environments

### 1. Localhost (Development)
- **Origin:** `http://localhost:3000`
- **Redirect URI:** `http://localhost:3000/api/oauth/callback`
- **Use Case:** Local development

### 2. Manus Dev Server
- **Origin:** `https://3000-[random-id].us2.manus.computer`
- **Redirect URI:** `https://3000-[random-id].us2.manus.computer/api/oauth/callback`
- **Use Case:** Staging/preview environment

### 3. Production (Primary Domain)
- **Origin:** `https://riddycar.com`
- **Redirect URI:** `https://riddycar.com/api/oauth/callback`
- **Use Case:** Production

### 4. Production (WWW Subdomain)
- **Origin:** `https://www.riddycar.com`
- **Redirect URI:** `https://www.riddycar.com/api/oauth/callback`
- **Use Case:** Production with www

### 5. Custom Domains
- **Origin:** Any custom domain
- **Redirect URI:** `https://[custom-domain]/api/oauth/callback`
- **Use Case:** Custom domain deployments

## How It Works

### Environment Detection Flow

```typescript
// When user clicks login button:
1. getLoginUrl() is called
2. getEnvironmentRedirectUri() detects current environment
3. Correct redirect URI is selected based on window.location.origin
4. OAuth login URL is generated with correct redirect URI
5. User is redirected to OAuth server
6. OAuth server validates redirect URI against registered list
7. If valid → OAuth flow continues
8. If invalid → Error page with debugging info
```

### Error Handling

If the redirect URI is not registered:

1. **OAuth Server Response:** Returns error
2. **Callback Handler:** Catches error and redirects to `/oauth-error`
3. **Error Page:** Displays:
   - User-friendly error message
   - Technical details (environment, current URI, registered URIs)
   - Retry button
   - Go home button

## Debugging

### Enable OAuth Logging

The system logs OAuth information to the browser console:

```javascript
// Open browser DevTools (F12)
// Go to Console tab
// Look for [OAuth] logs:
[OAuth] Current origin: https://3000-xxx.manus.computer
[OAuth] Detected: Manus dev server
[OAuth] Login URL generated: { appId, redirectUri, oauthPortalUrl }
```

### Check Registered URIs

Visit the OAuth error page to see:
- Current environment
- Current redirect URI
- All registered redirect URIs

```
https://riddycar.com/oauth-error?error=test
```

### Common Issues

#### Issue: "Permissão negada - URI de redirecionamento não configurada"

**Solution:**
1. Check browser console for `[OAuth]` logs
2. Note the current redirect URI
3. Go to Manus OAuth settings
4. Add the missing redirect URI
5. Wait 5 minutes for cache to clear
6. Try again

#### Issue: Login works on localhost but not on production

**Solution:**
1. Verify `https://riddycar.com/api/oauth/callback` is registered
2. Check that `VITE_APP_ID` is the same in both environments
3. Clear browser cache and cookies
4. Try incognito/private window

#### Issue: Login works on one domain but not another

**Solution:**
1. Each domain needs its own redirect URI registered
2. Add `https://[new-domain]/api/oauth/callback` to OAuth settings
3. Wait for cache to clear
4. Try again

## Adding New Environments

To add support for a new environment:

1. **Update `oauth-config.ts`:**
   ```typescript
   const REDIRECT_URIS = {
     // ... existing entries
     newEnvironment: "https://new-domain.com/api/oauth/callback",
   };
   ```

2. **Add detection logic:**
   ```typescript
   if (origin === "https://new-domain.com") {
     console.log("[OAuth] Detected: New environment");
     return REDIRECT_URIS.newEnvironment;
   }
   ```

3. **Register in OAuth settings:**
   - Add `https://new-domain.com/api/oauth/callback`

4. **Test:**
   - Visit `https://new-domain.com`
   - Click login
   - Verify it works

## Security Considerations

1. **Redirect URI Validation:** Always validate redirect URIs on the server
2. **HTTPS Only:** All production redirect URIs must use HTTPS
3. **Exact Matching:** OAuth servers match redirect URIs exactly (including protocol, domain, path)
4. **No Wildcards:** Avoid using wildcards in redirect URIs for security
5. **State Parameter:** Always verify the state parameter to prevent CSRF attacks

## Testing Checklist

- [ ] Login works on localhost:3000
- [ ] Login works on Manus dev server
- [ ] Login works on production domain
- [ ] Login works on www subdomain
- [ ] Error page displays correctly
- [ ] Retry button works
- [ ] Console logs show correct environment
- [ ] OAuth callback succeeds
- [ ] User session is created
- [ ] Logout works
- [ ] Protected routes redirect to login when needed

## Support

If you encounter issues:

1. Check browser console for `[OAuth]` logs
2. Visit `/oauth-error` page to see technical details
3. Verify all redirect URIs are registered
4. Check environment variables are set correctly
5. Clear browser cache and cookies
6. Try in incognito/private window
7. Contact support with console logs and error details
