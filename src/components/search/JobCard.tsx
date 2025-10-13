import { useState } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Job } from '@/hooks/useSearch';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleMessage = () => {
    navigate(`/chat?user=${job.employer_id}`);
  };

  const formatBudget = () => {
    if (job.budget_min && job.budget_max) {
      return `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`;
    } else if (job.budget_min) {
      return `From $${job.budget_min.toLocaleString()}`;
    } else if (job.budget_max) {
      return `Up to $${job.budget_max.toLocaleString()}`;
    }
    return 'Budget TBD';
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft border border-border hover:shadow-medium transition-all duration-300 hover:translate-y-[-2px]">
      {/* Header with employer info */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-12 h-12">
          <AvatarImage 
            src={job.employer?.avatar_url} 
            onError={() => setImageError(true)}
          />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <Briefcase className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            {job.employer?.company_name || job.employer?.username || 'Company'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(job.created_at))} ago
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleMessage}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Message
        </Button>
      </div>

      {/* Job details */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
          {job.title}
        </h2>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
          {job.description}
        </p>
        
        {/* Job meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium text-success">{formatBudget()}</span>
          </div>
          
          {job.deadline && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Due {formatDistanceToNow(new Date(job.deadline))}</span>
            </div>
          )}
        </div>
      </div>

      {/* Job type and category */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          job.job_type === 'remote' 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : job.job_type === 'local'
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
        }`}>
          {job.job_type?.charAt(0).toUpperCase() + job.job_type?.slice(1)}
        </span>
        
        {job.category && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            {job.category}
          </span>
        )}
      </div>

      {/* Requirements */}
      {job.requirements && job.requirements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.requirements.slice(0, 3).map((requirement, index) => (
            <span 
              key={index}
              className="skill-tag text-xs"
            >
              {requirement}
            </span>
          ))}
          {job.requirements.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{job.requirements.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};