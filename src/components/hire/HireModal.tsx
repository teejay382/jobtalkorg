/**
 * HireModal - Simplified to only handle in-app chat
 * This component is kept for backward compatibility but is no longer used
 * in the main flow. All Hire buttons now directly open chat conversations.
 * 
 * @deprecated This modal is deprecated. Use direct chat navigation instead.
 */
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface HireModalProps {
  isOpen: boolean;
  onClose: () => void;
  freelancer: {
    id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
    skills?: string[];
    location?: string;
  };
}

export const HireModal = ({ isOpen, onClose, freelancer }: HireModalProps) => {
  const navigate = useNavigate();

  const displayName = freelancer.full_name || freelancer.username || 'Freelancer';

  const handleSendMessage = () => {
    onClose();
    navigate(`/chat?user=${freelancer.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg glass-card-premium">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Hire {displayName}</DialogTitle>
          <DialogDescription>
            Connect with this freelancer and discuss your project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Profile Section */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 ring-2 ring-primary/30">
              <AvatarImage src={freelancer.avatar_url} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold">{displayName}</h3>
              {freelancer.username && (
                <p className="text-sm text-muted-foreground">@{freelancer.username}</p>
              )}
              {freelancer.location && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <span>📍</span> {freelancer.location}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {freelancer.bio && (
            <div>
              <p className="text-sm text-foreground leading-relaxed">{freelancer.bio}</p>
            </div>
          )}

          {/* Skills */}
          {freelancer.skills && freelancer.skills.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {freelancer.skills.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="px-3 py-1 rounded-full"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Button - Only In-App Chat */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Get in touch</h4>
            
            <Button
              onClick={handleSendMessage}
              className="w-full h-12 rounded-xl font-semibold shadow-medium bg-gradient-to-r from-primary to-accent"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Conversation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
