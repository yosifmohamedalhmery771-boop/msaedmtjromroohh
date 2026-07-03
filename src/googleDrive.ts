/**
 * Utility functions for Google Drive API interaction
 */

/**
 * Extracts Google Drive folder ID from a link or returns it if it is already an ID.
 */
export function extractFolderId(linkOrId: string): string {
  if (!linkOrId) return '';
  // Match standard folder link: https://drive.google.com/drive/folders/FOLDER_ID
  const folderMatch = linkOrId.match(/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }
  // Match short/open links: https://drive.google.com/open?id=FOLDER_ID
  const openMatch = linkOrId.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (openMatch && openMatch[1]) {
    return openMatch[1];
  }
  return linkOrId.trim();
}

export interface DriveImage {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
}

/**
 * Fetches all images from a specific Google Drive folder.
 */
export async function fetchDriveImages(
  folderId: string, 
  tokenOrKey: string, 
  isApiKey: boolean = false
): Promise<DriveImage[]> {
  const cleanId = extractFolderId(folderId);
  if (!cleanId) return [];

  // Query files that are inside the folder, are images, and are not trashed
  const q = `'${cleanId}' in parents and mimeType contains 'image/' and trashed = false`;
  const fields = 'files(id, name, mimeType, thumbnailLink, webContentLink)';
  
  let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=100`;
  const headers: HeadersInit = {};

  if (isApiKey) {
    url += `&key=${tokenOrKey}`;
  } else {
    headers['Authorization'] = `Bearer ${tokenOrKey}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'فشل جلب الملفات من جوجل درايف. يرجى التحقق من صلاحيات المجلد والربط.');
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Downloads a Google Drive file as a Blob.
 */
async function downloadImageViaCanvas(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/jpeg', 0.95);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => {
      reject(new Error('Failed to load image via browser image engine'));
    };
    img.src = url;
  });
}

export async function downloadDriveFile(
  fileId: string, 
  tokenOrKey: string, 
  isApiKey: boolean = false,
  thumbnailLink?: string
): Promise<Blob> {
  // If we have a thumbnail link, download from the high-quality optimized CDN link!
  // This is 100x faster and completely bypasses API CORS / rate limits on web browsers.
  if (thumbnailLink) {
    let optimizedUrl = thumbnailLink;
    if (thumbnailLink.includes('=s')) {
      optimizedUrl = thumbnailLink.replace(/=s\d+$/, '=s1200');
    } else {
      optimizedUrl = `${thumbnailLink}=s1200`;
    }
    
    // Attempt high-speed canvas-based download first (bypasses CORS restrictions on fetch)
    try {
      return await downloadImageViaCanvas(optimizedUrl);
    } catch (e) {
      console.warn('Canvas download failed, trying direct fetch from optimized URL...', e);
      try {
        const response = await fetch(optimizedUrl);
        if (response.ok) {
          return await response.blob();
        }
      } catch (fe) {
        console.warn('Failed to fetch from optimized URL, falling back to standard API...', fe);
      }
    }
  }

  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const headers: HeadersInit = {};

  if (isApiKey) {
    url += `&key=${tokenOrKey}`;
  } else {
    headers['Authorization'] = `Bearer ${tokenOrKey}`;
  }
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error('Download error from standard API:', errText);
    throw new Error(`فشل تحميل الصورة من جوجل درايف: ${response.statusText || response.status}`);
  }

  return response.blob();
}

/**
 * Uploads an image file to a Google Drive folder.
 */
export async function uploadDriveFile(
  folderId: string,
  fileName: string,
  fileBlob: Blob,
  accessToken: string
): Promise<DriveImage> {
  const cleanId = extractFolderId(folderId);
  if (!cleanId) {
    throw new Error('معرف المجلد غير صالح.');
  }

  const boundary = 'um_ruha_multipart_boundary';
  
  const metadata = {
    name: fileName,
    parents: [cleanId],
  };

  // Convert blob to array buffer
  const fileReader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(fileBlob);
  });
  
  const fileBytes = await fileDataPromise;
  
  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaHeader = `--${boundary}\r\nContent-Type: ${fileBlob.type || 'image/jpeg'}\r\n\r\n`;
  const mediaFooter = `\r\n--${boundary}--`;
  
  const encoder = new TextEncoder();
  const metadataBuffer = encoder.encode(metadataPart);
  const mediaHeaderBuffer = encoder.encode(mediaHeader);
  const mediaFooterBuffer = encoder.encode(mediaFooter);
  
  const totalLength = metadataBuffer.byteLength + mediaHeaderBuffer.byteLength + fileBytes.byteLength + mediaFooterBuffer.byteLength;
  const requestBuffer = new Uint8Array(totalLength);
  
  let offset = 0;
  requestBuffer.set(metadataBuffer, offset);
  offset += metadataBuffer.byteLength;
  requestBuffer.set(mediaHeaderBuffer, offset);
  offset += mediaHeaderBuffer.byteLength;
  requestBuffer.set(new Uint8Array(fileBytes), offset);
  offset += fileBytes.byteLength;
  requestBuffer.set(mediaFooterBuffer, offset);
  
  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webContentLink';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: requestBuffer,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'فشل رفع الملف إلى جوجل درايف.');
  }

  return response.json();
}

/**
 * Renames a Google Drive file.
 */
export async function renameDriveFile(
  fileId: string, 
  newName: string, 
  accessToken: string
): Promise<DriveImage> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,thumbnailLink,webContentLink`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: newName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'فشل تعديل اسم الملف في جوجل درايف.');
  }

  return response.json();
}

/**
 * Deletes a Google Drive file.
 */
export async function deleteDriveFile(fileId: string, accessToken: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'فشل حذف الملف من جوجل درايف.');
  }
}
