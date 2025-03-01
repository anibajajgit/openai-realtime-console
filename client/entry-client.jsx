
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";

const root = document.getElementById("root");

const AppWithRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home/*" element={<HomePage />} />
    </Routes>
  </BrowserRouter>
);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // if we're rendering from SSR, hydrate the existing markup
  if (root && root.innerHTML && root.innerHTML.trim() !== '') {
    hydrateRoot(
      root,
      <StrictMode>
        <AppWithRoutes />
      </StrictMode>,
    );
  } else {
    // otherwise, render from scratch
    if (root) {
      createRoot(root).render(
        <StrictMode>
          <AppWithRoutes />
        </StrictMode>,
      );
    } else {
      console.error("Root element not found");
    }
  }
});
