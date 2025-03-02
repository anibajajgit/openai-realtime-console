import React from 'react';
import AppSidebar from '../components/AppSidebar';

const HomePage = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Welcome to the Home Page</h1>
        {/* Add home page content here */}
        <p className="text-gray-600">This is the home page. Add your content here.</p>
      </div>
    </div>
  );
};

export default HomePage;