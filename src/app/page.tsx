"use client";
import { FileUpload } from "@/component/file-upload";
import React from "react";

export default function Home() {
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

      <FileUpload
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
          border: "border-neutral-700",
          hover: "hover:bg-neutral-800",
        }}
        accept="image/*"
        maxSizeInMB={10}
        onFileChange={(file) => console.log(file)}
      />
    </div>
  );
}
