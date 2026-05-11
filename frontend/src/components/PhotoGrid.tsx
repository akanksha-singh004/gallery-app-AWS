import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { galleryApi, type Photo } from '../api/gallery';
import { useGalleryStore } from '../store/galleryStore';
import { deletePhoto } from '../services/uploadService';
import Lightbox from './Lightbox';
import styles from './PhotoGrid.module.css';
import { Heart, Trash2, CheckCircle } from 'lucide-react';

function SkeletonGrid() {
  return (
    <div className={styles.masonryGrid}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${styles.skeletonCard}`}
          style={{ height: [180, 240, 160, 220, 200, 180][i % 6] }}
        />
      ))}
    </div>
  );
}

export default function PhotoGrid() {
  const { sortBy, searchQuery, viewMode, isSelectMode, selectedIds, toggleSelect, favorites, toggleFavorite, currentFolder } =
    useGalleryStore();
  const qc = useQueryClient();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const { data: photos = [], isLoading, isError } = useQuery({
    queryKey: ['photos', sortBy, currentFolder],
    queryFn: () => galleryApi.listPhotos(sortBy, currentFolder).then((r) => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return photos.filter(
      (p) =>
        !q ||
        p.caption.toLowerCase().includes(q) ||
        p.photoId.toLowerCase().includes(q)
    );
  }, [photos, searchQuery]);

  if (isLoading) return <SkeletonGrid />;
  if (isError) return <div className={styles.empty}>Failed to load photos. Please refresh.</div>;
  if (filtered.length === 0)
    return (
      <motion.div
        className={styles.empty}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p>No photos yet.</p>
        <span>Drag & drop images or click Upload to get started</span>
      </motion.div>
    );

  const gridClass =
    viewMode === 'masonry'
      ? styles.masonryGrid
      : viewMode === 'grid'
      ? styles.uniformGrid
      : styles.largeGrid;

  return (
    <>
      <div className={gridClass}>
        <AnimatePresence>
          {filtered.map((photo, i) => (
            <PhotoCard
              key={photo.photoId}
              photo={photo}
              index={i}
              isSelected={selectedIds.has(photo.photoId)}
              isFavorite={favorites.has(photo.photoId)}
              isSelectMode={isSelectMode}
              onClick={() => {
                if (isSelectMode) toggleSelect(photo.photoId);
                else setLightboxIdx(i);
              }}
              onFavorite={() => toggleFavorite(photo.photoId)}
              onDelete={async () => {
                const ok = await deletePhoto(photo);
                if (ok) qc.invalidateQueries({ queryKey: ['photos', sortBy] });
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            photos={filtered}
            initialIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface CardProps {
  photo: Photo;
  index: number;
  isSelected: boolean;
  isFavorite: boolean;
  isSelectMode: boolean;
  onClick: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}

function PhotoCard({ photo, index, isSelected, isFavorite, isSelectMode, onClick, onFavorite, onDelete }: CardProps) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      draggable
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData('photoId', photo.photoId);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onClick}
    >
      <motion.div
        className={styles.motionWrap}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: Math.min(index * 0.04, 0.4) }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ y: -4 }}
      >
        {!loaded && <div className={`skeleton ${styles.imgPlaceholder}`} />}
        <img
          src={photo.thumbUrl}
          alt={photo.caption || 'Photo'}
          className={styles.img}
          style={{ opacity: loaded ? 1 : 0 }}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />

        <AnimatePresence>
          {(hovered || isSelectMode) && (
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isSelectMode ? (
                <div className={styles.checkWrap}>
                  {isSelected ? (
                    <CheckCircle size={28} fill="#6c63ff" color="#fff" />
                  ) : (
                    <div className={styles.emptyCheck} />
                  )}
                </div>
              ) : (
                <div className={styles.hoverActions}>
                  <button
                    className={`icon-btn ${isFavorite ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                  >
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className="icon-btn"
                    style={{ color: '#ff6b6b' }}
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
