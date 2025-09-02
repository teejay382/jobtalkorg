import { useState } from 'react';

interface VideoCompressorProps {
  file: File;
  onCompressed: (compressedFile: File) => void;
  onProgress: (progress: number) => void;
}

export const VideoCompressor = ({ file, onCompressed, onProgress }: VideoCompressorProps) => {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressVideo = async () => {
    setIsCompressing(true);
    
    try {
      // Create video element to get dimensions
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      video.src = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      
      // Set canvas dimensions (compress to max 720p for mobile optimization)
      const maxWidth = 720;
      const maxHeight = 1280;
      
      let { videoWidth, videoHeight } = video;
      
      if (videoWidth > maxWidth || videoHeight > maxHeight) {
        const aspectRatio = videoWidth / videoHeight;
        
        if (videoWidth > videoHeight) {
          videoWidth = maxWidth;
          videoHeight = Math.round(maxWidth / aspectRatio);
        } else {
          videoHeight = maxHeight;
          videoWidth = Math.round(maxHeight * aspectRatio);
        }
      }
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Create MediaRecorder for compression
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 1000000 // 1 Mbps for good compression
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        const compressedFile = new File([compressedBlob], 
          file.name.replace(/\.[^/.]+$/, '.webm'), 
          { type: 'video/webm' }
        );
        
        onCompressed(compressedFile);
        setIsCompressing(false);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Play and draw video frames
      let currentTime = 0;
      const duration = video.duration;
      
      const drawFrame = () => {
        if (currentTime >= duration) {
          mediaRecorder.stop();
          return;
        }
        
        video.currentTime = currentTime;
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        // Update progress
        const progress = (currentTime / duration) * 100;
        onProgress(progress);
        
        currentTime += 1/30; // Next frame at 30 FPS
        setTimeout(drawFrame, 33); // ~30 FPS
      };
      
      video.onseeked = () => {
        drawFrame();
      };
      
    } catch (error) {
      console.error('Compression failed:', error);
      // If compression fails, use original file
      onCompressed(file);
      setIsCompressing(false);
    }
  };
  
  // Auto-start compression when component mounts
  if (!isCompressing && file) {
    compressVideo();
  }
  
  return null; // This is a utility component, no UI
};