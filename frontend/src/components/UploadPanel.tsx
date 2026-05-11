import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useGalleryStore } from '../store/galleryStore';
import styles from './UploadPanel.module.css';

export default function UploadPanel() {
  const { uploadQueue, removeFromQueue, clearDoneUploads, showUploadPanel, setShowUploadPanel } =
    useGalleryStore();

  if (!showUploadPanel || uploadQueue.length === 0) return null;

  const done = uploadQueue.filter((u) => u.status === 'done').length;
  const total = uploadQueue.length;

  return (
    <motion.div
      className={`${styles.panel} glass`}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40 }}
    >
      <div className={styles.header}>
        <span className={styles.title}>Uploading {done}/{total}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {done > 0 && (
            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }} onClick={clearDoneUploads}>
              Clear done
            </button>
          )}
          <button className="icon-btn" onClick={() => setShowUploadPanel(false)}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className={styles.list}>
        <AnimatePresence>
          {uploadQueue.map((item) => (
            <motion.div
              key={item.id}
              className={styles.item}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <img src={item.preview} className={styles.thumb} alt="" />
              <div className={styles.info}>
                <span className={styles.name}>{item.file.name}</span>
                {item.status === 'uploading' && (
                  <div className={styles.bar}>
                    <div className={styles.fill} style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                {item.status === 'error' && (
                  <span className={styles.err}>{item.error}</span>
                )}
              </div>
              <div className={styles.icon}>
                {item.status === 'uploading' && <Loader2 size={18} className={styles.spin} />}
                {item.status === 'done' && <CheckCircle size={18} color="#00d4ff" />}
                {item.status === 'error' && <AlertCircle size={18} color="#ff6b6b" />}
                {item.status !== 'uploading' && (
                  <button className={styles.del} onClick={() => removeFromQueue(item.id)}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
