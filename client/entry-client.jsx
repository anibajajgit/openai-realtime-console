
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";

// Wait for the DOM to be fully loaded
function init() {
  const root = document.getElementById("root");
  
  if (!root) {
    console.error("Root element not found");
    return;
  }

  const AppWithRoutes = () => (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home/*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );

  // if we're rendering from SSR, hydrate the existing markup
  if (root.innerHTML && root.innerHTML.trim() !== '') {
    hydrateRoot(
      root,
      <StrictMode>
        <AppWithRoutes />
      </StrictMode>,
    );
  } else {
    // otherwise, render from scratch
    createRoot(root).render(
      <StrictMode>
        <AppWithRoutes />
      </StrictMode>,
    );
  }
}

// Check if document is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
