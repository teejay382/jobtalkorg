import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { findMatchesForUser, trackInteraction, JobMatch } from '@/lib/matchingService';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  TrendingUp,
  Filter,
  Star,
  Zap
} from 'lucide-react';

const JobMatches = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'remote' | 'local'>('all');

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user]);

  const loadMatches = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await findMatchesForUser(user.id, 100);

      if (error) throw error;

      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job matches',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = async (job: JobMatch) => {
    if (user) {
      await trackInteraction(user.id, 'job', job.job_id, 'click', 'matches');
    }
    navigate(`/job/${job.job_id}`);
  };

  const getMatchBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Potential Match';
  };

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case 'urgent':
        return 'text-red-500 bg-red-50 dark:bg-red-950';
      case 'high':
        return 'text-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default:
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950';
    }
  };

  const formatPayRate = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Negotiable';
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return 'Negotiable';
  };

  const filteredMatches = matches.filter(match => {
    if (filterType === 'all') return true;
    return match.job_type === filterType;
  });

  if (!user || profile?.role !== 'freelancer') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <h2 className="text-2xl font-bold text-center">Access Restricted</h2>
            <p className="text-muted-foreground text-center mt-2">
              Job matches are only available for freelancers
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="pt-20 px-4 max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                Job Matches
              </h1>
              <p className="text-muted-foreground mt-1">
                Personalized job recommendations based on your profile
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All Jobs
            </Button>
            <Button
              variant={filterType === 'remote' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('remote')}
            >
              Remote
            </Button>
            <Button
              variant={filterType === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('local')}
            >
              Local
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Matches */}
        {!loading && filteredMatches.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Matches Found</h3>
              <p className="text-muted-foreground mb-4">
                {filterType === 'all'
                  ? "We couldn't find any matching jobs at the moment"
                  : `No ${filterType} jobs match your profile right now`}
              </p>
              <Button onClick={() => navigate('/search')}>
                Browse All Jobs
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Job Matches */}
        {!loading && filteredMatches.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {filteredMatches.length} matching job{filteredMatches.length !== 1 ? 's' : ''}
            </p>

            {filteredMatches.map((match) => (
              <Card
                key={match.job_id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleJobClick(match)}
              >
                <CardContent className="p-6">
                  {/* Match Score Badge */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{match.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{match.employer_name}</span>
                        <span>•</span>
                        <span className="capitalize">{match.job_type}</span>
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${getMatchBadgeColor(match.total_score)} text-white`}>
                        <Star className="h-3 w-3 mr-1" />
                        {Math.round(match.total_score)}% Match
                      </Badge>
                      {match.urgency_level && match.urgency_level !== 'low' && (
                        <Badge variant="outline" className={getUrgencyColor(match.urgency_level)}>
                          <Zap className="h-3 w-3 mr-1" />
                          {match.urgency_level}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {match.description}
                  </p>

                  {/* Skills Match */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {match.required_skills.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {match.required_skills.length > 5 && (
                        <Badge variant="outline">
                          +{match.required_skills.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Match Details */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1">Skills</span>
                      <span className="font-medium flex items-center gap-1">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${match.skill_score}%` }}
                          />
                        </div>
                        {Math.round(match.skill_score)}%
                      </span>
                    </div>
                    
                    {match.job_type !== 'remote' && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground mb-1">Location</span>
                        <span className="font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {Math.round(match.location_score)}%
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1">Pay Rate</span>
                      <span className="font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatPayRate(match.pay_rate_min, match.pay_rate_max)}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {match.location_city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.location_city}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(match.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <Button size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleJobClick(match);
                    }}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default JobMatches;
