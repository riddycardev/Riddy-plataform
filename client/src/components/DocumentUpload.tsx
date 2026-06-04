/**
 * Document Upload Component
 * Elegant document upload with drag & drop and preview
 */

import { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentUploadProps {
  label: string;
  description: string;
  required?: boolean;
  file: File | null;
  preview: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  validated?: boolean;
  validating?: boolean;
  accept?: string;
}

export default function DocumentUpload({
  label,
  description,
  required = false,
  file,
  preview,
  onUpload,
  onRemove,
  validated = false,
  validating = false,
  accept = "image/jpeg,image/jpg,image/png,application/pdf",
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        onUpload(droppedFile);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        onUpload(selectedFile);
      }
    },
    [onUpload]
  );

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-white flex items-center gap-2">
            {label}
            {required && <span className="text-red-400">*</span>}
          </label>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        {validated && (
          <div className="flex items-center gap-1.5 text-cyan-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Em análise</span>
          </div>
        )}
        {validating && (
          <div className="flex items-center gap-1.5 text-cyan-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Validando...</span>
          </div>
        )}
      </div>

      {/* Upload Area */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 ${
            isDragging
              ? "border-cyan-400 bg-cyan-500/10"
              : "border-white/20 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10"
          }`}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className={`w-10 h-10 mb-3 ${isDragging ? "text-cyan-400" : "text-gray-400"}`} />
            <p className="text-sm font-medium text-white mb-1">
              {isDragging ? "Solte o arquivo aqui" : "Arraste o arquivo ou clique para selecionar"}
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG ou PDF • Máximo 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="relative border border-white/20 rounded-lg p-4 bg-white/5">
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="flex-shrink-0">
              {preview && file.type.startsWith("image/") ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-white/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
        {validated && (
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs mt-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Documento recebido — em análise pela equipe</span>
          </div>
        )}
            </div>

            {/* Remove button */}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
