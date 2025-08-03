"use client";

import { FileUpload } from "@/component/file-upload";
import {
  uploadFile,
  uploadMultipleFiles,
} from "@/component/file-upload/lib/upload";
import React, { useState } from "react";

// Button variant configuration
const buttonConfig = {
  variant: "button",
  text: {
    buttonText: "Upload File",
    title: "Simple Button Uploader",
  },
  stylePreset: {
    theme: "light",
    size: "md",
    radius: "md",
    customColors: {
      primary: "text-blue-600",
    },
  },
};

// Preview variant configuration
const previewConfig = {
  variant: "preview",
  fileConstraints: {
    maxSizeInMB: 2,
    acceptedTypes: "image/*",
  },
  text: {
    title: "Upload an Image",
    previewText: "Image Preview",
  },
  stylePreset: {
    size: "lg",
    theme: "light",
    radius: "md",
  },
};

// Multiple files variant configuration
const multipleConfig = {
  variant: "multiple",
  fileConstraints: {
    maxSizeInMB: 10,
    acceptedTypes: "image/*,.pdf,.doc,.docx",
    multiple: true,
  },
  text: {
    title: "Upload Documents",
    dragDropText: "Drop your documents here",
    filesCountText: "Uploaded Documents",
  },
  stylePreset: {
    theme: "light",
    size: "md",
    borderStyle: "dotted",
    radius: "lg",
    padding: "lg",
    customColors: {
      border: "border-gray-400",
      hover: "hover:bg-gray-50",
    },
  },
};

// Dropzone variant configuration
const dropzoneConfig = {
  variant: "dropzone",
  fileConstraints: {
    maxSizeInMB: 10,
    acceptedTypes: "image/jpeg,image/png,.pdf",
    multiple: true,
  },
  stylePreset: {
    theme: "dark",
    radius: "lg",
    borderStyle: "dashed",
    iconPlacement: "top",
    padding: "lg",
    customColors: {
      primary: "text-blue-400",
      border: "border-neutral-700",
      hover: "hover:bg-neutral-800",
    },
  },
  text: {
    title: "Upload Your Documents",
    buttonText: "Select Files",
    dragDropText: "Drop files here or click to browse",
    maxFileSizeText: "Files up to 10MB",
    errorSizeExceeded: "File too large. Maximum size is 10MB.",
  },
};

export default function Home() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<
    Array<{ url: string; fileName: string }>
  >([]);

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setUploadStatus(null);
      setUploadProgress(0);
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      const result = await uploadFile(file, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      if (result.success) {
        setUploadStatus("success");
        console.log("Upload successful:", result);
      } else {
        setUploadStatus("error");
        console.error("Upload failed:", result.error);
      }
    } catch (error) {
      setUploadStatus("error");
      console.error("Upload error:", error);
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    console.log("Files to upload:", files);
    if (!files || files.length === 0) {
      setUploadStatus(null);
      setUploadProgress(0);
      setUploadResults([]);
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      const results = await uploadMultipleFiles(files, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      const successful = results.filter((r) => r.success);
      if (successful.length > 0) {
        setUploadResults(
          successful.map((r) => ({
            url: r.url || "",
            fileName: r.fileName,
          }))
        );
        setUploadStatus("success");
      } else {
        setUploadStatus("error");
      }
    } catch (error) {
      setUploadStatus("error");
      console.error("Upload error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-12">
          FileUpload Component Variants
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Button Variant */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">Button Variant</h2>
            <FileUpload
              config={JSON.stringify(buttonConfig)}
              onFileChange={handleFileUpload}
            />
          </div>

          {/* Preview Variant */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">Preview Variant</h2>
            <FileUpload
              config={JSON.stringify(previewConfig)}
              onFileChange={handleFileUpload}
              onImageChange={(imageUrl) => console.log(imageUrl)}
            />
          </div>

          {/* Multiple Files Variant */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              Multiple Files Variant
            </h2>
            <FileUpload
              config={JSON.stringify(multipleConfig)}
              onFilesChange={handleFilesUpload}
            />
          </div>

          {/* Dropzone Variant */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">Dropzone Variant</h2>
            <FileUpload
              config={JSON.stringify(dropzoneConfig)}
              onFilesChange={handleFilesUpload}
            />
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div className="mt-8 max-w-md mx-auto">
            {uploadStatus === "uploading" && (
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Uploading...</span>
                  <span className="text-gray-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
                <p>Upload complete!</p>
                {uploadResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadResults.map((result, index) => (
                      <p key={index} className="text-xs truncate">
                        ✓ {result.fileName}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                <p>Upload failed. Please try again.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
