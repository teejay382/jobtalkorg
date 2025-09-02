import { useState } from 'react';
import { Upload as UploadIcon, Video, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { VideoCompressor } from './VideoCompressor';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoUploaderProps {
  onSuccess: () => void;
}

export const VideoUploader = ({ onSuccess }: VideoUploaderProps) => {
  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleVideoFileChange = (file: File) => {
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setIsCompressing(true);
    setStep(2);
  };

  const handleCompressed = (compressed: File) => {
    setCompressedFile(compressed);
    setIsCompressing(false);
    toast({
      title: "Video Compressed",
      description: `Reduced from ${(videoFile!.size / 1024 / 1024).toFixed(1)}MB to ${(compressed.size / 1024 / 1024).toFixed(1)}MB`,
    });
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

  const uploadVideoToStorage = async (file: File): Promise<string> => {
    const fileExt = 'webm'; // Always webm after compression
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    // Create a custom upload with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };
      
      xhr.onload = async () => {
        if (xhr.status === 200) {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(fileName);
          resolve(publicUrl);
        } else {
          reject(new Error('Upload failed'));
        }
      };
      
      xhr.onerror = () => reject(new Error('Upload failed'));
      
      // Use supabase storage upload
      supabase.storage
        .from('videos')
        .upload(fileName, file)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('videos')
              .getPublicUrl(fileName);
            resolve(publicUrl);
          }
        });
    });
  };

  const handleSubmit = async () => {
    const fileToUpload = compressedFile || videoFile;
    
    if (!user || !fileToUpload) {
      toast({
        title: "Error",
        description: "Please ensure all fields are filled",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload video to storage with progress
      const videoUrl = await uploadVideoToStorage(fileToUpload);

      // Save video data to database
      const { error } = await supabase
        .from('videos')
        .insert({
          title: title.trim(),
          description: description.trim(),
          video_url: videoUrl,
          tags: skills,
          user_id: user.id,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Your video has been uploaded successfully",
      });

      onSuccess();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Share Your Story</h1>
          <p className="text-muted-foreground">Upload a video to showcase your skills or job opening</p>
        </div>

        {/* Upload area */}
        <div className="upload-area">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto">
              <UploadIcon className="w-8 h-8 text-white" />
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
          <h4 className="font-semibold text-foreground mb-2">Tips for great videos:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Keep it under 60 seconds</li>
            <li>• Show your work or explain your skills</li>
            <li>• Use good lighting and clear audio</li>
            <li>• Be authentic and engaging</li>
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

      {/* Compression Progress */}
      {isCompressing && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Compressing video...</span>
          </div>
          <Progress value={compressionProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {compressionProgress.toFixed(0)}% complete
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Uploading video...</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {uploadProgress.toFixed(0)}% uploaded
          </p>
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
          {videoFile && compressedFile && (
            <p className="text-xs text-green-600">
              Compressed: {(videoFile.size / 1024 / 1024).toFixed(1)}MB → {(compressedFile.size / 1024 / 1024).toFixed(1)}MB
            </p>
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
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your skills, experience, or job requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
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
          disabled={uploading || isCompressing}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 btn-hero"
          disabled={!title.trim() || !description.trim() || uploading || isCompressing || !compressedFile}
        >
          {uploading ? `Uploading ${uploadProgress.toFixed(0)}%` : 'Publish'}
        </Button>
      </div>

      {/* Video Compressor */}
      {videoFile && isCompressing && (
        <VideoCompressor
          file={videoFile}
          onCompressed={handleCompressed}
          onProgress={setCompressionProgress}
        />
      )}
    </div>
  );
};