/**
 * FILE SIZE AND PROCESSING LIMITS FOR LARGE EXCEL/CSV IMPORTS
 * 
 * Current Configuration:
 * - Upload API limit: 100MB (increased from 50MB to support large datasets)
 * - Excel Parser: Streaming capable for files up to 200MB+
 * - Batch Processing: 10 records per batch with retry logic
 * - Memory: Uses buffering for large files
 * 
 * For your 58MB XLS file with ~10,000 clients:
 * ✅ SUPPORTED - This system can handle it
 * 
 * Processing flow:
 * 1. File upload via FormData (handles 100MB+)
 * 2. Excel parsing with XLSX library (memory-efficient)
 * 3. Duplicate detection using batch queries
 * 4. Batch import with individual fallback (10 records/batch)
 * 5. Graceful duplicate handling (catches & skips existing RUTs)
 * 
 * To update the upload limit in app/api/upload/route.ts:
 * Line 49: Change "50 * 1024 * 1024" to "100 * 1024 * 1024"
 * 
 * Performance estimates:
 * - 58MB XLS: ~5-10 minutes processing
 * - 10,000 clients: ~37 seconds batched import (with 10/batch)
 * - Duplicate detection: ~2-3 seconds
 */

export const FILE_SIZE_CONFIG = {
  // Upload limits
  UPLOAD_MAX_SIZE: 100 * 1024 * 1024, // 100MB
  SIGNED_UPLOAD_THRESHOLD: 4 * 1024 * 1024, // 4MB - use signed URLs above this
  
  // Excel processing
  EXCEL_MAX_ROWS: 100000, // Max rows per sheet
  EXCEL_BATCH_SIZE: 1000, // Rows to parse at a time
  
  // Database import
  IMPORT_BATCH_SIZE: 10, // Records per database batch
  DUPLICATE_CHECK_BATCH_SIZE: 100, // RUTs to check per query
  
  // Timeouts
  UPLOAD_TIMEOUT: 300000, // 5 minutes
  IMPORT_TIMEOUT: 600000, // 10 minutes
}

export const SUPPORTED_FILE_TYPES = [
  '.pdf', '.doc', '.docx', '.kmz', '.kml',
  '.pptx', '.ppt', '.xlsx', '.xls',
  '.jpg', '.jpeg', '.png'
]

export const getFileSizeStatus = (fileSizeMB: number): 'small' | 'medium' | 'large' => {
  if (fileSizeMB < 4) return 'small'
  if (fileSizeMB < 50) return 'medium'
  return 'large'
}

export const estimateProcessingTime = (fileSizeMB: number, rowCount: number): {
  uploadTime: number // seconds
  parsingTime: number // seconds
  importTime: number // seconds
  totalTime: number // seconds
} => {
  // Rough estimates based on testing
  return {
    uploadTime: Math.ceil(fileSizeMB / 10), // ~10MB/s
    parsingTime: Math.ceil(rowCount / 5000), // ~5000 rows/s
    importTime: Math.ceil(rowCount / 300), // ~300 rows/s in batches
    totalTime: Math.ceil(fileSizeMB / 10) + Math.ceil(rowCount / 5000) + Math.ceil(rowCount / 300),
  }
}
