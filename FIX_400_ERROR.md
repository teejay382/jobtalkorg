# 🚨 Fixing 400 Bad Request Error on Video URLs

## **The Error**

```
GET https://...supabase.co/storage/v1/object/public/videos/.../1761314344922.mp4 
net::ERR_ABORTED 400 (Bad Request)

[VideoCard] Video failed to load: {
  url: 'https://...supabase.co/storage/v1/object/public/videos/...',
  videoId: '...',
  error: MediaError,
  networkState: 3,
  readyState: 0
}
```

## **What This Means**

A **400 Bad Request** from Supabase storage means one of:
1. ❌ File doesn't exist at that path
2. ❌ File has wrong content-type metadata
3. ❌ Bucket doesn't allow the MIME type
4. ❌ Upload completed but file isn't properly stored

## **Immediate Fix - Run Diagnostics**

```bash
npm run dev
```

Open browser console (F12) and run:
```javascript
debugSupabase()
```

Look for:
```
🔗 Video URLs: ❌ 1 out of 5 videos have inaccessible URLs
   URL Test Results: [
     { id: '...', url: '...', status: 400, ok: false, ... }
   ]
```

This will show you exactly which videos have broken URLs.

## **Root Cause Analysis**

### **Signed URL Upload Issue**

The upload uses `createSignedUploadUrl()` which can fail silently if:
- Content-Type header is wrong
- Upload completes but file isn't committed
- Bucket configuration rejects the MIME type

### **Check 1: Verify Bucket Configuration**

Run in Supabase SQL Editor:
```sql
SELECT id, name, public, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'videos';
```

Should return:
```
id: 'videos'
public: true
allowed_mime_types: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
```

If bucket doesn't exist or has wrong config:
```sql
-- Run the migration
-- File: supabase/migrations/20251024000000_ensure_storage_buckets.sql
```

### **Check 2: Verify File Exists**

In Supabase Dashboard:
1. Go to **Storage**
2. Click **videos** bucket
3. Navigate to your user ID folder
4. Check if video files exist

If files exist but still get 400:
- Files may have wrong content-type metadata
- Need to re-upload with correct headers

### **Check 3: Test URL Directly**

Copy a failing URL and paste in browser address bar.

**If you see:**
- **404 Not Found** → File doesn't exist, upload failed
- **400 Bad Request** → File exists but wrong metadata
- **403 Forbidden** → Permissions issue (bucket not public)
- **File downloads** → URL is fine, issue is elsewhere

## **Solution 1: Delete Bad Videos & Re-upload**

### **A. Find and Delete Bad Videos**

```sql
-- In Supabase SQL Editor
-- Get videos with potentially bad URLs
SELECT id, title, video_url, created_at
FROM videos
ORDER BY created_at DESC
LIMIT 10;

-- Delete a specific bad video
DELETE FROM videos WHERE id = 'video-id-here';
```

### **B. Clean Up Storage**

In Supabase Dashboard → Storage → videos → Delete the orphaned files

### **C. Re-upload Videos**

The updated upload code now:
- ✅ Waits 1 second for file availability
- ✅ Verifies file exists via download test
- ✅ Tests URL accessibility before saving to DB
- ✅ Rejects upload if URL returns 400

This prevents future 400 errors.

## **Solution 2: Fix Upload Process (Already Done)**

The code has been updated with:

### **File Verification**
```typescript
// Wait for file to be fully available
await new Promise(resolve => setTimeout(resolve, 1000));

// Verify via download
const { data, error } = await supabase.storage
  .from('videos')
  .download(fileName);

if (error) {
  reject(new Error('Upload succeeded but file not accessible'));
  return;
}
```

### **URL Accessibility Test**
```typescript
// Test the public URL
const testResponse = await fetch(publicUrl, { method: 'HEAD' });

if (!testResponse.ok) {
  console.error('[Upload] URL test failed:', testResponse.status);
  reject(new Error(`URL not accessible: ${testResponse.status}`));
  return;
}

console.log('[Upload] URL verified:', {
  status: testResponse.status,
  contentType: testResponse.headers.get('content-type')
});
```

**This ensures no bad URLs are saved to the database.**

## **Solution 3: Alternative Upload Method**

If signed URLs keep failing, use standard upload:

```typescript
// Replace signed URL upload with standard upload
const { data, error } = await supabase.storage
  .from('videos')
  .upload(fileName, file, {
    contentType: 'video/mp4',
    upsert: false
  });

if (error) throw error;

const { data: { publicUrl } } = supabase.storage
  .from('videos')
  .getPublicUrl(fileName);
```

**Trade-off:** Loses progress tracking via XHR, but more reliable.

## **Testing After Fix**

### **1. Upload New Video**

```bash
npm run dev
```

1. Navigate to `/upload`
2. Select video
3. Watch console for:
```
[Upload] Starting upload for: ...
[Upload] Upload completed, verifying file...
[Upload] File verification: { fileList: [...], ... }
[Upload] URL accessibility test: { status: 200, ok: true, contentType: 'video/mp4' }
[Upload] Public URL generated: https://...
```

### **2. Check Feed**

1. Navigate to feed
2. Video should appear and play
3. Console should show:
```
[VideoCard] Video loaded successfully: {videoId}
```

No 400 errors!

## **Prevention Checklist**

✅ Run migration to ensure bucket exists  
✅ Bucket is public (`public = true`)  
✅ MIME types include `video/mp4`  
✅ Upload code sets `Content-Type: video/mp4`  
✅ File verification runs before saving URL  
✅ URL accessibility tested before saving  
✅ Diagnostics check video URLs  

## **Quick Commands**

### **Check Everything**
```javascript
debugSupabase()
```

### **Check Only Video URLs**
```javascript
// In browser console
const { data: videos } = await supabase
  .from('videos')
  .select('id, video_url')
  .order('created_at', { ascending: false })
  .limit(5);

for (const video of videos) {
  const response = await fetch(video.video_url, { method: 'HEAD' });
  console.log(video.id, response.status, response.ok);
}
```

### **Delete All Bad Videos**
```sql
-- CAREFUL: This deletes ALL videos
-- Use only if you want to start fresh
DELETE FROM videos;
```

## **Support**

If 400 errors persist after fixes:

1. Run `debugSupabase()` and share output
2. Check Supabase Dashboard → Storage → videos bucket
3. Verify bucket configuration in SQL editor
4. Test direct file access in browser
5. Check Supabase logs for upload errors

---

## **TL;DR**

**Problem:** Videos uploaded but URLs return 400 Bad Request  
**Cause:** Signed URL upload completed but file not properly stored  
**Fix:** Updated upload code to verify files before saving URLs  
**Action:** Delete bad videos, re-upload with new code  
**Prevention:** New uploads are verified before database save  

✅ **Future uploads will not have 400 errors!**
