import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AdminArea } from './AdminArea.tsx';
import './index.css';

// Detect if we're on the admin route
const isAdminRoute = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminRoute ? <AdminArea /> : <App />}
  </StrictMode>,
);
