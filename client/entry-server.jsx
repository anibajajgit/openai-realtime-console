import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./components/App";
import TranscriptList from "./components/TranscriptList";
import TranscriptView from "./components/TranscriptView";
import "./base.css";

export function render(url) {
  let component;

  if (url === '/transcripts') {
    component = <TranscriptList />;
  } else if (url.startsWith('/transcripts/')) {
    component = <TranscriptView />;
  } else {
    // For the main app, we need to make sure it's safe for SSR
    component = <App />;
  }

  try {
    const html = renderToString(
      <StaticRouter location={url}>
        {component}
      </StaticRouter>
    );
    return { html };
  } catch (error) {
    console.error('Server rendering error:', error);
    // Provide a fallback for server-side rendering errors
    return { 
      html: '<div id="app">Loading application...</div>'
    };
  }
}