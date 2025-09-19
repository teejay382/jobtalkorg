# Hybrid Hiring System Implementation

## 1. Hire Button on Videos
- [ ] Enhance Hire button in VideoCard.tsx to open chat modal pre-filled with "Hi [freelancer_username], I'm interested in hiring you. Let's discuss!"
- [ ] Ensure button visibility only for logged-in employers viewing freelancer videos
- [ ] Ensure mobile and web compatibility

## 2. Employer Job Posting
- [ ] Add "Post a Job" menu item in MobileMenu.tsx for employers
- [ ] Create new PostJob.tsx page with form fields: title, description, budget, timeline, created_by (employer_id)
- [ ] Save jobs in Supabase jobs table
- [ ] Extend Profile.tsx to show posted jobs for employers

## 3. Apply with Video
- [ ] Create migration for applications table with fields: id, job_id, freelancer_id, video_id, created_at
- [ ] Add "Apply with Video" button in JobCard.tsx visible only to freelancers
- [ ] Create ApplyWithVideoModal.tsx component to select/upload video
- [ ] Implement application saving logic

## 4. Permissions & UI/UX
- [ ] Add role-based permission checks throughout the app
- [ ] Show appropriate messages for unauthorized access
- [ ] Ensure responsive design using Tailwind + ShadCN
- [ ] Test on mobile and desktop

## 5. Testing & Integration
- [ ] Test all features end-to-end
- [ ] Update routing in App.tsx if needed
- [ ] Ensure proper error handling and user feedback
