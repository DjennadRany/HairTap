import React, { useState, useRef } from 'react';
import { FaCamera, FaVideo, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

interface MobileMediaUploadProps {
  onMediaSelect: (files: File[]) => void;
  existingMedia: string[];
  onRemoveExisting: (index: number) => void;
  maxFiles?: number;
}

export const MobileMediaUpload: React.FC<MobileMediaUploadProps> = ({
  onMediaSelect,
  existingMedia,
  onRemoveExisting,
  maxFiles = 10
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, maxFiles - selectedFiles.length);
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    onMediaSelect([...selectedFiles, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
    onMediaSelect(newFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const isVideo = (file: File | string) => {
    if (typeof file === 'string') {
      return file.includes('.mp4') || file.includes('.webm') || file.includes('.ogg') || file.includes('.avi') || file.includes('.mov');
    }
    return file.type.startsWith('video/');
  };

  return (
    <div className="space-y-4">
      {/* Zone d'upload mobile */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          isDragOver 
            ? 'border-pink-500 bg-pink-50' 
            : 'border-gray-300 hover:border-pink-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-3">
          <div className="flex justify-center space-x-4">
            <button
              onClick={openFileDialog}
              className="flex flex-col items-center space-y-2 p-4 bg-pink-100 rounded-xl hover:bg-pink-200 transition-colors"
            >
              <FaCamera className="text-2xl text-pink-600" />
              <span className="text-sm font-medium text-pink-700">Photos</span>
            </button>
            
            <button
              onClick={openFileDialog}
              className="flex flex-col items-center space-y-2 p-4 bg-blue-100 rounded-xl hover:bg-blue-200 transition-colors"
            >
              <FaVideo className="text-2xl text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Vidéos</span>
            </button>
          </div>
          
          <p className="text-sm text-gray-500">
            Glissez-déposez ou cliquez pour ajouter
          </p>
          <p className="text-xs text-gray-400">
            Max {maxFiles} fichiers • Images: 5MB • Vidéos: 50MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Prévisualisation des médias */}
      {(selectedFiles.length > 0 || existingMedia.length > 0) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Médias sélectionnés</h4>
          
          {/* Médias existants */}
          {existingMedia.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {existingMedia.map((media, index) => (
                <div key={`existing-${index}`} className="relative group">
                  {isVideo(media) ? (
                    <video
                      src={media}
                      className="w-full h-24 object-cover rounded-lg"
                      muted
                    />
                  ) : (
                    <img
                      src={media}
                      alt={`Média ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  )}
                  
                  <button
                    onClick={() => onRemoveExisting(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                  
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                    {isVideo(media) ? '🎥' : '📷'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nouveaux médias */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {selectedFiles.map((file, index) => (
                <div key={`new-${index}`} className="relative group">
                  {isVideo(file) ? (
                    <video
                      src={previewUrls[index]}
                      className="w-full h-24 object-cover rounded-lg"
                      muted
                    />
                  ) : (
                    <img
                      src={previewUrls[index]}
                      alt={`Nouveau média ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  )}
                  
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                  
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                    {isVideo(file) ? '🎥' : '📷'}
                  </div>
                  
                  <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1">
                    <FaCheck className="text-xs" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileMediaUpload;
