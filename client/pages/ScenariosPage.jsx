import React from 'react';
import AppSidebar from '../components/AppSidebar';

const HomePage = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Welcome to the Home Page</h1>
        {/* Add home page content here */}
        <p className="text-gray-600">This is the home page.  Add your content here.</p>
      </div>
    </div>
  );
};

export default HomePage;


import React from 'react';
import AppSidebar from '../components/AppSidebar';

const ScenariosPage = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Scenarios</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-6">
            Choose a scenario to practice your presentation skills with our AI-powered virtual audience.
          </p>
          {/* Scenario list would go here */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder for scenario cards */}
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium">Product Pitch</h3>
              <p className="text-gray-500 text-sm">Present your product to stakeholders</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium">Team Update</h3>
              <p className="text-gray-500 text-sm">Update your team on project progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenariosPage;