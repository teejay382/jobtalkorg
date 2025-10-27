import React, { useEffect, useMemo, lazy, Suspense, useState, useCallback, useRef } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from "./components/ErrorBoundary";
import { useNotifications } from '@/hooks/useNotifications';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { UploadProvider } from '@/contexts/UploadContext';
import { BackgroundUploadNotification } from '@/components/ui/BackgroundUploadNotification';
import { runAllDiagnostics } from '@/utils/debugSupabase';

// Lazy-load pages (code splitting)
const Welcome = lazy(() => import('./pages/Welcome'));
const Index = lazy(() => import('./pages/Index'));
const Search = lazy(() => import('./pages/Search'));
const Upload = lazy(() => import('./pages/Upload'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const Settings = lazy(() => import('./pages/Settings'));
const Auth = lazy(() => import('./pages/Auth'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const NotFound = lazy(() => import('./pages/NotFound'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Callback = lazy(() => import('./pages/auth/callback'));
const OAuthTest = lazy(() => import('./pages/OAuthTest'));
const LocalJobs = lazy(() => import('./pages/LocalJobs'));

// Lazy-load heavy UI pieces (to reduce initial bundle)
const Toaster = lazy(() => import('@/components/ui/toaster').then(mod => ({ default: mod.Toaster })));

const LoadingSkeleton = () => (
  <div aria-busy="true" className="w-full h-full flex items-center justify-center p-6">Loading…</div>
);

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdsbSoo4B3Vg1k7dW3KVY1tyVYnqzGKBPE518k9Kn6ue7ni4Q/viewform?usp=dialog';

const RouteTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // On mount, check if there's a saved path and redirect if different from current
    const savedPath = localStorage.getItem('lastVisitedPath');
    if (savedPath && savedPath !== location.pathname && location.pathname === '/') {
      navigate(savedPath);
    }
  }, []);

  useEffect(() => {
    // Save current path to localStorage on route change
    localStorage.setItem('lastVisitedPath', location.pathname);
  }, [location.pathname]);

  return null;
};

const MainApp = () => {
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

  // DEBUG: Log modal open state changes
  useEffect(() => {
    if (import.meta.env.DEV) console.log('Feedback modal open state:', feedbackModalOpen);
  }, [feedbackModalOpen]);

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
    <>
      <BrowserRouter>
        <RouteTracker />
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/" element={<Index />} />
            <Route path="/feed" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/local-jobs" element={<LocalJobs />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile-settings" element={<ProfileSettings />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth/callback" element={<Callback />} />
            <Route path="/oauth-test" element={<OAuthTest />} />
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
    </>
  );
};

const App = () => {
  if (import.meta.env.DEV) console.log("App component is loading...");

  // create a memoized QueryClient so it's stable across renders
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection (was cacheTime)
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  }), []);

  // Run diagnostics in development mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🚀 Running initial Supabase diagnostics...');
      runAllDiagnostics().then(results => {
        if (!results.allPassed) {
          console.warn('⚠️ Some diagnostics failed. Check the logs above for details.');
        }
      });
    }
  }, []);

  // Show loading while auth is initializing
  const { loading } = useAuth();
  
  if (import.meta.env.DEV) console.log('App loading state:', loading);
  
  if (loading) {
    if (import.meta.env.DEV) console.log('App showing loading skeleton');
    return <LoadingSkeleton />;
  }

  // Let routing handle auth flow naturally (Index page shows welcome screen for non-authenticated)
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <UploadProvider>
            <TooltipProvider>
              <Suspense fallback={null}>
                <Toaster />
              </Suspense>
              <MainApp />
              <BackgroundUploadNotification />
            </TooltipProvider>
          </UploadProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
