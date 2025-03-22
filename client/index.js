// client.js
// Dynamic WebSocket connection based on environment
window.getWebSocketURL = () => {
  // Get the current protocol and host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  // In production (deployed), use the same host, but with WebSocket protocol
  return `${protocol}//${host}`;
};


import create from "./create.jsx";
import context from "./context.js";

export default {
  context,
  create,
};