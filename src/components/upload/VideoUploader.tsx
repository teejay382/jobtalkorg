import { useState, useEffect } from 'react';
import { Upload as UploadIcon, Video, Camera, X, Image, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateBestVideoThumbnail, createThumbnailFile } from '@/utils/thumbnailGenerator';
import { useUploadContext } from '@/contexts/UploadContext';

interface VideoUploaderProps {
  onSuccess: () => void;
}

export const VideoUploader = ({ onSuccess }: VideoUploaderProps) => {
  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [uploadStage, setUploadStage] = useState<'preparing' | 'video' | 'thumbnail' | 'database' | 'complete'>('preparing');
  const [backgroundMode, setBackgroundMode] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadAborted, setUploadAborted] = useState(false);
  const [currentXHR, setCurrentXHR] = useState<XMLHttpRequest | null>(null);
  const [isFirstPost, setIsFirstPost] = useState(false);
  const [templateApplied, setTemplateApplied] = useState(false);

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { addUpload, updateUpload, removeUpload } = useUploadContext();

  // Check if this is user's first post
  useEffect(() => {
    const checkFirstPost = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
        if (error) throw error;
        setIsFirstPost(!data || data.length === 0);
      } catch (error) {
        console.error('Error checking first post:', error);
      }
    };
    
    checkFirstPost();
  }, [user]);

  // Cleanup blob URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleVideoFileChange = async (file: File) => {
    // Validate file before processing
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    const validExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isValidType = validVideoTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid video file (MP4, WebM, OGG, MOV, or AVI).",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a video smaller than 100MB.",
        variant: "destructive",
      });
      return;
    }

    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    
    // Apply template for first post
    if (isFirstPost && !templateApplied && profile) {
      const userSkill = profile.skills?.[0] || profile.service_categories?.[0] || 'my skill';
      const templateDescription = `Hi, I'm a ${userSkill}. I help people with ${userSkill.toLowerCase()} services.`;
      setDescription(templateDescription);
      setTemplateApplied(true);
    }
    
    setStep(2);

    // Generate thumbnail
    try {
      setGeneratingThumbnail(true);
      const thumbnailBlob = await generateBestVideoThumbnail(file);
      const thumbnailFile = createThumbnailFile(thumbnailBlob, file.name);
      setThumbnailFile(thumbnailFile);
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      toast({
        title: "Thumbnail Generation Failed",
        description: "Video uploaded but thumbnail could not be generated. You can still proceed.",
        variant: "destructive",
      });
    } finally {
      setGeneratingThumbnail(false);
    }
  };


  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const uploadVideoToStorage = async (file: File, uploadId: string): Promise<string> => {
    // Validate file type
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    const validExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isValidType = validVideoTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      throw new Error('Invalid video file type. Please upload MP4, WebM, OGG, MOV, or AVI files.');
    }

    // Force MP4 extension for consistency
    const fileName = `${user?.id}/${Date.now()}.mp4`;

    try {
      // Use standard upload with progress tracking via XMLHttpRequest
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .createSignedUploadUrl(fileName);

      if (uploadError) {
        console.error('Failed to create upload URL:', uploadError);
        throw uploadError;
      }

      console.log('[Upload] Starting upload for:', fileName);

      // Upload with XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        setCurrentXHR(xhr);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && !uploadAborted) {
            // Map video upload progress to overall progress (5-70%)
            const videoProgress = (event.loaded / event.total) * 65 + 5;
            setUploadProgress(videoProgress);
            updateUpload(uploadId, { progress: videoProgress });
          }
        };

        xhr.onload = async () => {
          if (xhr.status === 200 && !uploadAborted) {
            console.log('[Upload] Upload completed, verifying file...');
            
            // Wait for file to be available
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verify the file exists before returning URL
            const { data: fileList, error: listError } = await supabase.storage
              .from('videos')
              .list(user?.id || '', {
                search: fileName.split('/')[1]
              });

            console.log('[Upload] File verification:', { fileList, listError, fileName });

            if (listError || !fileList || fileList.length === 0) {
              console.error('[Upload] File not found after upload. Checking with direct download...');
              
              // Try to download to verify it exists
              const { data: downloadData, error: downloadError } = await supabase.storage
                .from('videos')
                .download(fileName);
              
              if (downloadError) {
                console.error('[Upload] File definitely not accessible:', downloadError);
                reject(new Error('Upload succeeded but file not accessible: ' + downloadError.message));
                return;
              }
              
              console.log('[Upload] File exists but list failed. Proceeding with URL generation.');
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('videos')
              .getPublicUrl(fileName);
            
            console.log('[Upload] Public URL generated:', publicUrl);
            
            // Test the URL is actually accessible
            try {
              const testResponse = await fetch(publicUrl, { method: 'HEAD' });
              console.log('[Upload] URL accessibility test:', {
                status: testResponse.status,
                ok: testResponse.ok,
                contentType: testResponse.headers.get('content-type')
              });
              
              if (!testResponse.ok) {
                console.error('[Upload] URL test failed:', testResponse.status, testResponse.statusText);
                reject(new Error(`URL not accessible: ${testResponse.status} ${testResponse.statusText}`));
                return;
              }
            } catch (testError) {
              console.error('[Upload] URL test error:', testError);
              reject(new Error('URL accessibility test failed: ' + testError));
              return;
            }
            
            setCurrentXHR(null);
            resolve(publicUrl);
          } else {
            console.error('[Upload] Upload failed with status:', xhr.status, xhr.statusText);
            console.error('[Upload] Response:', xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          console.error('[Upload] Network error during upload');
          reject(new Error('Network error during upload'));
        };

        xhr.onabort = () => {
          console.log('[Upload] Upload cancelled by user');
          setCurrentXHR(null);
          reject(new Error('Upload cancelled'));
        };

        // Upload the file
        xhr.open('PUT', uploadData.signedUrl);
        xhr.setRequestHeader('Content-Type', 'video/mp4');
        xhr.send(file);
      });
    } catch (error) {
      console.error('[Upload] Error in uploadVideoToStorage:', error);
      throw error;
    }
  };

  const uploadThumbnailToStorage = async (file: File): Promise<string> => {
    const fileExt = 'jpg';
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    const fileToUpload = videoFile;
    
    if (!user || !fileToUpload) {
      toast({
        title: "Error",
        description: "Please ensure all fields are filled",
        variant: "destructive",
      });
      return;
    }

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadStage('preparing');
    
    // Add to global upload context
    addUpload(uploadId, fileToUpload.name);

    try {
      // Stage 1: Upload video to storage (0-70%)
      setUploadStage('video');
      setUploadProgress(5);
      updateUpload(uploadId, { stage: 'video', progress: 5 });
      
      if (uploadAborted) throw new Error('Upload cancelled');
      
      const videoUrl = await uploadVideoToStorage(fileToUpload, uploadId);
      setUploadProgress(70);
      updateUpload(uploadId, { stage: 'video', progress: 70 });

      // Stage 2: Upload thumbnail if available (70-85%)
      setUploadStage('thumbnail');
      updateUpload(uploadId, { stage: 'thumbnail', progress: 70 });
      
      if (uploadAborted) throw new Error('Upload cancelled');
      
      let thumbnailUrl = null;
      if (thumbnailFile) {
        try {
          thumbnailUrl = await uploadThumbnailToStorage(thumbnailFile);
        } catch (error) {
          console.error('Failed to upload thumbnail:', error);
          // Continue without thumbnail
        }
      }
      setUploadProgress(85);
      updateUpload(uploadId, { stage: 'thumbnail', progress: 85 });

      // Stage 3: Save video data to database (85-95%)
      setUploadStage('database');
      updateUpload(uploadId, { stage: 'database', progress: 85 });
      
      if (uploadAborted) throw new Error('Upload cancelled');
      
      const { error } = await supabase
        .from('videos')
        .insert({
          title: title.trim(),
          description: description.trim(),
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          tags: skills,
          user_id: user.id,
        });

      if (error) {
        throw error;
      }
      setUploadProgress(95);
      updateUpload(uploadId, { stage: 'database', progress: 95 });

      // Stage 4: Complete (95-100%)
      setUploadStage('complete');
      setUploadProgress(100);
      updateUpload(uploadId, { stage: 'complete', progress: 100 });

      toast({
        title: "Success!",
        description: "Your video has been uploaded successfully",
      });

      // Allow user to continue or go back to feed
      setTimeout(() => {
        setUploadComplete(true);
        // Remove from context after completion
        setTimeout(() => removeUpload(uploadId), 5000);
        onSuccess();
      }, 1000);

    } catch (error) {
      console.error('Error uploading video:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      const isCancelled = errorMessage === 'Upload cancelled';
      
      if (!isCancelled) {
        updateUpload(uploadId, { 
          stage: 'error', 
          error: errorMessage
        });
        
        toast({
          title: "Upload Failed",
          description: "There was an error uploading your video. Please try again.",
          variant: "destructive",
        });
      }
      
      setUploading(false);
      setUploadStage('preparing');
      setUploadProgress(0);
      setUploadAborted(false);
      
      // Remove from context after showing error (unless cancelled)
      if (!isCancelled) {
        setTimeout(() => removeUpload(uploadId), 5000);
      } else {
        removeUpload(uploadId);
      }
    }
  };

  const cancelUpload = () => {
    if (currentXHR) {
      currentXHR.abort();
      setCurrentXHR(null);
    }
    setUploadAborted(true);
    setUploading(false);
    setUploadProgress(0);
    setUploadStage('preparing');

    // Clean up upload context
    if (videoFile) {
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      removeUpload(uploadId);
    }

    toast({
      title: "Upload Cancelled",
      description: "Video upload has been cancelled and no data was uploaded.",
      variant: "destructive",
    });
  };

  const enableBackgroundMode = () => {
    setBackgroundMode(true);
    toast({
      title: "Uploading in Background",
      description: "Your video is uploading. You can continue using the app.",
    });
    // Navigate away from upload page to show background functionality
    setTimeout(() => {
      window.history.back();
    }, 1000);
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{isFirstPost ? 'Show What You Can Do' : 'Upload Your Work'}</h1>
          <p className="text-muted-foreground">
            {isFirstPost 
              ? 'Upload a clip or photo that proves your skill — this is your portfolio'
              : 'Share your latest work to attract more clients'
            }
          </p>
        </div>

        {/* First Post Helper */}
        {isFirstPost && (
          <div className="glass-card-premium rounded-2xl p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💪</span>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-foreground">Your first upload is your portfolio</p>
                <ul className="text-muted-foreground space-y-1 text-xs leading-relaxed">
                  <li>• Show your best work, not just any video</li>
                  <li>• Clients hire based on what they see</li>
                  <li>• Keep it short and focused (30-60 seconds)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Upload area */}
        <div className="upload-area">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto">
              <UploadIcon className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-2">Upload Video</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a vertical video (9:16 ratio) up to 60 seconds
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById('video-upload')?.click()}
              >
                <Video className="w-4 h-4" />
                Gallery
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled
              >
                <Camera className="w-4 h-4" />
                Camera
              </Button>
            </div>
            
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleVideoFileChange(file);
                }
              }}
            />
          </div>
        </div>

        {/* Tips */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h4 className="font-semibold text-foreground mb-2">{isFirstPost ? 'First post tips:' : 'Tips for great content:'}</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {isFirstPost ? (
              <>
                <li>• Show a finished project or your best work</li>
                <li>• Use your top skill as the focus</li>
                <li>• Keep it clear and professional</li>
                <li>• Add good lighting if filming</li>
              </>
            ) : (
              <>
                <li>• Keep it under 60 seconds</li>
                <li>• Show your work or explain your skills</li>
                <li>• Use good lighting and clear audio</li>
                <li>• Be authentic and engaging</li>
              </>
            )}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Add Details</h1>
        <p className="text-muted-foreground">Tell us about your video</p>
      </div>


      {/* Upload Status */}
      {uploading && (
        <div className="bg-card rounded-xl p-4 border border-border animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {uploadStage === 'preparing' && 'Preparing upload...'}
                  {uploadStage === 'video' && 'Uploading video...'}
                  {uploadStage === 'thumbnail' && 'Processing thumbnail...'}
                  {uploadStage === 'database' && 'Saving to database...'}
                  {uploadStage === 'complete' && 'Upload complete!'}
                </span>
                <p className="text-xs text-muted-foreground">
                  {uploadStage === 'preparing' && 'Getting ready to upload'}
                  {uploadStage === 'video' && 'Uploading your video file'}
                  {uploadStage === 'thumbnail' && 'Generating and uploading thumbnail'}
                  {uploadStage === 'database' && 'Saving video information'}
                  {uploadStage === 'complete' && 'Your video is now live!'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {uploadStage !== 'complete' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelUpload}
                  className="text-xs border-destructive hover:bg-destructive/10 hover:border-destructive"
                >
                  Cancel
                </Button>
              )}
              {!backgroundMode && uploadStage !== 'complete' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enableBackgroundMode}
                  className="text-xs"
                >
                  Background
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{uploadProgress.toFixed(0)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>

          {uploadComplete && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Video uploaded successfully!
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your video is now live and visible to everyone.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Video preview */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl mb-3 max-w-48 mx-auto overflow-hidden">
          {videoPreviewUrl ? (
            <video
              src={videoPreviewUrl}
              className="w-full h-full object-cover rounded-xl"
              controls
              muted
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">{videoFile?.name}</p>
          {videoFile && (
            <p className="text-xs text-muted-foreground">
              Size: {(videoFile.size / 1024 / 1024).toFixed(1)}MB
            </p>
          )}
          
          {/* Thumbnail status */}
          {generatingThumbnail && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-muted-foreground">Generating thumbnail...</p>
            </div>
          )}
          {thumbnailFile && !generatingThumbnail && (
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-primary">
              <Image className="w-3 h-3" />
              <p>Thumbnail ready</p>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g., Full-Stack Developer Showcase"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="description">Description</Label>
            {isFirstPost && !templateApplied && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const userSkill = profile?.skills?.[0] || profile?.service_categories?.[0] || 'my skill';
                  const templateDescription = `Hi, I'm a ${userSkill}. I help people with ${userSkill.toLowerCase()} services.`;
                  setDescription(templateDescription);
                  setTemplateApplied(true);
                }}
                className="text-xs text-primary hover:text-primary/80"
              >
                Use template
              </Button>
            )}
          </div>
          <Textarea
            id="description"
            placeholder={isFirstPost 
              ? "e.g., Hi, I'm a graphic designer. I help people with logo and branding design."
              : "Describe your skills, experience, or job requirements..."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          {isFirstPost && (
            <p className="text-xs text-muted-foreground mt-1">
              💡 Keep it simple and focused on what you do
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="skills">Skills/Tags</Label>
          <div className="flex gap-2 mb-2">
            <Input
              id="skills"
              placeholder="Add a skill..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            />
            <Button onClick={handleAddSkill} size="sm">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="skill-tag flex items-center gap-1"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(1)}
          disabled={uploading}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 btn-hero"
          disabled={!title.trim() || !description.trim() || uploading || !videoFile}
        >
          {uploading ? `Uploading ${uploadProgress.toFixed(0)}%` : 'Publish'}
        </Button>
      </div>

    </div>
  );
};