import { useAuthenticator } from '@aws-amplify/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import PhotoGrid from '../components/PhotoGrid';
import UploadZone from '../components/UploadZone';
import UploadPanel from '../components/UploadPanel';
import { useGalleryStore } from '../store/galleryStore';
import styles from './GalleryPage.module.css';

const qc = new QueryClient();

export default function GalleryPage() {
  const { theme } = useGalleryStore();

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : '';
  }, [theme]);

  return (
    <QueryClientProvider client={qc}>
      <div className={styles.page}>
        <Topbar />
        <div className={styles.layout}>
          <Sidebar />
          <main className={styles.main}>
            <PhotoGrid />
          </main>
        </div>
        <UploadZone />
        <UploadPanel />
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              background: 'rgba(20,20,35,0.95)',
              color: '#f0f0f8',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </div>
    </QueryClientProvider>
  );
}
