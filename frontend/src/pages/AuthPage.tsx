import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import styles from './AuthPage.module.css';

function Inner() {
  const { authStatus } = useAuthenticator((ctx) => [ctx.authStatus]);
  if (authStatus === 'authenticated') {
    window.location.href = '/';
  }
  return null;
}

export default function AuthPage() {
  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.brand}
        >
          <Camera size={40} strokeWidth={1.5} />
          <h1 className="gradient-text">Luminary</h1>
          <p>Your photos, beautifully organized in the cloud.</p>
        </motion.div>
        <div className={styles.blobs}>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
        </div>
      </div>
      <div className={styles.right}>
        <Authenticator
          signUpAttributes={['email']}
          components={{
            Header: () => (
              <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
                <Camera size={28} style={{ color: '#6c63ff' }} />
                <h2 style={{ marginTop: 8, fontSize: 20, fontWeight: 600 }}>Welcome to Luminary</h2>
              </div>
            ),
          }}
        />
      </div>
      <Inner />
    </div>
  );
}
