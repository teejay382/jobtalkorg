import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';

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
  getCurrentUploads: () => UploadStatus[];
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
  const uploadsRef = useRef<UploadStatus[]>([]);
  const listenersRef = useRef<Set<() => void>>(new Set());

  // Notify listeners without causing re-renders in unrelated components
  const notifyListeners = useCallback(() => {
    listenersRef.current.forEach(listener => listener());
  }, []);

  const addUpload = useCallback((id: string, fileName: string) => {
    const newUpload = {
      id,
      fileName,
      progress: 0,
      stage: 'preparing' as const,
      startTime: Date.now(),
    };
    uploadsRef.current = [...uploadsRef.current, newUpload];
    setActiveUploads(uploadsRef.current);
    notifyListeners();
  }, [notifyListeners]);

  const updateUpload = useCallback((id: string, updates: Partial<UploadStatus>) => {
    // Update ref immediately without triggering React re-render
    uploadsRef.current = uploadsRef.current.map(upload =>
      upload.id === id ? { ...upload, ...updates } : upload
    );
    
    // Only update state (causing re-render) for stage changes, not progress
    if (updates.stage !== undefined) {
      setActiveUploads([...uploadsRef.current]);
    }
    
    notifyListeners();
  }, [notifyListeners]);

  const removeUpload = useCallback((id: string) => {
    uploadsRef.current = uploadsRef.current.filter(upload => upload.id !== id);
    setActiveUploads(uploadsRef.current);
    notifyListeners();
  }, [notifyListeners]);

  const clearCompletedUploads = useCallback(() => {
    uploadsRef.current = uploadsRef.current.filter(upload => 
      upload.stage !== 'complete' && upload.stage !== 'error'
    );
    setActiveUploads(uploadsRef.current);
    notifyListeners();
  }, [notifyListeners]);

  const getCurrentUploads = useCallback(() => {
    return uploadsRef.current;
  }, []);

  return (
    <UploadContext.Provider
      value={{
        activeUploads,
        getCurrentUploads,
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
