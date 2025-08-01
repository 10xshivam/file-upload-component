import { cva, type VariantProps } from "class-variance-authority";

// Define the variants for the file upload component
export const fileUploadVariants = cva(
  "relative rounded-lg text-center",
  {
    variants: {
      variant: {
        button: "inline-flex flex-col items-center",
        preview: "p-4 border border-dashed border-gray-300",
        multiple: "p-4 border border-dashed border-gray-300",
        dropzone: "p-4",
      },
      size: {
        default: "max-w-2xs",
        sm: "max-w-xs",
        lg: "max-w-md",
      },
    },
    defaultVariants: {
      variant: "preview",
      size: "default",
    },
  }
);

// Component props interface
export interface FileUploadProps extends VariantProps<typeof fileUploadVariants> {
  className?: string;
  accept?: string;
  maxSizeInMB?: number;
  buttonText?: string;
  title?: string;
  onFileChange?: (file: File | null) => void;
  onFilesChange?: (files: File[]) => void;
  onImageChange?: (imageUrl: string | null) => void;
  multiple?: boolean;
}

// File item structure for multiple files
export interface FileItem {
  file: File;
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

// Utility function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};