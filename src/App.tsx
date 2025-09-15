import React, { useEffect, useMemo, lazy, Suspense, useState, useCallback, useRef } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from "./components/ErrorBoundary";
import { useNotifications } from '@/hooks/useNotifications';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';

// Lazy-load pages (code splitting)
const Index = lazy(() => import('./pages/Index'));
const Search = lazy(() => import('./pages/Search'));
const Upload = lazy(() => import('./pages/Upload'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const Auth = lazy(() => import('./pages/Auth'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const NotFound = lazy(() => import('./pages/NotFound'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Lazy-load heavy UI pieces (to reduce initial bundle)
const Toaster = lazy(() => import('@/components/ui/toaster').then(mod => ({ default: mod.Toaster })));
const Sonner = lazy(() => import('@/components/ui/sonner').then(mod => ({ default: mod.Toaster })));

const LoadingSkeleton = () => (
  <div aria-busy="true" className="w-full h-full flex items-center justify-center p-6">Loading…</div>
);

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdsbSoo4B3Vg1k7dW3KVY1tyVYnqzGKBPE518k9Kn6ue7ni4Q/viewform?usp=dialog';

const App = () => {
  console.log("App component is loading...");

  // create a memoized QueryClient so it's stable across renders
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        // cacheTime removed because it's not allowed by current react-query types; use staleTime instead
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  }), []);

  // initialize global realtime notifications (comments/likes/messages)
  useNotifications();

  // Request browser notification permission if not already granted/denied
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Feedback modal state and session tracking
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const { session } = useAuth();
  const hasLoggedInRef = useRef(false);

  // Check sessionStorage flags
  const hasShownModal = sessionStorage.getItem('feedbackModalShown') === 'true';
  const hasClickedFeedback = sessionStorage.getItem('feedbackClicked') === 'true';

  // Track login
  useEffect(() => {
    if (session && !hasLoggedInRef.current) {
      hasLoggedInRef.current = true;
    }
  }, [session]);

  // Show modal after 30 seconds if logged in and not shown or clicked (reduced from 5 minutes)
  useEffect(() => {
    if (hasLoggedInRef.current && !hasShownModal && !hasClickedFeedback) {
      const timer = setTimeout(() => {
        setFeedbackModalOpen(true);
        sessionStorage.setItem('feedbackModalShown', 'true');
      }, 30 * 1000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [hasLoggedInRef.current, hasShownModal, hasClickedFeedback]);

  // Handle logout detection by checking session change
  useEffect(() => {
    const prevSession = hasLoggedInRef.current;
    if (prevSession && !session && !hasShownModal && !hasClickedFeedback) {
      // User logged out
      setFeedbackModalOpen(true);
      sessionStorage.setItem('feedbackModalShown', 'true');
    }
  }, [session, hasShownModal, hasClickedFeedback]);

  const handleGiveFeedback = useCallback(() => {
    sessionStorage.setItem('feedbackClicked', 'true');
    setFeedbackModalOpen(false);
    window.open(FEEDBACK_FORM_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleLater = useCallback(() => {
    setFeedbackModalOpen(false);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Suspense fallback={null}>
            <Toaster />
            <Sonner />
          </Suspense>

          <BrowserRouter>
            <Suspense fallback={<LoadingSkeleton />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<Search />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<ProfileSettings />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/onboarding" element={<Onboarding />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>

          <FeedbackModal
            open={feedbackModalOpen}
            onOpenChange={setFeedbackModalOpen}
            onGiveFeedback={handleGiveFeedback}
            onLater={handleLater}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
