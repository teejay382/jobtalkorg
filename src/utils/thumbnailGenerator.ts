/**
 * Utility functions for generating video thumbnails
 */

/**
 * Generates a thumbnail from a video file by extracting a frame at a specific time
 * @param videoFile - The video file to generate thumbnail from
 * @param timeInSeconds - Time in seconds to extract the frame (default: 1 second)
 * @returns Promise<Blob> - The thumbnail image as a blob
 */
export const generateVideoThumbnail = (
  videoFile: File,
  timeInSeconds: number = 1
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      // Set canvas dimensions to match video aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight;
      const maxWidth = 720; // Max width for thumbnail
      const maxHeight = 1280; // Max height for thumbnail (9:16 aspect ratio)
      
      let thumbnailWidth = maxWidth;
      let thumbnailHeight = maxWidth / aspectRatio;
      
      // If height exceeds max height, scale down
      if (thumbnailHeight > maxHeight) {
        thumbnailHeight = maxHeight;
        thumbnailWidth = maxHeight * aspectRatio;
      }
      
      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;
      
      // Seek to the specified time
      video.currentTime = Math.min(timeInSeconds, video.duration - 0.1);
    });

    video.addEventListener('seeked', () => {
      try {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail blob'));
            }
          },
          'image/jpeg',
          0.8 // Quality (0-1)
        );
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', (e) => {
      reject(new Error(`Video loading error: ${e}`));
    });

    // Load the video file
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
};

/**
 * Generates multiple thumbnails at different time points and returns the best one
 * @param videoFile - The video file to generate thumbnails from
 * @param timePoints - Array of time points in seconds to try (default: [0.5, 1, 2, 3])
 * @returns Promise<Blob> - The best thumbnail image as a blob
 */
export const generateBestVideoThumbnail = async (
  videoFile: File,
  timePoints: number[] = [0.5, 1, 2, 3]
): Promise<Blob> => {
  try {
    // For now, just use the first time point
    // In the future, we could implement logic to choose the "best" thumbnail
    return await generateVideoThumbnail(videoFile, timePoints[0]);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
};

/**
 * Creates a File object from a Blob with proper naming
 * @param blob - The blob to convert
 * @param originalFileName - The original video file name
 * @returns File - The thumbnail file
 */
export const createThumbnailFile = (blob: Blob, originalFileName: string): File => {
  const timestamp = Date.now();
  const thumbnailName = `thumbnail_${timestamp}.jpg`;
  return new File([blob], thumbnailName, { type: 'image/jpeg' });
};
