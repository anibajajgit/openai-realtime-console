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


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '../components/AppSidebar';
import ScenarioCard from '../components/ScenarioCard';

// Sample scenario data (This is duplicated, ideally it should be in a separate file)
const scenariosData = [
  {
    id: 1,
    title: "Product Pitch",
    description: "Practice pitching a new product to potential investors or clients.",
    difficulty: "Medium",
    duration: "10-15 min",
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  },
  {
    id: 2,
    title: "Job Interview",
    description: "Prepare for a job interview with an AI interviewer asking common questions.",
    difficulty: "Hard",
    duration: "15-20 min",
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2149&q=80"
  },
  // Add more scenarios as needed
];

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, we would fetch this from an API
    setScenarios(scenariosData);
  }, []);

  const handleScenarioClick = (scenarioId) => {
    navigate(`/scenario/${scenarioId}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Choose a Scenario</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onClick={() => handleScenarioClick(scenario.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}