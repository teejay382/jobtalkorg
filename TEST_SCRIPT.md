# 🧪 JobTolk Testing Script

## Quick Test (2 minutes)

### 1. Start Server
```bash
npm run dev
```

### 2. Open Browser Console (F12)
Look for:
```
🚀 Running initial Supabase diagnostics...
📝 Auth: ✅
🪣 Storage: ✅
🎥 Videos: ✅
👤 Profiles: ✅
✅ All checks passed!
```

### 3. Test Feed (30 seconds)
- [ ] Feed loads (videos or empty state)
- [ ] Scroll up/down is smooth
- [ ] Videos play when tapped
- [ ] Like button works

### 4. Test Upload (60 seconds)
- [ ] Navigate to `/upload`
- [ ] Select video file
- [ ] Progress bar appears and updates
- [ ] Feed is still scrollable during upload
- [ ] Upload completes
- [ ] New video appears in feed

**✅ If all checked, everything works!**

---

## Detailed Test (10 minutes)

### A. Authentication
```javascript
// In console:
debugSupabase()
// Should show: ✅ User is authenticated
```

- [ ] User logged in
- [ ] Profile exists
- [ ] Role assigned (freelancer/employer)

### B. Storage
```javascript
// In console, check Storage line shows:
// 🪣 Storage: ✅ All storage buckets exist
```

- [ ] `videos` bucket exists
- [ ] `thumbnails` bucket exists
- [ ] `avatars` bucket exists

### C. Feed Performance
**Open Performance tab (F12 → Performance) → Record → Scroll feed**

Expected:
- [ ] 60fps (green line)
- [ ] No long tasks (yellow/red blocks)
- [ ] Memory stable (no leaks)

### D. Upload Performance
**Performance tab → Record → Upload video**

Expected:
- [ ] Main thread <20% usage
- [ ] No blocking tasks
- [ ] Progress smooth
- [ ] Memory stable

### E. Video Playback
Test each video:
- [ ] Click plays/pauses
- [ ] Autoplay works
- [ ] Mute/unmute works
- [ ] Video loads progressively
- [ ] No console errors

### F. Mobile Simulation
**DevTools → Toggle device toolbar (Ctrl+Shift+M)**

Test iPhone:
- [ ] Vertical scroll smooth
- [ ] Touch events responsive
- [ ] Videos play inline
- [ ] No zoom issues

Test Android:
- [ ] Same as iPhone
- [ ] Hardware acceleration active

### G. Error Scenarios
Test error handling:

**No videos:**
- [ ] Shows empty state with upload button

**Network offline:**
- [ ] Shows error message
- [ ] Can retry

**Invalid video format:**
- [ ] Shows validation error
- [ ] Prevents upload

**Large file (>100MB):**
- [ ] Shows size error
- [ ] Prevents upload

### H. Concurrent Operations
**Stress test:**
1. Start video upload
2. Scroll feed during upload
3. Like videos during upload
4. Open comments during upload

Expected:
- [ ] Everything works smoothly
- [ ] No lag or freezing
- [ ] Upload completes successfully

---

## Performance Benchmarks

### Feed Scroll
- **Target:** 60fps
- **Acceptable:** >50fps
- **Fail:** <30fps

### Upload Progress
- **Target:** Smooth 60fps updates
- **Acceptable:** Visible updates every frame
- **Fail:** Stuttering or frozen

### Memory Usage
- **Target:** <100MB increase during upload
- **Acceptable:** <200MB increase
- **Fail:** >500MB or continuous growth

### Main Thread
- **Target:** <5% during upload
- **Acceptable:** <20% during upload
- **Fail:** >50% causing UI lag

---

## Common Issues & Fixes

### Issue: "Missing storage buckets"
```bash
# Fix: Run migration
# In Supabase Dashboard → SQL Editor:
# Copy/paste: supabase/migrations/20251024000000_ensure_storage_buckets.sql
# Run it
```

### Issue: Feed frozen during upload
```javascript
// Check in console:
// Should NOT see rapid setState calls
// If you do, the fix wasn't applied correctly
```

### Issue: Videos not playing
```javascript
// Check video URL in console:
console.log(videos[0].video_url)
// Should be: https://...supabase.co/storage/v1/object/public/videos/...
```

### Issue: Progress bar not updating
```javascript
// Check upload context:
const { getCurrentUploads } = useUploadContext();
console.log(getCurrentUploads());
// Should show progress value changing
```

---

## Manual Diagnostic Commands

### Check Storage Buckets
```javascript
const { data } = await supabase.storage.listBuckets();
console.log(data.map(b => b.name));
// Should include: ['videos', 'thumbnails', 'avatars', 'chat-files']
```

### Check Videos Count
```javascript
const { count } = await supabase
  .from('videos')
  .select('*', { count: 'exact', head: true });
console.log(`Videos: ${count}`);
```

### Check Upload Context
```javascript
// Add to any component:
const { activeUploads, getCurrentUploads } = useUploadContext();
console.log('State:', activeUploads);
console.log('Ref:', getCurrentUploads());
// Ref should update rapidly, state should update rarely
```

### Monitor Re-renders
```javascript
// Add to component:
useEffect(() => {
  console.log('Component rendered!');
});
// During upload, this should trigger rarely (4-5 times total)
```

---

## Success Criteria

### ✅ All Tests Pass
1. Diagnostics show green checkmarks
2. Feed scrolls at 60fps
3. Videos load and play
4. Upload progress smooth
5. No console errors
6. No memory leaks
7. Mobile works perfectly

### ✅ Performance Targets Met
1. <5% main thread during upload
2. 60fps scroll
3. <100MB memory increase
4. Smooth progress bar

### ✅ User Experience Excellent
1. No lag or freezing
2. Instant responsiveness
3. Clear feedback
4. Helpful error messages

---

**If all tests pass, ship it! 🚀**
