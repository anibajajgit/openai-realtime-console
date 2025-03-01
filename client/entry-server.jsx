import React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./components/App";
import TranscriptView from "./components/TranscriptView";
import TranscriptList from "./components/TranscriptList";
import { Routes, Route } from "react-router-dom";
import "./base.css";

export function render(url) {
  const html = ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/transcripts" element={<TranscriptList />} />
        <Route path="/transcript/:id" element={<TranscriptView />} />
      </Routes>
    </StaticRouter>
  );
  return { html };
}