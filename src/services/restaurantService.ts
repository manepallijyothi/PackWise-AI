import { RestaurantUploadItem, RestaurantUploadCategory } from '../types/restaurant';

export async function fetchRestaurantUploads(): Promise<RestaurantUploadItem[]> {
  try {
    const res = await fetch('/api/restaurant/uploads');
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (err) {
    console.warn('Failed to fetch restaurant uploads:', err);
  }
  return [];
}

export async function uploadRestaurantFile(
  file: File,
  category: RestaurantUploadCategory,
  userId?: string,
  notes?: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; item?: RestaurantUploadItem; error?: string }> {
  // Frontend Validation
  const maxBytes = 15 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      success: false,
      error: `File size exceeds the 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
    };
  }

  const allowedExtensions = [
    'jpg', 'jpeg', 'png', 'webp', 'gif',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'
  ];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(ext)) {
    return {
      success: false,
      error: `Unsupported file type ".${ext}". Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, CSV.`
    };
  }

  if (onProgress) onProgress(20);

  // Convert to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  if (onProgress) onProgress(60);

  try {
    const res = await fetch('/api/restaurant/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || `application/${ext}`,
        fileSize: file.size,
        category,
        base64Data,
        userId: userId || 'restaurant-operator',
        notes
      })
    });

    if (onProgress) onProgress(90);

    const json = await res.json();
    if (res.ok && json.success) {
      if (onProgress) onProgress(100);
      return { success: true, item: json.item };
    } else {
      return { success: false, error: json.error || 'Upload failed.' };
    }
  } catch (err: any) {
    return { success: false, error: 'Network error while uploading file. Please try again.' };
  }
}

export async function deleteRestaurantUpload(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/restaurant/uploads/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to delete upload:', err);
    return false;
  }
}

export async function analyzeRestaurantUpload(
  uploadId: string,
  dishName?: string,
  notes?: string,
  packingTemp?: number
): Promise<{ success: boolean; analysis?: any; error?: string }> {
  try {
    const res = await fetch('/api/restaurant/analyze-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        dishName,
        notes,
        packingTemp
      })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, analysis: json.analysis };
    }
    return { success: false, error: json.error || 'Failed to analyze upload.' };
  } catch (err: any) {
    return { success: false, error: 'Network error analyzing item.' };
  }
}
