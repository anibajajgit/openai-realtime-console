
import React, { useState, useEffect } from 'react';

export default function ScenariosPage() {
  const [roles, setRoles] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);

  useEffect(() => {
    // Fetch roles data
    fetch('/api/roles')
      .then(response => response.json())
      .then(data => {
        console.log("Fetched roles from API:", data);
        setRoles(data);
        if (data.length > 0 && !selectedRole) {
          setSelectedRole(data[0]);
        }
      })
      .catch(error => console.error('Error fetching roles:', error));

    // Fetch scenarios data
    fetch('/api/scenarios')
      .then(response => response.json())
      .then(data => {
        console.log("Fetched scenarios from API:", data);
        setScenarios(data);
        if (data.length > 0 && !selectedScenario) {
          setSelectedScenario(data[0]);
        }
      })
      .catch(error => console.error('Error fetching scenarios:', error));
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Scenarios</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Select a Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(role => (
              <div 
                key={role.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedRole?.id === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center space-x-3">
                  <img src={role.photoUrl} alt={role.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="font-semibold">{role.name}</h3>
                    <p className="text-sm text-gray-600">{role.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Select a Scenario</h2>
          <div className="space-y-4">
            {scenarios.map(scenario => (
              <div 
                key={scenario.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedScenario?.id === scenario.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => setSelectedScenario(scenario)}
              >
                <h3 className="font-semibold">{scenario.title}</h3>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedRole && selectedScenario && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Session Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700">Selected Role:</h3>
              <p className="font-semibold">{selectedRole.name} - {selectedRole.title}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Selected Scenario:</h3>
              <p className="font-semibold">{selectedScenario.title}</p>
              <p className="text-sm text-gray-600 mt-1">{selectedScenario.description}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Start Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
