import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';
import { migrateLegacyLocalStorageKeys } from './lib/localConfiguration';

migrateLegacyLocalStorageKeys();

createRoot(document.getElementById('root')!).render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
            <App />
        </AuthProvider>
    </GoogleOAuthProvider>,
);
