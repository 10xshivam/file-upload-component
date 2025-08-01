/**
 * Mock file upload function that simulates uploading files to a server
 * @param file The file to upload
 * @param options Configuration options for the upload
 * @returns Promise with upload result
 */
export interface UploadOptions {
  /** Simulated delay in milliseconds */
  delay?: number;
  /** Callback for upload progress updates (0-100) */
  onProgress?: (progress: number) => void;
  /** Chance of upload failure (0-1) */
  failureChance?: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
}

export const uploadFile = async (
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  const { 
    delay = 2000, 
    onProgress, 
    failureChance = 0.1 
  } = options;
  
  // Validate input
  if (!file) {
    return {
      success: false,
      error: "No file provided",
      fileName: "",
      fileSize: 0,
      fileType: "",
      uploadedAt: new Date()
    };
  }
  
  // Mock progress updates
  const progressInterval = delay / 10;
  let progress = 0;
  
  const progressTimer = setInterval(() => {
    progress += 10;
    if (progress > 100) progress = 100;
    
    if (onProgress) {
      onProgress(progress);
    }
    
    if (progress >= 100) {
      clearInterval(progressTimer);
    }
  }, progressInterval);
  
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      clearInterval(progressTimer);
      
      // Simulate random failure
      if (Math.random() < failureChance) {
        resolve({
          success: false,
          error: "Upload failed. Please try again.",
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date()
        });
        return;
      }
      
      // Mock successful upload with a fake URL
      const mockUrl = `https://example.com/uploads/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      
      resolve({
        success: true,
        url: mockUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date()
      });
    }, delay);
  });
};

/**
 * Upload multiple files and return results for each
 */
export const uploadMultipleFiles = async (
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> => {
  const uploads = files.map(file => uploadFile(file, options));
  return Promise.all(uploads);
};