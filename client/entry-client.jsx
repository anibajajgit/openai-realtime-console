import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./components/App";
import TranscriptView from "./components/TranscriptView";
import TranscriptList from "./components/TranscriptList";
import "./base.css";

ReactDOM.hydrateRoot(
  document.getElementById("root"),
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/transcripts" element={<TranscriptList />} />
        <Route path="/transcript/:id" element={<TranscriptView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);


// Placeholder components - these need substantial implementation
const TranscriptView = ({ params }) => {
  // Fetch and display transcript with id params.id from the database.
  return <div>Transcript View: {params.id}</div>;
};

const TranscriptList = () => {
  // Fetch and display a list of transcripts from the database.
  return <div>Transcript List</div>;
};