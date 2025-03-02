
import React from 'react';
import AppSidebar from '../components/AppSidebar';

const HomePage = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Welcome to the AI Scenario Simulator</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-6">
            Practice presentations and interactions with AI-powered virtual scenarios. Choose a scenario to get started!
          </p>
          <a 
            href="/scenarios" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Browse Scenarios
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
