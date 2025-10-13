import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UploadStatus {
  id: string;
  fileName: string;
  progress: number;
  stage: 'preparing' | 'video' | 'thumbnail' | 'database' | 'complete' | 'error';
  error?: string;
  startTime: number;
}

interface UploadContextType {
  activeUploads: UploadStatus[];
  addUpload: (id: string, fileName: string) => void;
  updateUpload: (id: string, updates: Partial<UploadStatus>) => void;
  removeUpload: (id: string) => void;
  clearCompletedUploads: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploadContext must be used within an UploadProvider');
  }
  return context;
};

interface UploadProviderProps {
  children: ReactNode;
}

export const UploadProvider: React.FC<UploadProviderProps> = ({ children }) => {
  const [activeUploads, setActiveUploads] = useState<UploadStatus[]>([]);

  const addUpload = (id: string, fileName: string) => {
    setActiveUploads(prev => [
      ...prev,
      {
        id,
        fileName,
        progress: 0,
        stage: 'preparing',
        startTime: Date.now(),
      }
    ]);
  };

  const updateUpload = (id: string, updates: Partial<UploadStatus>) => {
    setActiveUploads(prev =>
      prev.map(upload =>
        upload.id === id ? { ...upload, ...updates } : upload
      )
    );
  };

  const removeUpload = (id: string) => {
    setActiveUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const clearCompletedUploads = () => {
    setActiveUploads(prev => prev.filter(upload => 
      upload.stage !== 'complete' && upload.stage !== 'error'
    ));
  };

  return (
    <UploadContext.Provider
      value={{
        activeUploads,
        addUpload,
        updateUpload,
        removeUpload,
        clearCompletedUploads,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};
