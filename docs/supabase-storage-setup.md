# Supabase Storage Setup for Image Generation

## Quick Setup (Using Service Role Key - Recommended for Scripts)

The image generation script uses the **service role key** which bypasses all RLS policies. This is the easiest way to get started.

### Steps:

1. **Get your Service Role Key:**
   - Go to your Supabase Dashboard
   - Navigate to: **Settings** > **API**
   - Find the **service_role** key (it's marked as "secret" - keep it safe!)
   - Copy the key

2. **Add to `.env.local`:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Run the image generation:**
   ```bash
   npm run generate-images
   ```

That's it! The service role key bypasses all RLS policies, so no additional setup is needed.

---

## Alternative Setup (Using Storage Policies)

If you prefer to use the anon key with proper RLS policies, follow these steps:

### 1. Create the Storage Bucket

In Supabase Dashboard:
- Go to **Storage**
- Click **New bucket**
- Name: `generated-images`
- Make it **Public** (for read access)
- Click **Create bucket**

### 2. Set Up Storage Policies

Run the migration file to set up proper policies:

```bash
# If you have Supabase CLI installed
supabase db push

# Or manually run the SQL in Supabase Dashboard:
# Go to SQL Editor > New Query > Paste the SQL from supabase/migrations/001_storage_policies.sql
```

### 3. Update Script to Use Anon Key

If you want to use anon key instead of service role key, you'll need to authenticate first. However, for scripts, **service role key is recommended** as it's simpler and more secure for server-side operations.

---

## Security Notes

- **Service Role Key**: Has full access, bypasses RLS. Use only in server-side scripts, never expose to client.
- **Anon Key**: Respects RLS policies. Safe to use in client-side code.
- **Storage Policies**: Control who can read/write to buckets when using anon key.

For the image generation script, using the service role key is the recommended approach.





