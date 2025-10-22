import React from 'react';
import { X, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUploadContext } from '@/contexts/UploadContext';

export const BackgroundUploadNotification: React.FC = () => {
  const { activeUploads, removeUpload, clearCompletedUploads } = useUploadContext();

  if (activeUploads.length === 0) return null;

  const completedUploads = activeUploads.filter(upload => 
    upload.stage === 'complete' || upload.stage === 'error'
  );
  const inProgressUploads = activeUploads.filter(upload => 
    upload.stage !== 'complete' && upload.stage !== 'error'
  );

  const formatStage = (stage: string) => {
    switch (stage) {
      case 'preparing': return 'Preparing...';
      case 'video': return 'Uploading video...';
      case 'thumbnail': return 'Processing thumbnail...';
      case 'database': return 'Saving data...';
      case 'complete': return 'Complete!';
      case 'error': return 'Failed';
      default: return stage;
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* In Progress Uploads */}
      {inProgressUploads.map((upload) => (
        <div
          key={upload.id}
          className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg animate-slide-in-right"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground truncate">
                {upload.fileName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeUpload(upload.id)}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatStage(upload.stage)}</span>
              <span>{upload.progress.toFixed(0)}%</span>
            </div>
            <Progress value={upload.progress} className="h-1" />
          </div>
        </div>
      ))}

      {/* Completed Uploads */}
      {completedUploads.map((upload) => (
        <div
          key={upload.id}
          className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg animate-slide-in-right"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStageIcon(upload.stage)}
              <span className="text-sm font-medium text-foreground truncate">
                {upload.fileName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeUpload(upload.id)}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {upload.stage === 'complete' ? (
              <span className="text-primary">
                Upload completed successfully!
              </span>
            ) : (
              <span className="text-destructive">
                {upload.error || 'Upload failed'}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Clear All Button */}
      {completedUploads.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompletedUploads}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear completed
          </Button>
        </div>
      )}
    </div>
  );
};
