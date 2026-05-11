import { signOut } from 'aws-amplify/auth';
import { motion } from 'framer-motion';
import {
  Camera, Search, Sun, Moon, Grid, LayoutGrid, Maximize2,
  CheckSquare, X, Trash2, LogOut
} from 'lucide-react';
import { useGalleryStore, type SortBy } from '../store/galleryStore';
import { useQueryClient } from '@tanstack/react-query';
import { deletePhoto } from '../services/uploadService';
import { galleryApi } from '../api/gallery';
import styles from './Topbar.module.css';

export default function Topbar() {
  const {
    theme, toggleTheme,
    sortBy, setSortBy,
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    isSelectMode, setSelectMode,
    selectedIds, clearSelection,
  } = useGalleryStore();
  const qc = useQueryClient();

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const photos = await galleryApi.listPhotos(sortBy).then(r => r.data);
    await Promise.all(
      ids.map(id => {
        const p = photos.find(ph => ph.photoId === id);
        return p ? deletePhoto(p) : Promise.resolve();
      })
    );
    clearSelection();
    setSelectMode(false);
    qc.invalidateQueries({ queryKey: ['photos'] });
  };

  return (
    <motion.header
      className={`${styles.topbar} glass`}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Brand */}
      <div className={styles.brand}>
        <Camera size={22} strokeWidth={1.5} />
        <span className="gradient-text">Luminary</span>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.search}
          placeholder="Search photos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Sort */}
        <select
          className={`${styles.select} input`}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
        >
          <option value="uploadedAt">Newest first</option>
          <option value="size">Largest first</option>
        </select>

        {/* View modes */}
        <button className={`icon-btn ${viewMode === 'masonry' ? 'active' : ''}`} onClick={() => setViewMode('masonry')} title="Masonry"><LayoutGrid size={17} /></button>
        <button className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid"><Grid size={17} /></button>
        <button className={`icon-btn ${viewMode === 'large' ? 'active' : ''}`} onClick={() => setViewMode('large')} title="Large"><Maximize2 size={17} /></button>

        {/* Select mode */}
        {isSelectMode ? (
          <>
            {selectedIds.size > 0 && (
              <button className="btn btn-danger" onClick={handleBulkDelete} style={{ padding: '8px 14px', fontSize: 13 }}>
                <Trash2 size={15} /> Delete ({selectedIds.size})
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => { setSelectMode(false); clearSelection(); }} style={{ padding: '8px 14px', fontSize: 13 }}>
              <X size={15} /> Cancel
            </button>
          </>
        ) : (
          <button className="icon-btn" onClick={() => setSelectMode(true)} title="Multi-select"><CheckSquare size={17} /></button>
        )}

        {/* Theme */}
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Logout */}
        <button className="icon-btn" onClick={() => signOut()} title="Sign out"><LogOut size={17} /></button>
      </div>
    </motion.header>
  );
}
