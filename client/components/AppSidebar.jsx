import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, List } from "react-feather"; // Using react-feather which is already installed

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-full md:w-64 bg-gray-800 text-white p-4 flex md:flex-col justify-around md:justify-start md:h-full">
      <Link 
        to="/home" 
        className={`flex items-center gap-2 p-2 rounded ${location.pathname === "/home" ? "bg-blue-600" : "hover:bg-gray-700"}`}
      >
        <Home size={18} />
        <span>Home</span>
      </Link>
      <Link 
        to="/scenarios" 
        className={`flex items-center gap-2 p-2 rounded ${location.pathname === "/scenarios" ? "bg-blue-600" : "hover:bg-gray-700"}`}
      >
        <List size={18} />
        <span>Scenarios</span>
      </Link>
    </aside>
  );
}