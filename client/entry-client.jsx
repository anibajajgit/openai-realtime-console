
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./components/App";
import TranscriptList from "./components/TranscriptList";
import TranscriptView from "./components/TranscriptView";
import "./base.css";

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("app") || document.getElementById("root");
  
  if (!container) {
    console.error("Target container not found. Using body as fallback.");
    // Fallback to body if neither #app nor #root exist
    const fallbackContainer = document.createElement("div");
    fallbackContainer.id = "app";
    document.body.appendChild(fallbackContainer);
    const root = createRoot(fallbackContainer);
    root.render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/transcripts" element={<TranscriptList />} />
        <Route path="/transcripts/:id" element={<TranscriptView />} />
      </Routes>
    </BrowserRouter>
  );
  } else {
    // Normal render path when container is found
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
  }
});
