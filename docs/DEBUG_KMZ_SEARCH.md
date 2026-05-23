# KMZ Search Debugging Guide

## Issue #8: Debug KMZ Search Feature Reliability

### Problem Overview

The KMZ search feature has potential reliability issues:
- Some searches return incomplete results
- Folder path traversal can timeout with deeply nested structures
- Google Drive API rate limits not handled
- Error handling is incomplete

### Root Cause Analysis

#### 1. **Unbounded Folder Path Traversal** (CRITICAL)

**File:** `components/google-drive/kmz-file-search.tsx` (lines 170-194)

**Issue:**
```typescript
// CURRENT (PROBLEMATIC)
const buildFolderPath = async (folderId: string): Promise<string[]> => {
  const path: string[] = []
  let currentId = folderId
  try {
    while (currentId) {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${currentId}?key=${driveService.apiKey}&fields=id,name,parents`
      )
      if (!response.ok) break
      const folderInfo = await response.json()
      path.unshift(folderInfo.name)
      currentId = folderInfo.parents?.[0] || null
      // ⚠️ Only prevents loops > 10 deep, but doesn't handle timeouts
      if (path.length > 10) break
    }
  } catch (error) {
    console.error("Error building folder path:", error)
  }
  return path
}
```

**Problems:**
- Sequential API calls cause exponential latency for deep folders
- No timeout protection per request
- Network failures kill the entire search
- No retry logic for transient failures

---

#### 2. **Inefficient Search Loop** (HIGH)

**File:** `components/google-drive/kmz-file-search.tsx` (lines 45-72)

**Issue:**
```typescript
// CURRENT - calls buildFolderPath for EACH file
for (const file of kmzFiles) {
  try {
    if (file.parents && file.parents.length > 0) {
      const parentId = file.parents[0]
      // ⚠️ Sequential fetch for every single file!
      const folderPath = await buildFolderPath(parentId)
      results.push({ file, folderPath, ... })
    }
  } catch (error) {
    // Falls back to 'Unknown' - hides real problems
    results.push({ file, folderPath: ["Unknown"], ... })
  }
}
```

**Problems:**
- O(n) sequential API calls where n = number of KMZ files
- 338 files = 338+ sequential requests (can exceed timeout)
- No batching or caching of folder information
- Progress indicator is fake (updates every 200ms, not actual progress)

---

#### 3. **Missing Google Drive API Rate Limiting**

**File:** `lib/google-drive/drive-service.ts` (lines 330-356)

**Issue:**
```typescript
// searchKMZFiles doesn't check for rate limit response
async searchKMZFiles(query?: string, folderId?: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    key: this._apiKey,
    q,
    fields: "files(...)",
    pageSize: "100", // Only requests 100, but doesn't paginate
  })
  const response = await this.fetchWithRetry(`${this.baseUrl}/files?${params}`)
  const data = await response.json()
  // ⚠️ No handling for 403 (rate limited) or 429 (quota exceeded)
  return data.files || []
}
```

**Problems:**
- Pagination not implemented (max 100 files per call)
- No exponential backoff for rate limits
- `fetchWithRetry` might not handle 429 status properly

---

#### 4. **Inadequate Error Recovery**

**File:** `components/google-drive/kmz-file-search.tsx` (lines 73-106)

**Issue:**
```typescript
// If folder path fails, silently adds "Unknown"
try {
  // get folder path
} catch (error) {
  console.error(...) // Only logged, doesn't retry
  results.push({
    file,
    folderPath: ["Unknown"],
    parentFolder: "Unknown",
    depth: 0, // Lost metadata
  })
}
```

---

## Solutions

### ✅ Fix #1: Add Folder Path Cache + Memoization

**Create:** `lib/google-drive/folder-cache.ts`

```typescript
import { LRUCache } from 'lru-cache';

interface CachedFolderPath {
  path: string[];
  timestamp: number;
}

class FolderPathCache {
  private cache: LRUCache<string, CachedFolderPath>;
  private readonly TTL = 3600000; // 1 hour

  constructor() {
    this.cache = new LRUCache<string, CachedFolderPath>({
      max: 1000, // Store up to 1000 folder paths
      ttl: this.TTL,
    });
  }

  get(folderId: string): string[] | null {
    const cached = this.cache.get(folderId);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.path;
    }
    this.cache.delete(folderId);
    return null;
  }

  set(folderId: string, path: string[]): void {
    this.cache.set(folderId, {
      path,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const folderPathCache = new FolderPathCache();
```

---

### ✅ Fix #2: Implement Robust Folder Path Traversal with Timeout

**Update:** `components/google-drive/kmz-file-search.tsx`

```typescript
import { folderPathCache } from '@/lib/google-drive/folder-cache';

const buildFolderPath = async (folderId: string, timeout = 5000): Promise<string[]> => {
  // Check cache first
  const cached = folderPathCache.get(folderId);
  if (cached) {
    console.log(`[v0] Folder path from cache for ${folderId}:`, cached);
    return cached;
  }

  const path: string[] = [];
  let currentId = folderId;
  const startTime = Date.now();

  try {
    while (currentId && path.length < 10) { // Max 10 levels
      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.warn(`[v0] Folder path timeout for ${folderId} after ${Date.now() - startTime}ms`);
        return path.length > 0 ? path : ["Root"];
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout - (Date.now() - startTime));

        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${currentId}?key=${driveService.apiKey}&fields=id,name,parents`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 403 || response.status === 429) {
            console.warn(`[v0] Rate limited or forbidden for folder ${currentId}`);
          }
          break;
        }

        const folderInfo = await response.json();
        path.unshift(folderInfo.name || "Unknown");
        currentId = folderInfo.parents?.[0] || null;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.warn(`[v0] Request timeout for folder ${currentId}`);
          break;
        }
        console.warn(`[v0] Error fetching folder info for ${currentId}:`, error);
        break;
      }
    }

    // Cache the result before returning
    if (path.length > 0) {
      folderPathCache.set(folderId, path);
    }

    return path.length > 0 ? path : ["Root"];
  } catch (error) {
    console.error("[v0] Error building folder path:", error);
    return ["Unknown"];
  }
};
```

---

### ✅ Fix #3: Batch Folder Path Requests with Concurrency Control

**Update:** `components/google-drive/kmz-file-search.tsx`

```typescript
const searchKMZFiles = async () => {
  if (!searchQuery.trim() && folderFilter === "all") return;

  setIsSearching(true);
  setSearchProgress(0);
  setSearchResults([]);

  try {
    const startTime = Date.now();
    
    // Search for KMZ files
    let searchQueryString = "";
    if (searchQuery.trim()) {
      searchQueryString = `name contains '${searchQuery}' and `;
    }
    searchQueryString += `(name contains '.kmz' or mimeType contains 'kmz') and trashed=false`;

    console.log(`[v0] Searching with query: ${searchQueryString}`);
    const kmzFiles = await driveService.searchFiles(searchQueryString);
    console.log(`[v0] Found ${kmzFiles.length} KMZ files in ${Date.now() - startTime}ms`);

    // Fetch folder paths with concurrency limit (max 5 concurrent requests)
    const results: KMZSearchResult[] = [];
    const CONCURRENCY = 5;
    const folderFetchQueue: Promise<void>[] = [];

    for (let i = 0; i < kmzFiles.length; i++) {
      const file = kmzFiles[i];

      // Update progress
      setSearchProgress(Math.round((i / kmzFiles.length) * 100));

      // Create concurrent fetch task
      const fetchTask = (async () => {
        try {
          if (file.parents && file.parents.length > 0) {
            const parentId = file.parents[0];
            const folderPath = await buildFolderPath(parentId, 3000); // 3s timeout

            results.push({
              file,
              folderPath,
              parentFolder: folderPath[folderPath.length - 1] || "Root",
              depth: folderPath.length,
            });
          } else {
            results.push({
              file,
              folderPath: ["Root"],
              parentFolder: "Root",
              depth: 0,
            });
          }
        } catch (error) {
          console.error(`[v0] Error processing file ${file.name}:`, error);
          results.push({
            file,
            folderPath: ["Error"],
            parentFolder: "Error",
            depth: 0,
          });
        }
      })();

      folderFetchQueue.push(fetchTask);

      // Control concurrency
      if (folderFetchQueue.length >= CONCURRENCY) {
        await Promise.race(folderFetchQueue);
        folderFetchQueue.splice(folderFetchQueue.findIndex(p => p === folderFetchQueue[0]), 1);
      }
    }

    // Wait for remaining tasks
    await Promise.all(folderFetchQueue);

    setSearchProgress(100);

    // Apply filters
    let filteredResults = results;
    if (folderFilter !== "all") {
      filteredResults = results.filter((r) =>
        r.parentFolder.toLowerCase().includes(folderFilter.toLowerCase())
      );
    }

    setSearchResults(filteredResults);
    console.log(`[v0] Search completed in ${Date.now() - startTime}ms with ${filteredResults.length} results`);

    setTimeout(() => {
      setSearchProgress(0);
      setIsSearching(false);
    }, 500);
  } catch (error) {
    console.error("[v0] Search error:", error);
    setIsSearching(false);
    setSearchProgress(0);
  }
};
```

---

### ✅ Fix #4: Add Rate Limit Handling to Drive Service

**Update:** `lib/google-drive/drive-service.ts`

```typescript
private async fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        const waitTime = Math.min(retryAfter * 1000, 30000); // Cap at 30s
        console.warn(`[v0] Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Handle quota exceeded
      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        if (data.error?.code === 403) {
          console.error("[v0] Google Drive API quota exceeded");
          throw new Error("API quota exceeded");
        }
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      const backoffMs = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.warn(`[v0] Fetch retry ${i + 1}/${retries} after ${backoffMs}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  throw new Error("Max retries exceeded");
}
```

---

## Testing Checklist

- [ ] Test with 10 KMZ files in nested folders (3+ levels deep)
- [ ] Test with 50+ KMZ files to verify concurrency control
- [ ] Test with 338 KMZ files (full dataset) - should complete in <30s
- [ ] Simulate Google Drive API rate limiting (429 response)
- [ ] Verify folder path caching works (2nd search should be instant)
- [ ] Test timeout behavior with slow network (DevTools throttling)
- [ ] Test with empty search results
- [ ] Test with invalid/deleted folder IDs

---

## Performance Targets

| Scenario | Current | Target |
|----------|---------|--------|
| 10 files search | ~5s | <1s |
| 50 files search | ~15s | <3s |
| 338 files search | Timeout | <10s |
| Cached search | Timeout | <100ms |
| Deep folder (10 levels) | ~2-5s | <500ms |

---

## Related Issues

- #8: Debug KMZ Search Feature Reliability
- #9: Optimize File/Image Upload Pipeline
