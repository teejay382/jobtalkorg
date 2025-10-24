import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, Mail, Phone, Briefcase, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

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
    email?: string;
  };
}

export const HireModal = ({ isOpen, onClose, freelancer }: HireModalProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const displayName = freelancer.full_name || freelancer.username || 'Freelancer';

  const handleSendMessage = () => {
    onClose();
    navigate(`/chat?user=${freelancer.id}`);
  };

  const handleEmailContact = () => {
    if (freelancer.email) {
      window.location.href = `mailto:${freelancer.email}?subject=Job Opportunity on JobTolk`;
    }
  };

  const handleSaveForLater = async () => {
    setLoading(true);
    try {
      // TODO: Implement save/shortlist functionality
      toast({
        title: "Saved!",
        description: `${displayName} has been added to your shortlist`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save freelancer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

          {/* Action Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Get in touch</h4>
            
            <div className="grid gap-3">
              {/* Send Message */}
              <Button
                onClick={handleSendMessage}
                className="w-full h-12 rounded-xl font-semibold shadow-medium bg-gradient-to-r from-primary to-accent"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send Message
              </Button>

              {/* Email (if available) */}
              {freelancer.email && (
                <Button
                  onClick={handleEmailContact}
                  variant="outline"
                  className="w-full h-12 rounded-xl font-semibold"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Send Email
                </Button>
              )}

              {/* Save for Later */}
              <Button
                onClick={handleSaveForLater}
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold"
                disabled={loading}
              >
                <Star className="w-5 h-5 mr-2" />
                {loading ? 'Saving...' : 'Save to Shortlist'}
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Hiring on JobTolk</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect directly with freelancers and discuss your project requirements. 
                  All communications are secure and private.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
