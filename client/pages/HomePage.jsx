
import React from "react";
import { Link } from "react-router-dom";
import AppSidebar from "../components/AppSidebar";

export default function HomePage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Welcome to the AI Scenario Simulator</h1>
          <p className="text-gray-600 mb-6">
            Practice presentations and interactions with AI-powered virtual scenarios. Choose a scenario to get started!
          </p>
          <div className="flex justify-center">
            <Link 
              to="/scenarios" 
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Browse Scenarios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
