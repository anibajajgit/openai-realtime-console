import { useState, useEffect } from 'react';

export default function ScenarioSelector() {
  const [scenarios, setScenarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const [rolesRes, scenariosRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/scenarios')
      ]);
      
      const rolesData = await rolesRes.json();
      const scenariosData = await scenariosRes.json();
      
      setRoles(rolesData);
      setScenarios(scenariosData);
      setSelectedScenario(scenariosData[0]);
      setSelectedRole(rolesData[0]);
    }
    
    fetchData();
  }, []);

  useEffect(() => {
    const saved = localStorage?.getItem('selectedRole');
    if (saved) {
      setSelectedRole(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
            onChange={(e) => setSelectedScenario(scenarios.find(s => s.id === Number(e.target.value)))}
          >
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select 
            className="w-full p-3 border border-gray-200 rounded-lg appearance-none bg-white hover:border-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
            value={selectedRole.id}
            onChange={(e) => setSelectedRole(roles.find(r => r.id === Number(e.target.value)))}
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name} - {role.title} ({role.style})
              </option>
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