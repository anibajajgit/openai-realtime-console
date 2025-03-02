import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ScenariosPage from "../pages/ScenariosPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/scenarios" element={<ScenariosPage />} />
    </Routes>
  );
};

export default App;