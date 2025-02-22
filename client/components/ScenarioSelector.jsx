import { useState, useEffect } from 'react';

export default function ScenarioSelector({ initialRoles, initialScenarios }) {
  const [selectedScenario, setSelectedScenario] = useState(initialScenarios[0]);
  const [selectedRole, setSelectedRole] = useState(initialRoles[0]);

  useEffect(() => {
    if (selectedRole && selectedScenario && typeof window !== 'undefined') {
      localStorage.setItem('selectedRole', JSON.stringify(selectedRole));
      localStorage.setItem('selectedScenario', JSON.stringify(selectedScenario));
    }
  }, [selectedRole, selectedScenario]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-md w-full mb-4 md:mb-0">
      <h2 className="text-lg font-semibold mb-6">Choose a scenario</h2>
      <div className="space-y-4">
        <div className="relative">
          <select 
            className="w-full p-3 border border-gray-200 rounded-lg appearance-none bg-white hover:border-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
            value={selectedScenario.id}
            onChange={(e) => setSelectedScenario(initialScenarios.find(s => s.id === Number(e.target.value)))}
          >
            {initialScenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select
            className="w-full p-3 border border-gray-200 rounded-lg appearance-none bg-white hover:border-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
            value={selectedRole.id}
            onChange={(e) => setSelectedRole(initialRoles.find(r => r.id === Number(e.target.value)))}
          >
            {initialRoles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-2">DESCRIPTION</h3>
          <p className="text-gray-600 mb-4">{selectedScenario.description}</p>
          <h3 className="font-medium mb-2">RUBRIC</h3>
          <ul className="list-disc pl-4 space-y-2">
            {selectedScenario.rubric.map((item, index) => (
              <li key={index} className="text-gray-600">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}