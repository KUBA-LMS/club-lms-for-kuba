import api from './api';

/**
 * Upload a local image URI to the server and return the public HTTPS URL.
 * Handles file:// URIs from ImagePicker.
 */
export async function uploadImage(uri: string): Promise<string> {
  const filename = uri.split('/').pop() || 'photo.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri, name: filename, type: mimeType } as any);

  const response = await api.post<{ url: string }>('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.url;
}
