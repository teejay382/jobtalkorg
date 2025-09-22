import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGiveFeedback: () => void;
  onLater: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  onOpenChange,
  onGiveFeedback,
  onLater,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>We'd love your feedback!</DialogTitle>
          <DialogDescription>
            Help us improve JobTolk by answering a quick 5-minute questionnaire.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onLater}>
            Later
          </Button>
          <Button onClick={onGiveFeedback}>
            Give Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
