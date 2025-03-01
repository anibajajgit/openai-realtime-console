import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./components/App";
import TranscriptList from "./components/TranscriptList";
import TranscriptView from "./components/TranscriptView";
import "./base.css";

ReactDOM.hydrateRoot(
  document.getElementById("app"),
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/transcripts" element={<TranscriptList />} />
      <Route path="/transcripts/:id" element={<TranscriptView />} />
    </Routes>
  </BrowserRouter>
);