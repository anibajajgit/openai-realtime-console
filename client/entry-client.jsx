
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./components/App";
import TranscriptList from "./components/TranscriptList";
import TranscriptView from "./components/TranscriptView";
import "./base.css";

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("app");
  
  // Use createRoot instead of hydrateRoot for more reliable rendering
  // when there are SSR hydration errors
  const root = createRoot(container);
  
  root.render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/transcripts" element={<TranscriptList />} />
        <Route path="/transcripts/:id" element={<TranscriptView />} />
      </Routes>
    </BrowserRouter>
  );
});
