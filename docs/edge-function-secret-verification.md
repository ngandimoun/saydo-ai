# Edge Function Secret Verification

## ✅ What We've Done

### 1. Secret Stored in Vault ✅
- **Secret Name**: `OPENWEATHERMAP_API_KEY`
- **Value**: `b3251fdc5670a0b224c2c5eb410a2504`
- **Location**: Supabase Vault
- **Created**: 2025-12-28 11:19:09 UTC
- **Status**: ✅ Verified via SQL query

### 2. Client-Side Configuration ✅
- **File**: `.env.local`
- **Variable**: `NEXT_PUBLIC_OPENWEATHERMAP_API_KEY`
- **Status**: ✅ Configured

## ⚠️ Important: Edge Function Secrets vs Vault Secrets

**Vault secrets** (what we stored via MCP) are for:
- Database-level secrets
- Accessible via SQL functions like `vault.decrypted_secrets`
- Used in database triggers, functions, etc.

**Edge Function secrets** (what Edge Functions need) are:
- Managed separately via Dashboard or CLI
- Accessible via `Deno.env.get()` in Edge Functions
- Required for the `fetch-environment-data` function

## 🔧 Next Step Required

The Edge Function `fetch-environment-data` uses:
```typescript
const openWeatherMapKey = Deno.env.get('OPENWEATHERMAP_API_KEY')
```

This reads from **Edge Function secrets**, not Vault. You need to set it via:

### Option 1: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/bjlzeoojhplgjbajfihu/settings/functions
2. Scroll to "Secrets" section
3. Click "Add new secret"
4. Enter:
   - **Name**: `OPENWEATHERMAP_API_KEY`
   - **Value**: `b3251fdc5670a0b224c2c5eb410a2504`
5. Click "Save"

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed and authenticated
supabase secrets set OPENWEATHERMAP_API_KEY=b3251fdc5670a0b224c2c5eb410a2504 --project-ref bjlzeoojhplgjbajfihu
```

## 🧪 Testing

Once the secret is set in Edge Function secrets, you can test it:

1. **Via the app**: 
   - Log in to Saydo
   - The location updater will automatically fetch environment data
   - Check the `environment_data` table in Supabase

2. **Via test script**:
   ```bash
   npm run test-edge-secret
   ```
   (Requires you to be logged in to the app first)

3. **Via Edge Function logs**:
   - Go to: https://supabase.com/dashboard/project/bjlzeoojhplgjbajfihu/functions/fetch-environment-data/logs
   - Invoke the function and check for errors

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Vault Secret | ✅ Complete | Stored via MCP SQL |
| Client Config | ✅ Complete | In `.env.local` |
| Edge Function Secret | ⚠️ Manual | Needs Dashboard/CLI setup |

## 🎯 Summary

- ✅ Secret is stored in Vault (for database use)
- ✅ Client-side API key is configured
- ⚠️ Edge Function secret needs to be set via Dashboard (separate system)

Once you set the Edge Function secret via Dashboard, the `fetch-environment-data` function will be able to fetch UV index and weather data!

