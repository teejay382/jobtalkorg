/**
 * Utility functions for video validation and processing
 */

/**
 * Validates if a file is a valid MP4 video by checking its content
 * @param file - The video file to validate
 * @returns Promise<boolean> - True if valid MP4, false otherwise
 */
export const validateMP4Content = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check file signature (magic bytes) for MP4
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve(false);
        return;
      }

      const uint8Array = new Uint8Array(buffer.slice(0, 12));
      const header = Array.from(uint8Array, byte => byte.toString(16).padStart(2, '0')).join('');

      // MP4 files start with ftyp box containing specific signatures
      const mp4Signatures = [
        '667479706d7034', // ftypmp4
        '667479704d534e', // ftypMSNV
        '6674797069736f', // ftypiso
        '667479706d7034', // ftypmp4
        '667479704d3441', // ftypM4A
        '667479704d3442', // ftypM4B
        '667479704d3456', // ftypM4V
        '667479706d703431', // ftypmp41
        '667479706d703432', // ftypmp42
      ];

      const isValidMP4 = mp4Signatures.some(sig => header.includes(sig));
      resolve(isValidMP4);
    };

    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
};

/**
 * Checks if the video file has a compatible codec for web playback
 * @param file - The video file to check
 * @returns Promise<{isCompatible: boolean, codec?: string}> - Compatibility info
 */
export const checkVideoCodec = async (file: File): Promise<{isCompatible: boolean, codec?: string}> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);

      // Check if browser can play this video
      const canPlay = video.canPlayType && (
        video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '' ||
        video.canPlayType('video/mp4; codecs="avc1.64001F"') !== '' ||
        video.canPlayType('video/mp4') !== ''
      );

      resolve({
        isCompatible: canPlay,
        codec: 'unknown'
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ isCompatible: false });
    };

    video.src = url;
  });
};

/**
 * Converts video to MP4 format if needed (basic implementation)
 * Note: This is a placeholder - full conversion would require server-side processing
 * @param file - The video file to convert
 * @returns Promise<File> - Converted MP4 file
 */
export const convertToMP4 = async (file: File): Promise<File> => {
  // For now, just return the original file
  // Full implementation would use FFmpeg.wasm or server-side conversion
  console.warn('Video conversion not implemented - returning original file');
  return file;
};

/**
 * Gets video metadata without loading the full file
 * @param file - The video file
 * @returns Promise<{duration?: number, width?: number, height?: number}>
 */
export const getVideoMetadata = async (file: File): Promise<{duration?: number, width?: number, height?: number}> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };

    video.src = url;
  });
};
