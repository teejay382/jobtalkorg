import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { TrendingUp, Construction } from 'lucide-react';

/**
 * Job Matches page - Temporarily disabled pending advanced matching implementation
 * This feature requires additional database tables and functions
 */
const JobMatches = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="pt-20 px-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Job Matches
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered job recommendations
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-4 py-8">
              <Construction className="h-20 w-20 text-muted-foreground" />
              <h2 className="text-2xl font-bold text-center">Coming Soon</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Advanced job matching is currently being developed. This feature will use AI to match you with the best job opportunities based on your skills and preferences.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate('/search')} className="w-full" size="lg">
              Browse All Jobs
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default JobMatches;
