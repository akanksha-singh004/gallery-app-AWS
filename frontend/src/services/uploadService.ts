import { galleryApi, type Photo } from '../api/gallery';
import { useGalleryStore } from '../store/galleryStore';
import { nanoid } from '../utils/nanoid';
import toast from 'react-hot-toast';

export async function uploadFiles(files: File[]) {
  const store = useGalleryStore.getState();

  const items = files.map((file) => ({
    id: nanoid(),
    file,
    preview: URL.createObjectURL(file),
    progress: 0,
    status: 'pending' as const,
  }));

  store.addToQueue(items);
  store.setShowUploadPanel(true);

  await Promise.all(
    items.map(async (item) => {
      try {
        store.updateQueueItem(item.id, { status: 'uploading' });

        // 1. Get pre-signed upload URL
        const { data } = await galleryApi.getUploadUrl(item.file.name, item.file.type);

        // 2. Upload directly to S3 with progress tracking
        await uploadToS3(data.url, item.file, (progress) => {
          store.updateQueueItem(item.id, { progress });
        });

        // 3. Get image dimensions
        const { width, height } = await getImageDimensions(item.file);

        // 4. Confirm upload in DynamoDB
        await galleryApi.confirmUpload(data.key, '', item.file.size, width, height, store.currentFolder);

        store.updateQueueItem(item.id, { status: 'done', progress: 100 });
        toast.success(`${item.file.name} uploaded!`);
      } catch (err) {
        store.updateQueueItem(item.id, {
          status: 'error',
          error: 'Upload failed. Tap to retry.',
        });
        toast.error(`Failed to upload ${item.file.name}`);
      }
    })
  );
}

async function uploadToS3(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error(xhr.statusText)));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(file);
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
}

export async function deletePhoto(photo: Photo): Promise<boolean> {
  try {
    await galleryApi.deletePhoto(photo.photoId);
    toast.success('Photo deleted');
    return true;
  } catch {
    toast.error('Failed to delete photo');
    return false;
  }
}

export async function downloadPhoto(photo: Photo) {
  try {
    const { data } = await galleryApi.getDownloadUrl(photo.photoId);
    const a = document.createElement('a');
    a.href = data.url;
    a.download = photo.photoId.split('/').pop() || 'photo.jpg';
    a.click();
  } catch {
    toast.error('Failed to get download link');
  }
}

export async function movePhoto(photoId: string, folder: string): Promise<boolean> {
  try {
    await galleryApi.movePhoto(photoId, folder);
    toast.success(`Moved to ${folder}`);
    return true;
  } catch {
    toast.error('Failed to move photo');
    return false;
  }
}
