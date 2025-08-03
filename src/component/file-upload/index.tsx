"use client";

import Image from "next/image";
import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "./lib/utils";
import {
  FileItem,
  FileUploadProps,
  fileUploadVariants,
  formatFileSize,
  FileUploadConfig,
} from "./types";

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
  radius = "md",
  borderStyle = "dashed",
  iconPlacement = "top",
  iconSize = "md",
  colorScheme = "light",
  customColors = {},
  padding = "md",
  config,
}: FileUploadProps) => {
  // Process config - handle both string and object formats
  const processedConfig = useMemo<FileUploadConfig | undefined>(() => {
    if (!config) return undefined;

    if (typeof config === "string") {
      try {
        return JSON.parse(config) as FileUploadConfig;
      } catch (error) {
        console.error("Invalid JSON configuration:", error);
        return undefined;
      }
    }

    return config as FileUploadConfig;
  }, [config]);

  // Get settings with preference for config values
  const settings = useMemo(() => {
    return {
      // Variant settings
      variant: processedConfig?.variant || variant || "dropzone",

      // File constraints
      maxSizeInMB: processedConfig?.fileConstraints?.maxSizeInMB || maxSizeInMB,
      accept: processedConfig?.fileConstraints?.acceptedTypes || accept,
      multiple: processedConfig?.fileConstraints?.multiple ?? multiple,

      // Style presets
      size: processedConfig?.stylePreset?.size || size || "md",
      radius: processedConfig?.stylePreset?.radius || radius,
      borderStyle: processedConfig?.stylePreset?.borderStyle || borderStyle,
      iconPlacement:
        processedConfig?.stylePreset?.iconPlacement || iconPlacement,
      iconSize: processedConfig?.stylePreset?.iconSize || iconSize,
      colorScheme: processedConfig?.stylePreset?.theme || colorScheme,
      customColors: processedConfig?.stylePreset?.customColors || customColors,
      padding: processedConfig?.stylePreset?.padding || padding,

      // Text content
      title: processedConfig?.text?.title || title,
      buttonText: processedConfig?.text?.buttonText || buttonText,
      dragDropText:
        processedConfig?.text?.dragDropText ||
        "Click to upload or drag and drop",
      maxFileSizeText:
        processedConfig?.text?.maxFileSizeText ||
        `Maximum file size: ${
          processedConfig?.fileConstraints?.maxSizeInMB || maxSizeInMB
        }MB`,
      removeFileText: processedConfig?.text?.removeFileText || "Remove file",
      previewText: processedConfig?.text?.previewText || "Preview:",
      errorSizeExceeded:
        processedConfig?.text?.errorSizeExceeded ||
        `File size must be less than ${
          processedConfig?.fileConstraints?.maxSizeInMB || maxSizeInMB
        }MB`,
      filesCountText: processedConfig?.text?.filesCountText || "Files",
    };
  }, [
    processedConfig,
    variant,
    size,
    accept,
    maxSizeInMB,
    buttonText,
    title,
    multiple,
    radius,
    borderStyle,
    iconPlacement,
    iconSize,
    colorScheme,
    customColors,
    padding,
  ]);

  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  // For multiple files variant
  const [files, setFiles] = useState<FileItem[]>([]);

  // Convert accept string to object format for react-dropzone
  const getAcceptFormat = () => {
    if (settings.accept === "*/*") return {};

    const acceptObj: Record<string, string[]> = {};
    settings.accept.split(",").forEach((type) => {
      // Handle mime types (e.g., 'image/png')
      if (type.includes("/")) {
        const [category, extension] = type.split("/");
        if (!acceptObj[type]) {
          acceptObj[type] = [];
        }
      }
      // Handle file extensions (e.g., '.pdf')
      else if (type.startsWith(".")) {
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

  // Process files function - separated from onDrop to prevent render-time state updates
  const processFiles = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Check file size
      const oversizedFiles = acceptedFiles.filter(
        (file) => file.size > settings.maxSizeInMB * 1024 * 1024
      );

      if (oversizedFiles.length > 0) {
        setError(settings.errorSizeExceeded);
        return;
      }

      if (settings.multiple) {
        // Handle multiple files
        const newFiles: FileItem[] = acceptedFiles.map((file) => {
          const fileId = generateId();
          return {
            file,
            id: fileId,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
          };
        });

        // Update files state first
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles, ...newFiles];

          // Use setTimeout to defer parent callback to next tick
          setTimeout(() => {
            if (onFilesChange) {
              onFilesChange(updatedFiles.map((fileItem) => fileItem.file));
            }
          }, 0);

          return updatedFiles;
        });

        // Process image previews asynchronously
        newFiles.forEach((fileItem) => {
          if (fileItem.file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setFiles((currentFiles) =>
                currentFiles.map((f) =>
                  f.id === fileItem.id
                    ? { ...f, url: reader.result as string }
                    : f
                )
              );
            };
            reader.readAsDataURL(fileItem.file);
          }
        });
      } else {
        // Handle single file
        const file = acceptedFiles[0];

        // Set filename, size, and type
        setFileName(file.name);
        setFileSize(formatFileSize(file.size));
        setFileType(file.type);

        // Defer parent callback to next tick
        setTimeout(() => {
          if (onFileChange) {
            onFileChange(file);
          }
        }, 0);

        // Only process as image if it's an image type
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = (e) => {
            const base64 = e.target?.result as string;
            setImage(base64);

            // Defer parent callback to next tick
            setTimeout(() => {
              if (onImageChange) {
                onImageChange(base64);
              }
            }, 0);
          };
          reader.readAsDataURL(file);
        } else {
          // Not an image, clear image state
          setImage(null);
          setTimeout(() => {
            if (onImageChange) {
              onImageChange(null);
            }
          }, 0);
        }
      }
    },
    [settings, onFileChange, onFilesChange, onImageChange]
  );

  // Dropzone setup
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      processFiles(acceptedFiles);
    },
    [processFiles]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: getAcceptFormat(),
    maxSize: settings.maxSizeInMB * 1024 * 1024,
    multiple: settings.multiple,
  });

  // Handle single file upload
  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const uploadedFiles = event.target.files;

      if (uploadedFiles && uploadedFiles.length > 0) {
        const file = uploadedFiles[0];

        // Check file size
        if (file.size > settings.maxSizeInMB * 1024 * 1024) {
          setError(settings.errorSizeExceeded);
          return;
        }

        // Set filename, size, and type
        setFileName(file.name);
        setFileSize(formatFileSize(file.size));
        setFileType(file.type);

        // Defer parent callback to next tick
        setTimeout(() => {
          if (onFileChange) {
            onFileChange(file);
          }
        }, 0);

        // Only process as image if it's an image type
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = (e) => {
            const base64 = e.target?.result as string;
            setImage(base64);

            // Defer parent callback to next tick
            setTimeout(() => {
              if (onImageChange) {
                onImageChange(base64);
              }
            }, 0);
          };
          reader.readAsDataURL(file);
        } else {
          // Not an image, clear image state
          setImage(null);
          setTimeout(() => {
            if (onImageChange) {
              onImageChange(null);
            }
          }, 0);
        }
      } else {
        // Clear all states
        setImage(null);
        setFileName(null);
        setFileSize(null);
        setFileType(null);

        setTimeout(() => {
          if (onFileChange) onFileChange(null);
          if (onImageChange) onImageChange(null);
        }, 0);
      }
    },
    [settings, onFileChange, onImageChange]
  );

  // Handle multiple files upload
  const handleMultipleFilesUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const uploadedFiles = event.target.files;

      if (!uploadedFiles || uploadedFiles.length === 0) return;

      const fileArray = Array.from(uploadedFiles);
      processFiles(fileArray);
    },
    [processFiles]
  );

  // Generate unique ID for files
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Remove a file from multiple files list
  const removeFile = useCallback(
    (id: string) => {
      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.filter((file) => file.id !== id);

        // Defer parent callback to next tick
        setTimeout(() => {
          if (onFilesChange) {
            onFilesChange(updatedFiles.map((fileItem) => fileItem.file));
          }
        }, 0);

        return updatedFiles;
      });
    },
    [onFilesChange]
  );

  // Clear single file
  const clearSingleFile = useCallback(() => {
    setImage(null);
    setFileName(null);
    setFileSize(null);
    setFileType(null);

    setTimeout(() => {
      if (onFileChange) onFileChange(null);
      if (onImageChange) onImageChange(null);
    }, 0);
  }, [onFileChange, onImageChange]);

  // Get appropriate icon based on file type
  const getFileIcon = (type: string | null) => {
    if (!type) return null;

    if (type.startsWith("image/")) {
      return (
        <svg
          className="w-5 h-5 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          ></path>
        </svg>
      );
    } else if (type.startsWith("application/pdf")) {
      return (
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          ></path>
        </svg>
      );
    } else if (type.startsWith("text/")) {
      return (
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
      );
    } else {
      return (
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          ></path>
        </svg>
      );
    }
  };

  // Build theme-based styles
  const getThemeStyles = () => {
    // Border radius styles
    const radiusStyles = {
      none: "rounded-none",
      sm: "rounded",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    }[settings.radius];

    // Border style
    const borderStyles = {
      solid: "border-solid",
      dashed: "border-dashed",
      dotted: "border-dotted",
      none: "border-none",
    }[settings.borderStyle];

    // Padding
    const paddingStyles = {
      sm: "p-2",
      md: "p-4",
      lg: "p-6",
    }[settings.padding];

    // Icon size
    const iconSizeStyles = {
      sm: "w-6 h-6",
      md: "w-8 h-8",
      lg: "w-10 h-10",
    }[settings.iconSize];

    // Color scheme
    const isDark =
      settings.colorScheme === "dark" ||
      (settings.colorScheme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const colors = {
      border:
        settings.customColors.border ||
        (isDark ? "border-gray-600" : "border-gray-300"),
      text:
        settings.customColors.text ||
        (isDark ? "text-gray-200" : "text-gray-500"),
      background:
        settings.customColors.background ||
        (isDark ? "bg-gray-800" : "bg-white"),
      hover:
        settings.customColors.hover ||
        (isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"),
      primary:
        settings.customColors.primary ||
        (isDark ? "text-blue-400" : "text-blue-500"),
    };

    return {
      radiusStyles,
      borderStyles,
      paddingStyles,
      iconSizeStyles,
      colors,
    };
  };

  const themeStyles = getThemeStyles();

  // Helper for icon placement
  const renderIcon = (icon: React.ReactNode) => {
    const flexDirection = {
      left: "flex-row",
      right: "flex-row-reverse",
      top: "flex-col",
    }[settings.iconPlacement];

    return (
      <div className={`flex items-center ${flexDirection} gap-2`}>
        <div className={themeStyles.iconSizeStyles}>{icon}</div>
        <div>
          <p className={`text-sm ${themeStyles.colors.text}`}>
            {settings.iconPlacement === "top"
              ? "Click to upload or drag and drop"
              : buttonText}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {settings.maxFileSizeText}
          </p>
        </div>
      </div>
    );
  };

  // Rest of your render logic stays the same...
  // [Include all the variant rendering logic here - dropzone, multiple, button, preview variants]

  // Dropzone variant
  if (settings.variant === "dropzone") {
    const dropzoneClasses = cn(
      `w-full border-2 ${themeStyles.borderStyles} ${themeStyles.radiusStyles} ${themeStyles.paddingStyles} flex flex-col items-center justify-center transition-colors`,
      isDragAccept && "border-green-500 bg-green-50",
      isDragReject && "border-red-500 bg-red-50",
      isDragActive
        ? `border-blue-400 bg-blue-50`
        : `${themeStyles.colors.border} ${themeStyles.colors.hover}`
    );

    return (
      <div className={cn(fileUploadVariants({ variant, size }), className)}>
        <h2 className="text-lg font-semibold mb-4">{settings.title}</h2>

        <div {...getRootProps({ className: dropzoneClasses })}>
          <input {...getInputProps()} />

          {isDragActive ? (
            <div className="text-center">
              <svg
                className={`${themeStyles.iconSizeStyles} text-blue-500 mx-auto mb-2`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="text-sm text-blue-500">
                Drop {settings.multiple ? "files" : "file"} here...
              </p>
            </div>
          ) : (
            renderIcon(
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
            )
          )}
        </div>

        {/* Error message */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {/* File display section */}
        {settings.multiple
          ? files.length > 0 && (
              <div className="mt-4 w-full">
                <p
                  className={`text-sm font-medium ${themeStyles.colors.text} mb-2`}
                >
                  {settings.filesCountText} ({files.length}):
                </p>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center p-2 ${
                        themeStyles.colors.background
                      } ${themeStyles.radiusStyles} border ${
                        themeStyles.borderStyles === "none"
                          ? ""
                          : themeStyles.borderStyles
                      } ${themeStyles.colors.border}`}
                    >
                      <div className="mr-2">{getFileIcon(file.type)}</div>
                      <div className="flex-1 truncate">
                        <p
                          className={`text-sm font-medium ${themeStyles.colors.text} truncate`}
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeFile(file.id);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        title={settings.removeFileText}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Image previews */}
                {files.some((file) => file.url) && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {files
                      .filter((file) => file.url)
                      .map((file) => (
                        <div key={`preview-${file.id}`} className="relative">
                          <Image
                            src={file.url || ""}
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
          : fileName && (
              <div className="mt-4 w-full">
                <div className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-200">
                  <div className="mr-2">{getFileIcon(fileType)}</div>
                  <div className="flex-1 truncate">
                    <p
                      className="text-sm font-medium text-gray-700 truncate"
                      title={fileName}
                    >
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-500">{fileSize}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      clearSingleFile();
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    title={settings.removeFileText}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>

                {/* Image preview for single file */}
                {image && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {settings.previewText}:
                    </p>
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
            )}
      </div>
    );
  }

  // Multiple files variant
  if (settings.variant === "multiple") {
    return (
      <div className={cn(fileUploadVariants({ variant, size }), className)}>
        <h2 className="text-lg font-semibold mb-4">{settings.title}</h2>

        <label className="cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
          <svg
            className="w-10 h-10 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
          <p className="text-sm text-gray-500">{settings.dragDropText}</p>
          <p className="text-xs text-gray-400 mt-1">
            {settings.maxFileSizeText}
          </p>
          <input
            type="file"
            accept={settings.accept}
            onChange={handleMultipleFilesUpload}
            className="hidden"
            multiple
          />
        </label>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 w-full">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {settings.filesCountText} ({files.length}):
            </p>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-200"
                >
                  <div className="mr-2">{getFileIcon(file.type)}</div>
                  <div className="flex-1 truncate">
                    <p
                      className="text-sm font-medium text-gray-700 truncate"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFile(file.id);
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    title={settings.removeFileText}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Image previews */}
            {files.some((file) => file.url) && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {files
                  .filter((file) => file.url)
                  .map((file) => (
                    <div key={`preview-${file.id}`} className="relative">
                      <Image
                        src={file.url || ""}
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
  if (settings.variant === "button") {
    return (
      <div className={cn(fileUploadVariants({ variant, size }), className)}>
        <label className="cursor-pointer flex flex-col items-center">
          <div className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors">
            {settings.buttonText}
          </div>
          <input
            type="file"
            accept={settings.accept}
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        {fileName && (
          <div className="mt-2 text-left w-full">
            <div className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-200">
              <div className="mr-2">{getFileIcon(fileType)}</div>
              <div className="flex-1 truncate">
                <p
                  className="text-sm font-medium text-gray-700 truncate"
                  title={fileName}
                >
                  {fileName}
                </p>
                <p className="text-xs text-gray-500">{fileSize}</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  clearSingleFile();
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
                title={settings.removeFileText}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
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
      <h2 className="text-lg font-semibold mb-4">{settings.title}</h2>

      <div className="flex flex-col items-center">
        {/* Upload area */}
        <label className="cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
          {!image ? (
            <>
              <svg
                className="w-10 h-10 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="text-sm text-gray-500">{settings.dragDropText}</p>
              <p className="text-xs text-gray-400 mt-1">
                {settings.maxFileSizeText}
              </p>
            </>
          ) : (
            <p className="text-sm text-blue-500">Click to change image</p>
          )}
          <input
            type="file"
            accept={settings.accept}
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        {/* Error message */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {/* Preview area - only shown for images */}
        {image && (
          <div className="mt-4 w-full">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {settings.previewText}:
            </p>
            <Image
              src={image}
              alt="Uploaded Image"
              width={200}
              height={200}
              className="rounded-lg w-full object-cover"
            />
            {fileName && (
              <div className="mt-2 flex items-center">
                <svg
                  className="w-4 h-4 text-gray-500 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <span className="text-xs text-gray-600">
                  {fileName} ({fileSize})
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
