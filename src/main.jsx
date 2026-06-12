import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Production: route /api/* calls directly to Render backend with credentials for cross-origin auth cookies
if (import.meta.env.PROD) {
  const API_BASE = 'https://zahlxv2.onrender.com';
  const origFetch = window.fetch.bind(window);
  window.fetch = (url, opts = {}) => {
    if (typeof url === 'string' && url.startsWith('/api')) {
      url = `${API_BASE}${url}`;
      opts.credentials = 'include';
    }
    return origFetch(url, opts);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)