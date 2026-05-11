import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Trash2, Heart, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, RotateCw, Info, Share2
} from 'lucide-react';
import type { Photo } from '../api/gallery';
import { deletePhoto, downloadPhoto } from '../services/uploadService';
import { useGalleryStore } from '../store/galleryStore';
import { useQueryClient } from '@tanstack/react-query';
import styles from './Lightbox.module.css';

interface Props {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function Lightbox({ photos, initialIndex, onClose }: Props) {
  const [idx, setIdx] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { favorites, toggleFavorite, sortBy } = useGalleryStore();
  const qc = useQueryClient();
  const photo = photos[idx];

  const prev = useCallback(() => { setIdx((i) => Math.max(0, i - 1)); setZoom(1); setRotation(0); setLoaded(false); }, []);
  const next = useCallback(() => { setIdx((i) => Math.min(photos.length - 1, i + 1)); setZoom(1); setRotation(0); setLoaded(false); }, [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === '+') setZoom((z) => Math.min(z + 0.25, 3));
      if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 0.5));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  const handleDelete = async () => {
    const ok = await deletePhoto(photo);
    if (ok) {
      qc.invalidateQueries({ queryKey: ['photos', sortBy] });
      if (photos.length <= 1) onClose();
      else if (idx >= photos.length - 1) setIdx(idx - 1);
    }
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Toolbar */}
      <motion.div
        className={styles.toolbar}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.counter}>{idx + 1} / {photos.length}</span>
        <div className={styles.actions}>
          <button className="icon-btn" onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} title="Zoom in"><ZoomIn size={18} /></button>
          <button className="icon-btn" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} title="Zoom out"><ZoomOut size={18} /></button>
          <button className="icon-btn" onClick={() => setRotation((r) => r + 90)} title="Rotate"><RotateCw size={18} /></button>
          <button className={`icon-btn ${favorites.has(photo.photoId) ? 'active' : ''}`} onClick={() => toggleFavorite(photo.photoId)} title="Favorite"><Heart size={18} fill={favorites.has(photo.photoId) ? 'currentColor' : 'none'} /></button>
          <button className="icon-btn" onClick={() => setShowInfo((v) => !v)} title="Info"><Info size={18} /></button>
          <button className="icon-btn" onClick={() => downloadPhoto(photo)} title="Download"><Download size={18} /></button>
          <button className="icon-btn btn-danger" onClick={handleDelete} title="Delete"><Trash2 size={18} /></button>
          <button className="icon-btn" onClick={onClose} title="Close"><X size={18} /></button>
        </div>
      </motion.div>

      {/* Nav buttons */}
      {idx > 0 && (
        <button className={`${styles.nav} ${styles.navLeft}`} onClick={(e) => { e.stopPropagation(); prev(); }}>
          <ChevronLeft size={28} />
        </button>
      )}
      {idx < photos.length - 1 && (
        <button className={`${styles.nav} ${styles.navRight}`} onClick={(e) => { e.stopPropagation(); next(); }}>
          <ChevronRight size={28} />
        </button>
      )}

      {/* Image */}
      <motion.div
        className={styles.imgWrap}
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
      >
        {!loaded && <div className={`skeleton ${styles.placeholder}`} />}
        <img
          src={photo.thumbUrl}
          alt={photo.caption}
          className={styles.img}
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
        />
      </motion.div>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            className={`${styles.info} glass`}
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Photo Details</h3>
            {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
            <div className={styles.meta}>
              <div className={styles.metaRow}><span>Size</span><span>{formatBytes(photo.size)}</span></div>
              <div className={styles.metaRow}><span>Resolution</span><span>{photo.width} × {photo.height}</span></div>
              <div className={styles.metaRow}><span>Uploaded</span><span>{new Date(photo.uploadedAt).toLocaleDateString()}</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
