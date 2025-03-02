import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./components/App";
import { AuthProvider } from './utils/AuthContext';

// Add this before server-side rendering to mock browser environment
if (typeof window === 'undefined') {
  global.window = {};
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
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