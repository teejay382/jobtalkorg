import React, { useEffect, useMemo, lazy, Suspense } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from "./components/ErrorBoundary";
import { useNotifications } from '@/hooks/useNotifications';

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
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
