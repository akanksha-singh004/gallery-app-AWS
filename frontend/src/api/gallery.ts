import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

API.interceptors.request.use(async (config) => {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Photo {
  photoId: string;
  caption: string;
  size: number;
  width: number;
  height: number;
  uploadedAt: number;
  thumbUrl: string;
  isFavorite?: boolean;
}

export const galleryApi = {
  getUploadUrl: (fileName: string, contentType: string) =>
    API.post<{ url: string; key: string }>('/upload-url', { fileName, contentType }),

  confirmUpload: (key: string, caption: string, size: number, width: number, height: number, folder?: string | null) =>
    API.post('/confirm-upload', { key, caption, size, width, height, folder }),

  listPhotos: (sortBy: 'uploadedAt' | 'size' = 'uploadedAt', folder?: string | null) =>
    API.get<Photo[]>('/photos', { params: { sortBy, folder } }),

  deletePhoto: (photoId: string) =>
    API.delete(`/photos/${encodeURIComponent(photoId)}`),

  getDownloadUrl: (photoId: string) =>
    API.get<{ url: string }>(`/photos/${encodeURIComponent(photoId)}/download`),

  movePhoto: (photoId: string, folder: string) =>
    API.patch('/photos/move', { photoId, folder }),
};
