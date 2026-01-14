import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LocationProvider } from './features/Location/context/LocationContext';
import { CartProvider } from './features/Restaurant/hooks/useCart';
import { AuthProvider } from './features/Auth/context/AuthContext';
// 1. IMPORTAR O HELMET PROVIDER (Para gerenciar os títulos e capas)
import { HelmetProvider } from 'react-helmet-async';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* 2. ENVOLVENDO TUDO COM HELMETPROVIDER */}
    <HelmetProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);