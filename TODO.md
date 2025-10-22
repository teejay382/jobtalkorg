# Video Upload and Display Fixes - TODO

## Current Status
- [x] Analysis completed - identified autoplay policy violation and MIME type issue
- [x] Plan approved by user

## Tasks to Complete

### 1. Fix Autoplay Policy Violation in OptimizedVideoCard.tsx
- [ ] Remove automatic video.play() calls that trigger NotAllowedError
- [ ] Ensure videos only play on explicit user interaction (click)
- [ ] Keep play button overlay visible when video is paused

### 2. Fix MIME Type Issue in VideoUploader.tsx
- [ ] Modify uploadVideoToStorage function to set 'video/mp4' Content-Type header
- [ ] Add proper file validation for video files
- [ ] Ensure file extension is properly handled

### 3. Enhance Video Display Error Handling
- [ ] Improve error handling for video loading failures
- [ ] Add better fallback display when videos fail to load
- [ ] Add MIME type validation before rendering

### 4. Testing and Validation
- [ ] Test video upload with correct MIME type
- [ ] Verify video playback requires user interaction
- [ ] Test progress bar and background upload
- [ ] Confirm video deletion works properly

## Files to Edit
- src/components/feed/OptimizedVideoCard.tsx
- src/components/upload/VideoUploader.tsx

## Notes
- Upload process already has progress bars and background mode
- Profile page already shows thumbnails with delete buttons
- Need to ensure MIME type is set during XMLHttpRequest upload
- Autoplay policy requires user gesture for video playback
