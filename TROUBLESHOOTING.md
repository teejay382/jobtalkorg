# Video Feed Troubleshooting Guide

## Issues Fixed

I've implemented several fixes for your video feed issues:

### 1. **Better Error Handling & Empty States**
   - ✅ Added proper empty state when no videos exist (not shown as error)
   - ✅ Enhanced error messages with detailed logging
   - ✅ Distinguishes between "no videos" and actual errors

### 2. **Debug Utility**
   - ✅ Created `src/utils/debugSupabase.ts` for diagnostics
   - ✅ Automatically runs on app start in development mode
   - ✅ Can be manually triggered via browser console: `debugSupabase()`

### 3. **Storage Bucket Migration**
   - ✅ Created migration to ensure all buckets exist with proper policies
   - ✅ Location: `supabase/migrations/20251024000000_ensure_storage_buckets.sql`

## How to Test & Fix

### Step 1: Run the Development Server

```bash
npm run dev
```

### Step 2: Check Browser Console

Open your browser console (F12) and look for:

```
🚀 Running initial Supabase diagnostics...
📝 Auth: ✅ User is authenticated
🪣 Storage: ✅ All storage buckets exist
🎥 Videos: ✅ Videos table has X videos
👤 Profiles: ✅ Profiles table has X profiles
```

### Step 3: Identify the Issue

The diagnostics will tell you exactly what's wrong:

#### If you see: **"Missing storage buckets"**
**Solution:** Run the migration in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `supabase/migrations/20251024000000_ensure_storage_buckets.sql`
3. Refresh your app

#### If you see: **"Videos table has 0 videos"**
**Solution:** This is normal if you haven't uploaded any videos yet

1. Click the "Upload Your First Video" button in the feed
2. Upload a test video
3. The feed should update automatically via realtime subscription

#### If you see: **"No active session - user not logged in"**
**Solution:** You need to sign in

1. Navigate to `/auth` or click the sign-in button
2. Complete authentication
3. Return to the feed

#### If you see: **"Failed to load videos: [error message]"**
**Solution:** Database permission issue

1. Check RLS policies in Supabase
2. Ensure policies allow SELECT on videos table for authenticated users
3. The migration should have fixed this

### Step 4: Manual Diagnostics

If automatic diagnostics don't run, you can trigger them manually:

1. Open browser console (F12)
2. Type: `debugSupabase()`
3. Press Enter
4. Review the output

### Step 5: Upload a Test Video

1. Navigate to `/upload`
2. Select a video file (MP4, WebM, MOV, etc.)
3. Fill in title and description
4. Click "Publish"
5. Watch the upload progress
6. You should be redirected to feed with your new video

## Common Issues & Solutions

### Issue: "Bucket not found" error during upload

**Cause:** Storage buckets don't exist in Supabase

**Fix:**
```bash
# Apply the migration via Supabase CLI
supabase migration up

# Or manually run the SQL in Supabase Dashboard
```

### Issue: Feed shows loading spinner forever

**Cause:** Query is stuck or failed silently

**Fix:**
1. Check browser console for error messages
2. Run `debugSupabase()` to check connection
3. Hard refresh the page (Ctrl+Shift+R)

### Issue: Video uploaded but doesn't appear in feed

**Cause:** Realtime subscription may not be working

**Fix:**
1. Manually refresh the page
2. Check Supabase Realtime settings are enabled
3. Verify `videos-changes` channel subscription in console

### Issue: "NotSupportedError" during video playback

**Cause:** Video format not supported by browser

**Fix:**
- Upload videos in MP4 format (H.264 codec)
- The uploader now forces `.mp4` extension for consistency
- Convert videos to MP4 before uploading

## Files Modified

1. **src/components/feed/VirtualizedVideoFeed.tsx**
   - Added empty state UI
   - Better error handling

2. **src/components/feed/useVideoFeedData.tsx**
   - Enhanced error logging
   - Fixed empty state handling

3. **src/App.tsx**
   - Added automatic diagnostics on mount

4. **src/utils/debugSupabase.ts** (NEW)
   - Diagnostic utility for troubleshooting

5. **supabase/migrations/20251024000000_ensure_storage_buckets.sql** (NEW)
   - Ensures all buckets exist with proper policies

## Next Steps

1. **Start the dev server**: `npm run dev`
2. **Check console output** for diagnostic results
3. **Fix any issues** identified by diagnostics
4. **Upload a test video** to verify everything works
5. **Report back** if you encounter any errors

## Need Help?

If you still encounter issues after following this guide:

1. Share the console output from `debugSupabase()`
2. Provide any error messages from browser console
3. Check Supabase dashboard for database/storage status
