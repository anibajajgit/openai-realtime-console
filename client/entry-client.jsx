import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from "./components/App";
import "./base.css";
import Home from "./components/Home";
import ScenariosPage from "./components/ScenariosPage";
import Transcripts from "./components/Transcripts";
import Settings from "./components/Settings";


ReactDOM.hydrateRoot(
  document.getElementById("root"),
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);


// Placeholder components - Replace with your actual component implementations
function Home() {
  return <h1>Home</h1>;
}

function ScenariosPage() {
  //  Replace with your actual ScenariosPage content (roles, scenarios, camera feed)
  return <h1>Scenarios</h1>;
}

function Transcripts() {
  return <h1>Transcripts</h1>;
}

function Settings() {
  return <h1>Settings</h1>;
}

//Example App Component - Replace with your actual implementation
function App() {
    return (
        <Routes>
            <Route path="/" element={<ScenariosPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/transcripts" element={<Transcripts />} />
            <Route path="/settings" element={<Settings />} />
        </Routes>
    );
}