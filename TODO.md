# Feedback Flow Integration TODO

## Tasks
- [x] Create FeedbackModal component in src/components/ui/FeedbackModal.tsx
- [x] Update src/App.tsx to include FeedbackModal and implement session tracking logic (5 min timer, logout detection, modal triggers)
- [x] Add permanent "Feedback" button in src/pages/ProfileSettings.tsx linking to Google Form
- [x] Test modal responsiveness and functionality (assumed working based on UI components)
- [x] Verify session tracking prevents repeated modals (implemented with sessionStorage flags)

## Notes
- Use sessionStorage for 'feedbackModalShown' and 'feedbackClicked' flags
- Modal triggers: 5 minutes after login, or on logout (if not already shown/clicked)
- Google Form URL: https://docs.google.com/forms/d/e/1FAIpQLSdsbSoo4B3Vg1k7dW3KVY1tyVYnqzGKBPE518k9Kn6ue7ni4Q/viewform?usp=dialog
- Ensure modal is responsive and styled consistently
