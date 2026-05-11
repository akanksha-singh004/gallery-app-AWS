import { create } from 'zustand';

export type SortBy = 'uploadedAt' | 'size';
export type ViewMode = 'masonry' | 'grid' | 'large';
export type Theme = 'dark' | 'light';

export interface UploadItem {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface GalleryStore {
  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Gallery
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Selection
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  isSelectMode: boolean;
  setSelectMode: (v: boolean) => void;

  // Upload
  uploadQueue: UploadItem[];
  addToQueue: (items: UploadItem[]) => void;
  updateQueueItem: (id: string, patch: Partial<UploadItem>) => void;
  removeFromQueue: (id: string) => void;
  clearDoneUploads: () => void;

  // Favorites (client-side for now)
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;

  // Upload panel
  showUploadPanel: boolean;
  setShowUploadPanel: (v: boolean) => void;

  // Folders
  folders: string[];
  addFolder: (name: string) => void;
  currentFolder: string | null;
  setCurrentFolder: (folder: string | null) => void;
  dragOverFolder: string | null;
  setDragOverFolder: (folder: string | null) => void;
}

export const useGalleryStore = create<GalleryStore>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  sortBy: 'uploadedAt',
  setSortBy: (sort) => set({ sortBy: sort }),
  viewMode: 'masonry',
  setViewMode: (mode) => set({ viewMode: mode }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  selectedIds: new Set(),
  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selectedIds: next };
    }),
  clearSelection: () => set({ selectedIds: new Set() }),
  isSelectMode: false,
  setSelectMode: (v) => set({ isSelectMode: v }),

  uploadQueue: [],
  addToQueue: (items) => set((s) => ({ uploadQueue: [...s.uploadQueue, ...items] })),
  updateQueueItem: (id, patch) =>
    set((s) => ({
      uploadQueue: s.uploadQueue.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),
  removeFromQueue: (id) =>
    set((s) => ({ uploadQueue: s.uploadQueue.filter((u) => u.id !== id) })),
  clearDoneUploads: () =>
    set((s) => ({ uploadQueue: s.uploadQueue.filter((u) => u.status !== 'done') })),

  favorites: new Set(),
  toggleFavorite: (id) =>
    set((s) => {
      const next = new Set(s.favorites);
      next.has(id) ? next.delete(id) : next.add(id);
      return { favorites: next };
    }),

  showUploadPanel: false,
  setShowUploadPanel: (v) => set({ showUploadPanel: v }),

  folders: ['Vacation', 'Work', 'Family'],
  addFolder: (name) => set((s) => ({ folders: [...s.folders, name] })),
  currentFolder: null,
  setCurrentFolder: (folder) => set({ currentFolder: folder }),
  dragOverFolder: null,
  setDragOverFolder: (folder) => set({ dragOverFolder: folder }),
}));
