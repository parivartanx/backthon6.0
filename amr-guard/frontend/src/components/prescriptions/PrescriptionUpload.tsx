"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  FileCheck, 
  AlertCircle, 
  Maximize2,
  ZoomIn
} from "lucide-react";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrescriptionUploadProps {
  onImageSelected?: (file: File | null, previewUrl: string | null) => void;
  selectedFile?: File | null;
  previewUrl?: string | null;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 10;

// [SOLID: SRP & DIP] PrescriptionUpload with Zustand store binding and memory-safe preview
export function PrescriptionUpload({
  onImageSelected: propOnImageSelected,
  selectedFile: propSelectedFile,
  previewUrl: propPreviewUrl,
  disabled = false,
}: PrescriptionUploadProps) {
  // Bind to Zustand store if props not explicitly supplied
  const { draftFile, draftPreviewUrl, setDraftImage } = usePrescriptionStore();

  const selectedFile = propSelectedFile !== undefined ? propSelectedFile : draftFile;
  const previewUrl = propPreviewUrl !== undefined ? propPreviewUrl : draftPreviewUrl;

  const handleImageUpdate = (file: File | null, url: string | null) => {
    // Revoke previous blob URL if replacing or removing to avoid memory leak
    if (previewUrl && previewUrl.startsWith("blob:") && previewUrl !== url) {
      URL.revokeObjectURL(previewUrl);
    }
    if (propOnImageSelected) {
      propOnImageSelected(file, url);
    } else {
      setDraftImage(file, url);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    setErrorMessage(null);
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage("Please upload a supported image format (JPEG, PNG, or WebP).");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    handleImageUpdate(file, objectUrl);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    handleImageUpdate(null, null);
    setErrorMessage(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <AlertDescription className="text-xs ml-2">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-[#169781] bg-[#E2FAD9]/30 ring-4 ring-[#E2FAD9]"
              : "border-slate-300 hover:border-[#169781] hover:bg-slate-50/60 bg-white"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            disabled={disabled}
          />
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#169781]">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Upload Prescription Document
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Drag and drop your scanned prescription or doctor&apos;s slip, or{" "}
            <span className="text-[#169781] font-semibold underline underline-offset-2">
              browse files
            </span>
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span>Supports JPEG, PNG, WebP (Max 10MB)</span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#E2FAD9] flex items-center justify-center text-[#0d5c36] shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {selectedFile ? selectedFile.name : "Prescription Image"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedFile ? formatFileSize(selectedFile.size) : "Ready for extraction"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsZoomOpen(true)}
                className="text-xs h-7 px-2 text-slate-600 hover:text-[#0D607B] gap-1"
                title="Expand preview"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="text-xs h-7 px-2 text-[#0D607B] hover:underline"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                disabled={disabled}
                className="h-7 w-7 text-slate-400 hover:text-red-600"
                title="Remove image"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image Preview Box */}
          <div 
            onClick={() => setIsZoomOpen(true)}
            className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 max-h-64 flex items-center justify-center group cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded prescription preview"
              className="object-contain max-h-64 w-full transition-transform duration-200 group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="px-2.5 py-1 rounded bg-black/60 text-white text-[11px] font-medium flex items-center gap-1">
                <Maximize2 className="w-3 h-3" />
                <span>Click to expand</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Usability Helper */}
      <div className="flex items-start gap-2 p-3 bg-[#F1F8FC] border border-[#C9E9EB] rounded-lg text-xs text-slate-600">
        <ImageIcon className="w-4 h-4 text-[#0D607B] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong className="text-[#0D607B]">Clinical protocol:</strong> Upload a clear prescription image. Review all extracted medicine details, dosages, and patient clinical indicators thoroughly before clinical auditing.
        </p>
      </div>

      {/* Full-screen Zoom Modal */}
      {previewUrl && (
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0D607B]" />
                <DialogTitle className="text-xs font-bold text-slate-800">
                  Prescription Document Detail View
                </DialogTitle>
                <DialogDescription className="sr-only">
                  High-resolution preview of the uploaded prescription document.
                </DialogDescription>
              </div>
            </DialogHeader>
            <div className="p-4 overflow-auto max-h-[80vh] flex items-center justify-center bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Enlarged prescription scan"
                className="max-h-[75vh] w-auto object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
