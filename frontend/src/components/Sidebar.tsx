import { useState } from 'react';
import { useGalleryStore } from '../store/galleryStore';
import styles from './Sidebar.module.css';
import { Folder, FolderPlus, Grid, Heart, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const { folders, addFolder, currentFolder, setCurrentFolder, dragOverFolder } = useGalleryStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAdding(false);
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.section}>
        <h3 className={styles.title}>Library</h3>
        <button 
          className={`${styles.item} ${currentFolder === null ? styles.active : ''}`}
          onClick={() => setCurrentFolder(null)}
        >
          <Grid size={18} />
          <span>All Photos</span>
        </button>
        <button className={styles.item}>
          <Heart size={18} />
          <span>Favorites</span>
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.title}>Folders</h3>
          <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
            <FolderPlus size={18} />
          </button>
        </div>

        {isAdding && (
          <motion.div 
            className={styles.addInputWrap}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <input 
              autoFocus
              type="text" 
              placeholder="Folder name..." 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
              onBlur={() => !newFolderName && setIsAdding(false)}
            />
            <button onClick={handleAddFolder}><Plus size={16} /></button>
          </motion.div>
        )}

        <div className={styles.folderList}>
          {folders.map((folder) => (
            <button
              key={folder}
              className={`${styles.item} ${currentFolder === folder ? styles.active : ''} ${dragOverFolder === folder ? styles.dragOver : ''}`}
              onClick={() => setCurrentFolder(folder)}
              onDragOver={(e) => {
                e.preventDefault();
                useGalleryStore.getState().setDragOverFolder(folder);
              }}
              onDragLeave={() => useGalleryStore.getState().setDragOverFolder(null)}
              onDrop={async (e) => {
                e.preventDefault();
                const photoId = e.dataTransfer.getData('photoId');
                useGalleryStore.getState().setDragOverFolder(null);
                
                if (photoId) {
                  // We'll implement this service next
                  const { movePhoto } = await import('../services/uploadService');
                  const ok = await movePhoto(photoId, folder);
                  if (ok) {
                    // Refresh the gallery
                    window.location.reload(); // Simple refresh for now
                  }
                }
              }}
            >
              <Folder size={18} fill={currentFolder === folder ? 'currentColor' : 'none'} />
              <span>{folder}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
