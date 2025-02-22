
import { useState } from 'react';

export default function ScenarioSelector({ initialRoles, initialScenarios }) {
  const [selectedRole, setSelectedRole] = useState(initialRoles?.[0] || null);
  const [selectedScenario, setSelectedScenario] = useState(initialScenarios?.[0] || null);

  if (!initialRoles?.length || !initialScenarios?.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-md w-full mb-4">
        <div className="text-center text-gray-600">Loading scenarios...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-md w-full mb-4">
      <h2 className="text-lg font-semibold mb-6">Choose a scenario</h2>
      <div className="space-y-4">
        <div className="relative">
          <select 
            className="w-full p-3 border border-gray-200 rounded-lg appearance-none bg-white hover:border-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
            value={selectedRole?.id || ''}
            onChange={(e) => setSelectedRole(initialRoles.find(r => r.id === Number(e.target.value)))}
          >
            {initialRoles.map(role => (
              <option key={role.id} value={role.id}>{role.name} - {role.title}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select 
            className="w-full p-3 border border-gray-200 rounded-lg appearance-none bg-white hover:border-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
            value={selectedScenario?.id || ''}
            onChange={(e) => setSelectedScenario(initialScenarios.find(s => s.id === Number(e.target.value)))}
          >
            {initialScenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
