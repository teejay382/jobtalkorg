import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

/**
 * Check if storage buckets exist
 */
export async function checkStorageBuckets(): Promise<DiagnosticResult> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return {
        success: false,
        message: 'Failed to list storage buckets',
        error: error
      };
    }

    const requiredBuckets = ['videos', 'thumbnails', 'avatars'];
    const existingBuckets = data?.map(b => b.name) || [];
    const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));

    if (missingBuckets.length > 0) {
      return {
        success: false,
        message: `Missing storage buckets: ${missingBuckets.join(', ')}`,
        data: { existingBuckets, missingBuckets }
      };
    }

    return {
      success: true,
      message: 'All storage buckets exist',
      data: { buckets: existingBuckets }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error checking storage buckets',
      error: error
    };
  }
}

/**
 * Check if videos table has data
 */
export async function checkVideosTable(): Promise<DiagnosticResult> {
  try {
    const { count, error } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        message: 'Failed to query videos table',
        error: error
      };
    }

    return {
      success: true,
      message: `Videos table has ${count || 0} videos`,
      data: { count }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error checking videos table',
      error: error
    };
  }
}

/**
 * Check video URLs accessibility
 */
export async function checkVideoURLs(): Promise<DiagnosticResult> {
  try {
    const { data: videos, error } = await supabase
      .from('videos')
      .select('id, video_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return {
        success: false,
        message: 'Failed to fetch video URLs',
        error: error
      };
    }

    if (!videos || videos.length === 0) {
      return {
        success: true,
        message: 'No videos to check',
        data: { videos: [] }
      };
    }

    // Test each URL
    const urlTests = await Promise.all(
      videos.map(async (video) => {
        try {
          const response = await fetch(video.video_url, { method: 'HEAD' });
          return {
            id: video.id,
            url: video.video_url,
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type')
          };
        } catch (error) {
          return {
            id: video.id,
            url: video.video_url,
            status: 0,
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const failedVideos = urlTests.filter(test => !test.ok);

    return {
      success: failedVideos.length === 0,
      message: failedVideos.length === 0 
        ? 'All video URLs are accessible' 
        : `${failedVideos.length} out of ${videos.length} videos have inaccessible URLs`,
      data: { 
        total: videos.length,
        accessible: videos.length - failedVideos.length,
        failed: failedVideos.length,
        tests: urlTests
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error checking video URLs',
      error: error
    };
  }
}

/**
 * Check if profiles table has data
 */
export async function checkProfilesTable(): Promise<DiagnosticResult> {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        message: 'Failed to query profiles table',
        error: error
      };
    }

    return {
      success: true,
      message: `Profiles table has ${count || 0} profiles`,
      data: { count }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error checking profiles table',
      error: error
    };
  }
}

/**
 * Check authentication status
 */
export async function checkAuth(): Promise<DiagnosticResult> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        message: 'Failed to get auth session',
        error: error
      };
    }

    if (!session) {
      return {
        success: false,
        message: 'No active session - user not logged in',
        data: { authenticated: false }
      };
    }

    return {
      success: true,
      message: 'User is authenticated',
      data: { 
        authenticated: true,
        userId: session.user.id,
        email: session.user.email
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error checking authentication',
      error: error
    };
  }
}

/**
 * Run all diagnostics
 */
export async function runAllDiagnostics() {
  console.log('🔍 Running Supabase Diagnostics...\n');

  const auth = await checkAuth();
  console.log('📝 Auth:', auth.success ? '✅' : '❌', auth.message, auth.data || auth.error);

  const buckets = await checkStorageBuckets();
  console.log('🪣 Storage:', buckets.success ? '✅' : '❌', buckets.message, buckets.data || buckets.error);

  const videos = await checkVideosTable();
  console.log('🎥 Videos:', videos.success ? '✅' : '❌', videos.message, videos.data || videos.error);

  const videoURLs = await checkVideoURLs();
  console.log('🔗 Video URLs:', videoURLs.success ? '✅' : '❌', videoURLs.message);
  if (videoURLs.data && videoURLs.data.tests) {
    console.log('   URL Test Results:', videoURLs.data.tests);
  }

  const profiles = await checkProfilesTable();
  console.log('👤 Profiles:', profiles.success ? '✅' : '❌', profiles.message, profiles.data || profiles.error);

  console.log('\n--- Diagnostic Summary ---');
  const allPassed = auth.success && buckets.success && videos.success && videoURLs.success && profiles.success;
  
  if (!allPassed) {
    console.log('⚠️ Issues detected:');
    if (!auth.success) console.log('  - Authentication issue');
    if (!buckets.success) console.log('  - Storage bucket issue');
    if (!videos.success) console.log('  - Videos table issue');
    if (!videoURLs.success) console.log('  - Video URL accessibility issue (400 errors)');
    if (!profiles.success) console.log('  - Profiles table issue');
  } else {
    console.log('✅ All checks passed!');
  }

  return {
    auth,
    buckets,
    videos,
    videoURLs,
    profiles,
    allPassed
  };
}

// Make it available globally in development
if (typeof window !== 'undefined') {
  (window as any).debugSupabase = runAllDiagnostics;
}
