/**
 * ImageUpload Component
 * Handles multiple image uploads with preview, reordering, and S3 upload
 */

import { useState, useCallback } from "react";
import { Upload, X, Loader2, GripVertical, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export interface UploadedImage {
  id?: number;
  file?: File;
  previewUrl: string;
  imageUrl?: string;
  fileKey?: string;
  base64Data?: string; // Base64 encoded image data for Cloudinary upload
  isUploading?: boolean;
  isUploaded?: boolean;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  minImages?: number;
  onUpload: (file: File) => Promise<{ url: string; key: string; base64?: string }>;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  minImages = 3,
  onUpload,
}: ImageUploadProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      
      if (files.length + images.length > maxImages) {
        toast.error(`Máximo de ${maxImages} fotos permitidas`);
        return;
      }

      // Validate file types and sizes
      const validFiles: File[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} excede o limite de 5MB`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Create preview images with uploading state
      const newImages: UploadedImage[] = validFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        isUploading: true,
        isUploaded: false,
      }));

      // Add new images to the list
      const allImages = [...images, ...newImages];
      onImagesChange(allImages);
      setUploadingCount(validFiles.length);

      // Upload each file sequentially
      let currentImages = [...allImages];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const imageIndex = images.length + i;

        try {
          const result = await onUpload(file);
          
          // Update the specific image with upload result
          currentImages = currentImages.map((img, idx) => {
            if (idx === imageIndex) {
              return {
                ...img,
                imageUrl: result.url,
                fileKey: result.key,
                base64Data: result.base64, // Save base64 for Cloudinary upload
                isUploading: false,
                isUploaded: true,
              };
            }
            return img;
          });
          onImagesChange(currentImages);
        } catch (error) {
          console.error("Upload failed:", error);
          toast.error(`Falha ao enviar ${file.name}`);
          
          // Remove failed upload
          currentImages = currentImages.filter((_, idx) => idx !== imageIndex);
          onImagesChange(currentImages);
        }
      }

      setUploadingCount(0);
      // Reset input
      e.target.value = "";
    },
    [images, maxImages, onImagesChange, onUpload]
  );

  const removeImage = useCallback(
    (index: number) => {
      const image = images[index];
      if (image.previewUrl && image.file) {
        URL.revokeObjectURL(image.previewUrl);
      }
      onImagesChange(images.filter((_, i) => i !== index));
    },
    [images, onImagesChange]
  );

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    onImagesChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Image Previews */}
        {images.map((image, index) => (
          <div
            key={index}
            draggable={!image.isUploading}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative aspect-[4/3] rounded-lg overflow-hidden bg-white/5 border-2 transition-all ${
              draggedIndex === index
                ? "border-cyan-500 opacity-50"
                : "border-transparent"
            } ${image.isUploading ? "animate-pulse" : ""}`}
          >
            {/* Image */}
            <img
              src={image.previewUrl || image.imageUrl}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Uploading Overlay */}
            {image.isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            )}

            {/* Drag Handle */}
            {!image.isUploading && (
              <div className="absolute top-2 left-2 p-1 rounded bg-black/50 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Remove Button */}
            {!image.isUploading && (
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Main Badge */}
            {index === 0 && (
              <span className="absolute bottom-2 left-2 px-2 py-1 text-xs bg-cyan-500 text-black rounded font-medium">
                Principal
              </span>
            )}

            {/* Upload Status */}
            {image.isUploaded && (
              <span className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-green-500 text-white rounded font-medium">
                ✓
              </span>
            )}
          </div>
        ))}

        {/* Upload Button */}
        {images.length < maxImages && (
          <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-white/5 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-400">Adicionar foto</span>
            <span className="text-xs text-gray-500 mt-1">
              {images.length}/{maxImages}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Helper Text */}
      {images.length < minImages && (
        <p className="text-yellow-500 text-sm flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Adicione pelo menos {minImages} fotos para publicar seu veículo
        </p>
      )}

      <p className="text-gray-500 text-xs">
        Arraste as fotos para reordenar. A primeira foto será a principal.
        Formatos aceitos: JPG, PNG, WebP. Tamanho máximo: 5MB por foto.
      </p>
    </div>
  );
}
