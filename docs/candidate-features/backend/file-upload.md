# File Upload System

## Overview

Comprehensive file upload system with multi-provider cloud storage support, image processing, and secure access control for modern web applications.

## Priority

**MEDIUM-HIGH** - Essential for applications requiring file handling

## Dependencies

- `apollo-server` (for GraphQL file upload resolvers)
- `vite` (for frontend upload components)
- `prisma` (optional, for file metadata storage)

## Feature Description

Complete file upload infrastructure supporting local storage, cloud providers (AWS S3, Google Cloud, Cloudinary), with image processing, validation, and security features.

### Key Features

- **Multi-Provider Support**: Local, AWS S3, Google Cloud Storage, Cloudinary
- **Image Processing**: Resize, crop, format conversion, optimization
- **File Validation**: Type, size, format, and security validation
- **Progress Tracking**: Upload progress monitoring
- **Secure Access**: Pre-signed URLs, access control, virus scanning
- **Metadata Management**: File information storage and retrieval

## Configuration

```typescript
interface FileUploadConfig {
  providers: {
    local?: {
      enabled: boolean
      uploadPath: string
      publicUrl: string
    }
    s3?: {
      enabled: boolean
      bucket: string
      region: string
      accessKeyId: string
      secretAccessKey: string
      cloudFront?: string
    }
    gcs?: {
      enabled: boolean
      bucket: string
      keyFile: string
      projectId: string
    }
    cloudinary?: {
      enabled: boolean
      cloudName: string
      apiKey: string
      apiSecret: string
    }
  }
  validation: {
    maxFileSize: string // e.g., '10MB'
    allowedTypes: string[] // e.g., ['image/*', 'application/pdf']
    allowedExtensions: string[]
    virusScanning: boolean
  }
  imageProcessing: {
    enabled: boolean
    formats: ('webp' | 'avif' | 'jpg' | 'png')[]
    quality: number
    sizes: Array<{
      name: string
      width: number
      height?: number
    }>
  }
  security: {
    signedUrls: boolean
    urlExpiration: number // seconds
    accessControl: boolean
    encryptFiles: boolean
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── upload/
│   ├── index.ts                  # Upload exports
│   ├── providers/
│   │   ├── local.ts              # Local file storage
│   │   ├── s3.ts                 # AWS S3 provider
│   │   ├── gcs.ts                # Google Cloud Storage
│   │   └── cloudinary.ts         # Cloudinary provider
│   ├── services/
│   │   ├── uploadService.ts      # Main upload service
│   │   ├── imageProcessor.ts     # Image processing service
│   │   ├── validator.ts          # File validation
│   │   └── virusScanner.ts       # Virus scanning service
│   ├── resolvers/
│   │   ├── uploadResolvers.ts    # GraphQL upload resolvers
│   │   └── fileResolvers.ts      # File management resolvers
│   ├── middleware/
│   │   ├── uploadMiddleware.ts   # Express upload middleware
│   │   └── authMiddleware.ts     # Upload authorization
│   └── types.ts                  # Upload type definitions
```

### Frontend Implementation

```
web/src/
├── upload/
│   ├── index.ts                  # Upload exports
│   ├── components/
│   │   ├── FileUpload.tsx        # Main upload component
│   │   ├── ImageUpload.tsx       # Image-specific upload
│   │   ├── DropZone.tsx          # Drag & drop zone
│   │   ├── ProgressBar.tsx       # Upload progress
│   │   ├── FilePreview.tsx       # File preview component
│   │   └── FileManager.tsx       # File management UI
│   ├── hooks/
│   │   ├── useFileUpload.ts      # File upload hook
│   │   ├── useImageUpload.ts     # Image upload hook
│   │   └── useFileManager.ts     # File management hook
│   ├── services/
│   │   ├── uploadService.ts      # Upload API service
│   │   └── imageService.ts       # Image processing service
│   └── utils/
│       ├── fileValidation.ts     # Client-side validation
│       ├── imageUtils.ts         # Image utilities
│       └── uploadUtils.ts        # Upload utilities
```

## Code Examples

### Upload Service (Backend)

```typescript
// api/src/upload/services/uploadService.ts
import { FileUpload } from 'graphql-upload'
import { S3Provider } from '../providers/s3'
import { CloudinaryProvider } from '../providers/cloudinary'
import { ImageProcessor } from './imageProcessor'
import { FileValidator } from './validator'

export class UploadService {
  private providers: Map<string, any> = new Map()
  private imageProcessor: ImageProcessor
  private validator: FileValidator

  constructor(private config: FileUploadConfig) {
    this.imageProcessor = new ImageProcessor(config.imageProcessing)
    this.validator = new FileValidator(config.validation)
    this.initializeProviders()
  }

  private initializeProviders() {
    if (this.config.providers.s3?.enabled) {
      this.providers.set('s3', new S3Provider(this.config.providers.s3))
    }
    if (this.config.providers.cloudinary?.enabled) {
      this.providers.set('cloudinary', new CloudinaryProvider(this.config.providers.cloudinary))
    }
    // Add other providers...
  }

  async uploadFile(file: FileUpload, options: UploadOptions = {}): Promise<UploadResult> {
    const { createReadStream, filename, mimetype, encoding } = await file

    // Validate file
    const validation = await this.validator.validate({
      filename,
      mimetype,
      size: options.size,
    })

    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
    }

    const stream = createReadStream()
    const provider = this.getProvider(options.provider || 's3')

    try {
      // Process image if needed
      let processedStream = stream
      if (this.isImage(mimetype) && this.config.imageProcessing.enabled) {
        processedStream = await this.imageProcessor.process(stream, options.imageOptions)
      }

      // Upload to provider
      const result = await provider.upload({
        stream: processedStream,
        filename,
        mimetype,
        path: options.path || 'uploads',
      })

      // Store metadata if Prisma is available
      if (this.prisma) {
        await this.storeFileMetadata({
          filename: result.filename,
          originalName: filename,
          mimetype,
          size: result.size,
          url: result.url,
          provider: options.provider || 's3',
          uploadedBy: options.userId,
        })
      }

      return result
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
  }

  async uploadMultiple(files: FileUpload[], options: UploadOptions = {}): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options))
    return Promise.all(uploadPromises)
  }

  async deleteFile(fileId: string, userId?: string): Promise<boolean> {
    const file = await this.getFileMetadata(fileId)
    if (!file) throw new Error('File not found')

    // Check permissions
    if (userId && file.uploadedBy !== userId) {
      throw new Error('Insufficient permissions')
    }

    const provider = this.getProvider(file.provider)
    await provider.delete(file.filename)

    // Remove from database
    if (this.prisma) {
      await this.prisma.file.delete({ where: { id: fileId } })
    }

    return true
  }

  async getSignedUrl(fileId: string, expirationTime = 3600): Promise<string> {
    const file = await this.getFileMetadata(fileId)
    if (!file) throw new Error('File not found')

    const provider = this.getProvider(file.provider)
    return provider.getSignedUrl(file.filename, expirationTime)
  }

  private getProvider(providerName: string) {
    const provider = this.providers.get(providerName)
    if (!provider) throw new Error(`Provider ${providerName} not configured`)
    return provider
  }

  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/')
  }

  private async storeFileMetadata(metadata: any) {
    return this.prisma.file.create({ data: metadata })
  }

  private async getFileMetadata(fileId: string) {
    return this.prisma.file.findUnique({ where: { id: fileId } })
  }
}

interface UploadOptions {
  provider?: string
  path?: string
  userId?: string
  size?: number
  imageOptions?: ImageProcessingOptions
}

interface UploadResult {
  id: string
  filename: string
  url: string
  size: number
  mimetype: string
}

interface ImageProcessingOptions {
  resize?: { width: number; height?: number }
  format?: 'webp' | 'avif' | 'jpg' | 'png'
  quality?: number
}
```

### S3 Provider Implementation

```typescript
// api/src/upload/providers/s3.ts
import AWS from 'aws-sdk'
import { v4 as uuid } from 'uuid'

export class S3Provider {
  private s3: AWS.S3

  constructor(private config: S3Config) {
    this.s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
    })
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const key = `${options.path}/${uuid()}-${options.filename}`

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.config.bucket,
      Key: key,
      Body: options.stream,
      ContentType: options.mimetype,
      ACL: 'private', // Use signed URLs for access
    }

    try {
      const result = await this.s3.upload(uploadParams).promise()

      return {
        id: key,
        filename: key,
        url: this.config.cloudFront ? `${this.config.cloudFront}/${key}` : result.Location,
        size: 0, // Would need to track this separately
        mimetype: options.mimetype,
      }
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`)
    }
  }

  async delete(filename: string): Promise<void> {
    const deleteParams: AWS.S3.DeleteObjectRequest = {
      Bucket: this.config.bucket,
      Key: filename,
    }

    try {
      await this.s3.deleteObject(deleteParams).promise()
    } catch (error) {
      throw new Error(`S3 delete failed: ${error.message}`)
    }
  }

  async getSignedUrl(filename: string, expirationTime = 3600): Promise<string> {
    const params = {
      Bucket: this.config.bucket,
      Key: filename,
      Expires: expirationTime,
    }

    return this.s3.getSignedUrl('getObject', params)
  }

  async exists(filename: string): Promise<boolean> {
    try {
      await this.s3
        .headObject({
          Bucket: this.config.bucket,
          Key: filename,
        })
        .promise()
      return true
    } catch (error) {
      if (error.statusCode === 404) return false
      throw error
    }
  }
}

interface S3Config {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  cloudFront?: string
}
```

### React Upload Component

```typescript
// web/src/upload/components/FileUpload.tsx
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFileUpload } from '../hooks/useFileUpload'
import { ProgressBar } from './ProgressBar'
import { FilePreview } from './FilePreview'

interface FileUploadProps {
  accept?: string[]
  maxSize?: number
  multiple?: boolean
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
  className?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = [],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  onUploadComplete,
  onUploadError,
  className,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const { uploadFiles, progress, isUploading, error } = useFileUpload()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const results = await uploadFiles(acceptedFiles, {
        onProgress: (progress) => {
          // Progress is handled by the hook
        },
      })

      setUploadedFiles(prev => [...prev, ...results])
      onUploadComplete?.(results)
    } catch (error) {
      onUploadError?.(error as Error)
    }
  }, [uploadFiles, onUploadComplete, onUploadError])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as any),
    maxSize,
    multiple,
    disabled: isUploading,
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={`upload-container ${className}`}>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />

        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <p>Drag & drop files here, or click to select files</p>
            <p className="upload-hint">
              {accept.length > 0 && `Supported formats: ${accept.join(', ')}`}
              {maxSize && ` • Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="upload-progress">
          <ProgressBar progress={progress} />
          <p>Uploading files...</p>
        </div>
      )}

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="upload-errors">
          <h4>Some files were rejected:</h4>
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="error-item">
              <p>{file.name}</p>
              <ul>
                {errors.map(e => (
                  <li key={e.code}>{e.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Upload Error */}
      {error && (
        <div className="upload-error">
          <p>Upload failed: {error.message}</p>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Files</h4>
          {uploadedFiles.map((file, index) => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface UploadedFile {
  id: string
  name: string
  url: string
  size: number
  type: string
}
```

### File Upload Hook

```typescript
// web/src/upload/hooks/useFileUpload.ts
import { useState, useCallback } from 'react'
import { uploadService } from '../services/uploadService'

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const uploadFiles = useCallback(async (files: File[], options?: UploadOptions) => {
    setIsUploading(true)
    setError(null)
    setProgress(0)

    try {
      const results = await uploadService.uploadMultiple(files, {
        ...options,
        onProgress: progressEvent => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setProgress(percentCompleted)
          options?.onProgress?.(progressEvent)
        },
      })

      setProgress(100)
      return results
    } catch (error) {
      setError(error as Error)
      throw error
    } finally {
      setIsUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [])

  const uploadSingleFile = useCallback(
    async (file: File, options?: UploadOptions) => {
      const results = await uploadFiles([file], options)
      return results[0]
    },
    [uploadFiles],
  )

  return {
    uploadFiles,
    uploadSingleFile,
    isUploading,
    progress,
    error,
  }
}

interface UploadOptions {
  path?: string
  provider?: string
  onProgress?: (progressEvent: any) => void
}
```

### GraphQL Upload Resolvers

```typescript
// api/src/upload/resolvers/uploadResolvers.ts
import { GraphQLUpload } from 'graphql-upload'
import { UploadService } from '../services/uploadService'
import { requireAuth } from '../../auth/middleware'

const uploadService = new UploadService()

export const uploadResolvers = {
  Upload: GraphQLUpload,

  Mutation: {
    uploadFile: requireAuth(async (parent: any, { file }: { file: any }, context: any) => {
      const result = await uploadService.uploadFile(file, {
        userId: context.user.id,
        provider: 's3',
      })

      return {
        id: result.id,
        filename: result.filename,
        url: result.url,
        size: result.size,
        mimetype: result.mimetype,
      }
    }),

    uploadFiles: requireAuth(async (parent: any, { files }: { files: any[] }, context: any) => {
      const results = await uploadService.uploadMultiple(files, {
        userId: context.user.id,
        provider: 's3',
      })

      return results.map(result => ({
        id: result.id,
        filename: result.filename,
        url: result.url,
        size: result.size,
        mimetype: result.mimetype,
      }))
    }),

    deleteFile: requireAuth(async (parent: any, { fileId }: { fileId: string }, context: any) => {
      await uploadService.deleteFile(fileId, context.user.id)
      return { success: true }
    }),
  },

  Query: {
    getSignedUrl: requireAuth(async (parent: any, { fileId }: { fileId: string }, context: any) => {
      const url = await uploadService.getSignedUrl(fileId)
      return { url }
    }),

    myFiles: requireAuth(async (parent: any, args: any, context: any) => {
      // Implementation would fetch user's files from database
      return []
    }),
  },
}
```

## Database Schema

```prisma
// Add to schema.prisma
model File {
  id           String   @id @default(cuid())
  filename     String
  originalName String
  mimetype     String
  size         Int
  url          String
  provider     String   // 'local', 's3', 'gcs', 'cloudinary'
  path         String?  // Storage path
  uploadedBy   String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  uploader User? @relation(fields: [uploadedBy], references: [id], onDelete: SetNull)

  @@map("files")
}

// Extend User model
model User {
  id    String @id @default(cuid())
  files File[]
  // ... other user fields
}
```

## Installation Steps

1. **Install Upload Dependencies**

   ```bash
   # Backend
   pnpm add graphql-upload multer sharp aws-sdk @google-cloud/storage cloudinary
   pnpm add -D @types/multer

   # Frontend
   pnpm add react-dropzone axios
   ```

2. **Configure Environment Variables**

   ```env
   # AWS S3
   AWS_S3_BUCKET=your-bucket-name
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   AWS_CLOUDFRONT_URL=https://your-distribution.cloudfront.net

   # Google Cloud Storage
   GCS_BUCKET=your-gcs-bucket
   GCS_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

3. **Database Migration**
   ```bash
   pnpm prisma migrate dev --name add-file-uploads
   ```

This file upload system provides enterprise-grade file handling with multi-cloud support, image processing, and comprehensive security features.
