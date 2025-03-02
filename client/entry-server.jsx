import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./components/App";
import { AuthProvider } from './utils/AuthContext';

// Add this before server-side rendering to mock browser environment
if (typeof window === 'undefined') {
  global.window = {};
  global.localStorage = {
    getItem: (key) => {
      // Return null for user on server side to ensure consistency
      if (key === 'user') return null;
      return null;
    },
    setItem: () => {},
    removeItem: () => {}
  };
  // Ensure document is defined for server-side rendering
  global.document = {
    querySelector: () => null,
    createElement: () => ({
      style: {}
    })
  };
}

export function render(url) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StaticRouter>
    </StrictMode>,
  );
  return { html };
}