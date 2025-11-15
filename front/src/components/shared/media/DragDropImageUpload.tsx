import React, { useState, useRef, useCallback } from 'react';
import { FaUpload, FaTrash, FaSpinner } from 'react-icons/fa';
import { getImageUrl, handleImageError, DEFAULT_SERVICE_IMAGE } from '../../../utils/imageUtils';

interface DragDropImageUploadProps {
  onImagesChange: (images: File[]) => void;
  existingImages?: string[];
  onRemoveExisting?: (index: number) => void;
  maxImages?: number;
  className?: string;
}

const DragDropImageUpload: React.FC<DragDropImageUploadProps> = ({
  onImagesChange,
  existingImages = [],
  onRemoveExisting,
  maxImages = 5,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.');
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Fichier trop volumineux. Taille maximum : 5MB.');
      return false;
    }

    return true;
  };

  const handleFiles = useCallback((files: FileList) => {
    setError('');
    const validFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      const totalImages = existingImages.length + selectedFiles.length + validFiles.length;
      if (totalImages > maxImages) {
        setError(`Maximum ${maxImages} images autorisées.`);
        return;
      }

      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onImagesChange(newFiles);
    }
  }, [existingImages.length, selectedFiles.length, maxImages, onImagesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [handleFiles]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const removeSelectedFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onImagesChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drag & drop */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-accent bg-accent/5' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <FaUpload className={`text-3xl mx-auto mb-2 ${isDragOver ? 'text-accent' : 'text-gray-400'}`} />
        <p className={`text-sm ${isDragOver ? 'text-accent' : 'text-gray-500'}`}>
          {isDragOver 
            ? 'Déposez vos images ici' 
            : 'Glissez-déposez vos images ici ou cliquez pour sélectionner'
          }
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Formats acceptés : JPEG, PNG, WebP (max 5MB)
        </p>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Images existantes */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Images existantes :</h4>
          <div className="grid grid-cols-4 gap-2">
            {existingImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={getImageUrl(image, DEFAULT_SERVICE_IMAGE)}
                  alt={`Image ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                  onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
                />
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nouvelles images sélectionnées */}
      {selectedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Nouvelles images :</h4>
          <div className="grid grid-cols-4 gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Nouvelle image ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeSelectedFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropImageUpload; 