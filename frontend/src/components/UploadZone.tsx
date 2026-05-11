import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImagePlus } from 'lucide-react';
import { uploadFiles } from '../services/uploadService';
import styles from './UploadZone.module.css';

const ACCEPT = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'] };

export default function UploadZone() {
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length) uploadFiles(accepted);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPT,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <>
      {/* Full-page drop overlay */}
      <div {...getRootProps()} className={styles.overlay} style={{ pointerEvents: isDragActive ? 'auto' : 'none' }}>
        <input {...getInputProps()} />
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              className={styles.dropIndicator}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Upload size={64} strokeWidth={1} />
              <p>Drop photos here</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating upload button */}
      <motion.button
        className={styles.fab}
        onClick={open}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="Upload photos"
      >
        <ImagePlus size={22} />
        <span>Upload</span>
      </motion.button>
    </>
  );
}
