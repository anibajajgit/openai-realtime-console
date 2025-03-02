import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./components/App";
import { AuthProvider } from './utils/AuthContext'; // Added import for AuthProvider

export function render(url) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AuthProvider> {/* Wrapped App with AuthProvider */}
          <App />
        </AuthProvider>
      </StaticRouter>
    </StrictMode>,
  );
  return { html };
}