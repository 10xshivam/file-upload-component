"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useDropzone } from "react-dropzone";
import { cn } from "./lib/utils";
import { FileItem, FileUploadProps, fileUploadVariants, formatFileSize } from "./types";


export const FileUpload = ({
  variant,
  size,
  className,
  accept = "*/*",
  maxSizeInMB = 5,
  buttonText = "Choose File",
  title = "Upload a File",
  onFileChange,
  onFilesChange,
  onImageChange,
  multiple = false,
}: FileUploadProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  
  // For multiple files variant
  const [files, setFiles] = useState<FileItem[]>([]);

  // Convert accept string to object format for react-dropzone
  const getAcceptFormat = () => {
    if (accept === "*/*") return {};
    
    const acceptObj: Record<string, string[]> = {};
    accept.split(',').forEach(type => {
      // Handle mime types (e.g., 'image/png')
      if (type.includes('/')) {
        const [category, extension] = type.split('/');
        if (!acceptObj[type]) {
          acceptObj[type] = [];
        }
      } 
      // Handle file extensions (e.g., '.pdf')
      else if (type.startsWith('.')) {
        const extension = type.substring(1);
        const mimeType = `application/${extension}`;
        if (!acceptObj[mimeType]) {
          acceptObj[mimeType] = [`.${extension}`];
        } else {
          acceptObj[mimeType].push(`.${extension}`);
        }
      }
    });
    
    return acceptObj;
  };

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) return;
    
    // Check file size
    const oversizedFiles = acceptedFiles.filter(
      file => file.size > maxSizeInMB * 1024 * 1024
    );
    
    if (oversizedFiles.length > 0) {
      setError(`File size must be less than ${maxSizeInMB}MB`);
      return;
    }
    
    if (multiple) {
      // Handle multiple files
      const newFiles: FileItem[] = acceptedFiles.map(file => {
        const fileId = generateId();
        return {
          file,
          id: fileId,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
        };
      });
      
      // Process image previews
      newFiles.forEach(fileItem => {
        if (fileItem.file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFiles(currentFiles => {
              const updatedFiles = currentFiles.map(f => {
                if (f.id === fileItem.id) {
                  return { ...f, url: reader.result as string };
                }
                return f;
              });
              return updatedFiles;
            });
          };
          reader.readAsDataURL(fileItem.file);
        }
      });
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Notify parent component
      if (onFilesChange) {
        onFilesChange([...files, ...newFiles].map(fileItem => fileItem.file));
      }
    } else {
      // Handle single file
      const file = acceptedFiles[0];
      
      // Set filename, size, and type
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setFileType(file.type);
      
      // Notify parent component about file change
      if (onFileChange) {
        onFileChange(file);
      }
      
      // Only process as image if it's an image type
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = (e) => {
          const base64 = e.target?.result as string;
          setImage(base64);
          
          // Notify parent component about image change
          if (onImageChange) {
            onImageChange(base64);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Not an image, clear image state
        setImage(null);
        if (onImageChange) {
          onImageChange(null);
        }
      }
    }
  }, [maxSizeInMB, onFileChange, onFilesChange, onImageChange, files, multiple]);
  
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive, 
    isDragAccept, 
    isDragReject 
  } = useDropzone({ 
    onDrop,
    accept: getAcceptFormat(),
    maxSize: maxSizeInMB * 1024 * 1024,
    multiple
  });

  // Handle single file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const uploadedFiles = event.target.files;
    
    if (uploadedFiles && uploadedFiles.length > 0) {
      const file = uploadedFiles[0];
      
      // Check file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        setError(`File size must be less than ${maxSizeInMB}MB`);
        return;
      }

      // Set filename, size, and type
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setFileType(file.type);

      // Notify parent component about file change
      if (onFileChange) {
        onFileChange(file);
      }

      // Only process as image if it's an image type
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = (e) => {
          const base64 = e.target?.result as string;
          setImage(base64);
          
          // Notify parent component about image change
          if (onImageChange) {
            onImageChange(base64);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Not an image, clear image state
        setImage(null);
        if (onImageChange) {
          onImageChange(null);
        }
      }
    } else {
      setImage(null);
      setFileName(null);
      setFileSize(null);
      setFileType(null);
      if (onFileChange) onFileChange(null);
      if (onImageChange) onImageChange(null);
    }
  };

  // Handle multiple files upload
  const handleMultipleFilesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const uploadedFiles = event.target.files;
    
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newFiles: FileItem[] = [];
    let hasError = false;

    Array.from(uploadedFiles).forEach(file => {
      // Check file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the ${maxSizeInMB}MB size limit`);
        hasError = true;
        return;
      }

      const fileId = generateId();
      const fileItem: FileItem = {
        file,
        id: fileId,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
      };

      // If it's an image, generate preview URL
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFiles(currentFiles => {
            const updatedFiles = currentFiles.map(f => {
              if (f.id === fileId) {
                return { ...f, url: reader.result as string };
              }
              return f;
            });
            return updatedFiles;
          });
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(fileItem);
    });

    if (!hasError) {
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Notify parent component
      if (onFilesChange) {
        onFilesChange([...files, ...newFiles].map(fileItem => fileItem.file));
      }
    }
  };

  // Generate unique ID for files
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Remove a file from multiple files list
  const removeFile = (id: string) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(file => file.id !== id);
      
      // Notify parent component
      if (onFilesChange) {
        onFilesChange(updatedFiles.map(fileItem => fileItem.file));
      }
      
      return updatedFiles;
    });
  };

  // Get appropriate icon based on file type
  const getFileIcon = (type: string | null) => {
    if (!type) return null;
    
    if (type.startsWith('image/')) {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (type.startsWith('application/pdf')) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (type.startsWith('text/')) {
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
        </svg>
      );
    }
  };

  // Dropzone variant
  if (variant === "dropzone") {
    const dropzoneClasses = cn(
      "w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors",
      isDragAccept && "border-green-500 bg-green-50",
      isDragReject && "border-red-500 bg-red-50",
      isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
    );

    return (
      <div className={cn(fileUploadVariants({ variant, size }), className)}>
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        
        <div {...getRootProps({ className: dropzoneClasses })}>
          <input {...getInputProps()} />
          
          {isDragActive ? (
            <div className="text-center">
              <svg className="w-10 h-10 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="text-sm text-blue-500">Drop {multiple ? 'files' : 'file'} here...</p>
            </div>
          ) : (
            <div className="text-center">
              <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="text-sm text-gray-500">Drag & drop {multiple ? 'files' : 'a file'} here, or click to select</p>
              <p className="text-xs text-gray-400 mt-1">Maximum file size: {maxSizeInMB}MB</p>
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        {/* File display section */}
        {multiple ? (
          // Multiple files preview
          files.length > 0 && (
            <div className="mt-4 w-full">
              <p className="text-sm font-medium text-gray-700 mb-2">Files ({files.length}):</p>
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-200">
                    <div className="mr-2">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium text-gray-700 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{file.size}</p>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Image previews */}
              {files.some(file => file.url) && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {files.filter(file => file.url).map(file => (
                    <div key={`preview-${file.id}`} className="relative">
                      <Image 
                        src={file.url || ''} 
                        alt={file.name}
                        width={100}
                        height={100}
                        className="rounded-md h-24 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          // Single file preview
          fileName && (
            <div className="mt-4 w-full">
              <div className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-200">
                <div className="mr-2">
                  {getFileIcon(fileType)}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-gray-700 truncate" title={fileName}>
                    {fileName}
                  </p>
                  <p className="text-xs text-gray-500">{fileSize}</p>
                </div>
                <button
                  onClick={() => {
                    setImage(null);
                    setFileName(null);
                    setFileSize(null);
                    setFileType(null);
                    if (onFileChange) onFileChange(null);
                    if (onImageChange) onImageChange(null);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              {/* Image preview for single file */}
              {image && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <Image
                    src={image}
                    alt="Uploaded Image"
                    width={200}
                    height={200}
                    className="rounded-lg w-full object-cover"
                  />
                </div>
              )}
            </div>
          )
        )}
      </div>
    );
  }

  // Multiple files variant
  if (variant === "multiple") {
    return (
      <div className={cn(fileUploadVariants({ variant, size }), className)}>
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        
        <label className="cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
          <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="text-sm text-gray-500">Click to upload multiple files</p>
          <p className="text-xs text-gray-400 mt-1">Maximum file size: {maxSizeInMB}MB</p>
          <input 
            type="file" 
            accept={accept} 
            onChange={handleMultipleFilesUpload}
            className="hidden"
            multiple
          />
        </label>
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 w-full">
            <p className="text-sm font-medium text-gray-700 mb-2">Files ({files.length}):</p>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-200">
                  <div className="mr-2">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium text-gray-700 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            {/* Image previews */}
            {files.some(file => file.url) && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {files.filter(file => file.url).map(file => (
                  <div key={`preview-${file.id}`} className="relative">
                    <Image 
                      src={file.url || ''} 
                      alt={file.name}
                      width={100}
                      height={100}
                      className="rounded-md h-24 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Button-only variant
  if (variant === "button") {
    return (
      <div className={cn(fileUploadVariants({ variant, size }), className)}>
        <label className="cursor-pointer flex flex-col items-center">
          <div className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors">
            {buttonText}
          </div>
          <input 
            type="file" 
            accept={accept} 
            onChange={handleImageUpload} 
            className="hidden" 
          />
        </label>

        {fileName && (
          <div className="mt-2 text-left w-full">
            <div className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-200">
              <div className="mr-2">
                {getFileIcon(fileType)}
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-gray-700 truncate" title={fileName}>
                  {fileName}
                </p>
                <p className="text-xs text-gray-500">{fileSize}</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setImage(null);
                  setFileName(null);
                  setFileSize(null);
                  setFileType(null);
                  if (onFileChange) onFileChange(null);
                  if (onImageChange) onImageChange(null);
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
                title="Remove file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    );
  }

  // Preview variant (default)
  return (
    <div className={cn(fileUploadVariants({ variant, size }), className)}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      
      <div className="flex flex-col items-center">
        {/* Upload area */}
        <label className="cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
          {!image ? (
            <>
              <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">Maximum file size: {maxSizeInMB}MB</p>
            </>
          ) : (
            <p className="text-sm text-blue-500">Click to change image</p>
          )}
          <input 
            type="file" 
            accept={accept} 
            onChange={handleImageUpload}
            className="hidden" 
          />
        </label>
        
        {/* Error message */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        {/* Preview area - only shown for images */}
        {image && (
          <div className="mt-4 w-full">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <Image
              src={image}
              alt="Uploaded Image"
              width={200}
              height={200}
              className="rounded-lg w-full object-cover"
            />
            {fileName && (
              <div className="mt-2 flex items-center">
                <svg className="w-4 h-4 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span className="text-xs text-gray-600">{fileName} ({fileSize})</span>
              </div>
            )} 
          </div>
        )}
      </div>
    </div>
  );
};
