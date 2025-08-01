"use client";
import { FileUpload } from "@/component/file-upload";
import { uploadFile, uploadMultipleFiles } from "@/component/file-upload/lib/upload";
import React, { useState } from "react";

export default function Home() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // const [uploadProgress, setUploadProgress] = useState<number>(0);
  // const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<Array<{url: string, fileName: string}>>([]);

  const handleFilesUpload = async (files: File[]) => {
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
        }
      });
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        setUploadResults(
          successful.map(r => ({
            url: r.url || '',
            fileName: r.fileName
          }))
        );
        
        if (failed.length > 0) {
          setUploadStatus("partial");
          console.warn(`${failed.length} files failed to upload`);
        } else {
          setUploadStatus("success");
        }
      } else {
        setUploadStatus("error");
      }
      
      console.log("Upload results:", results);
    } catch (error) {
      setUploadStatus("error");
      console.error("Upload error:", error);
    }
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setUploadStatus(null);
      setUploadProgress(0);
      setUploadedUrl(null);
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);
    
    try {
      const result = await uploadFile(file, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      
      if (result.success) {
        setUploadStatus("success");
        setUploadedUrl(result.url);
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

  
  return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center">
      {/* // Simple button uploader */}
      {/* <FileUpload
        variant="button"
        buttonText="Upload File"
        onFileChange={(file) => console.log(file)}
      /> */}

      {/* // Full preview uploader */}
      {/* <FileUpload
        variant="preview"
        size="lg"
        title="Upload an Image"
        maxSizeInMB={2}
        onImageChange={(imageUrl) => console.log(imageUrl)}
      /> */}

      {/* // Multiple files uploader */}
      {/* <FileUpload
        variant="multiple"
        title="Upload Documents"
        accept="image/*,.pdf,.doc,.docx"
        maxSizeInMB={10}
        onFilesChange={(files) => console.log(files)}
      /> */}

      {/* // Drag and drop uploader */}
      {/* <FileUpload
        variant="dropzone"
        title="Upload PDF"
        accept=".pdf,application/pdf"
        maxSizeInMB={10}
        onFileChange={(files) => console.log(files)}
      /> */}

      {/* <FileUpload
        variant="dropzone"
        size="lg"
        radius="lg"
        borderStyle="dotted"
        iconPlacement="left"
        iconSize="lg"
        colorScheme="light"
        padding="lg"
        customColors={{
          primary: "text-neutral-600",
          border: "border-neutral-700",`
          hover: "hover:bg-neutral-800",
        }}
        accept="image/*"
        maxSizeInMB={10}
        // onFileChange={(file) => console.log(file)}
        onFileChange={handleFileUpload}
      /> */}

      {/* Upload Status */}
      {/* {uploadStatus && (
        <div className="mt-6 w-full max-w-md">
          {uploadStatus === "uploading" && (
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-neutral-300">Uploading...</span>
                <span className="text-neutral-300">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {uploadStatus === "success" && (
            <div className="bg-green-900/30 border border-green-700 text-green-400 rounded-lg p-4">
              <p>Upload complete!</p>
              {uploadedUrl && (
                <p className="text-xs mt-1 text-green-500 truncate">
                  {uploadedUrl}
                </p>
              )}
            </div>
          )}
          
          {uploadStatus === "error" && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-lg p-4">
              <p>Upload failed. Please try again.</p>
            </div>
          )}
        </div>
      )} */}

      <FileUpload
        variant="multiple"
        title="Upload Multiple Files"
        size="lg"
        radius="lg"
        borderStyle="dotted"
        iconPlacement="top"
        iconSize="lg"
        colorScheme="light"
        padding="lg"
        customColors={{
          primary: "text-neutral-600",
          border: "border-neutral-700",
          hover: "hover:bg-neutral-800",
        }}
        accept="image/*,.pdf"
        maxSizeInMB={10}
        onFilesChange={handleFilesUpload}
      />
      
      {/* Upload Status */}
      {uploadStatus && (
        <div className="mt-6 w-full max-w-md">
          {uploadStatus === "uploading" && (
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-neutral-300">Uploading files...</span>
                <span className="text-neutral-300">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {(uploadStatus === "success" || uploadStatus === "partial") && (
            <div className={`${uploadStatus === "partial" ? "bg-yellow-900/30 border-yellow-700 text-yellow-400" : "bg-green-900/30 border-green-700 text-green-400"} border rounded-lg p-4`}>
              <p>{uploadStatus === "partial" 
                ? `Uploaded ${uploadResults.length} files (some failed)` 
                : "All files uploaded successfully!"}</p>
              
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
            <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-lg p-4">
              <p>Upload failed. Please try again.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
