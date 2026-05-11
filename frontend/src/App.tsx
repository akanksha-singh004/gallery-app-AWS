import './aws-config';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import GalleryPage from './pages/GalleryPage';
import AuthPage from './pages/AuthPage';

function AppInner() {
  const { authStatus } = useAuthenticator((ctx) => [ctx.authStatus]);
  if (authStatus === 'configuring') return null;
  if (authStatus !== 'authenticated') return <AuthPage />;
  return <GalleryPage />;
}

export default function App() {
  return (
    <Authenticator.Provider>
      <AppInner />
    </Authenticator.Provider>
  );
}
