# Fix Video Upload + Feed Playback Issues

## Issues Identified
1. Content-Type not always set to 'video/mp4' (currently uses file.type || 'video/mp4')
2. Video element doesn't use encodeURI(videoUrl), objectFit: 'cover', and exact attributes from requirements
3. Feed doesn't refresh immediately after upload (relies on realtime subscription which may not work reliably)
4. Error handling could be improved

## Tasks
- [ ] Fix VideoUploader.tsx: Always set contentType: 'video/mp4' in uploadVideoToStorage
- [ ] Update OptimizedVideoCard.tsx: Video element to use encodeURI(videoUrl), objectFit: 'cover', and exact attributes
- [ ] Add explicit feed refresh in Upload.tsx after successful upload
- [ ] Improve error handling in VideoUploader.tsx for invalid files
- [ ] Update useVideoFeedData.tsx if needed for better refresh handling

## Dependent Files
- src/components/upload/VideoUploader.tsx
- src/components/feed/OptimizedVideoCard.tsx
- src/pages/Upload.tsx
- src/components/feed/useVideoFeedData.tsx
