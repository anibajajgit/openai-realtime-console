import { useState, useEffect } from 'react';

export default function ScenarioSelector() {
  const [scenarios, setScenarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    fetch('/api/scenarios')
      .then(res => res.json())
      .then(data => {
        setScenarios(data);
        setSelectedScenario(data[0]);
      });

    fetch('/api/roles')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched roles from API:', data);
        setRoles(data);
        if (data && data.length > 0) {
          setSelectedRole(data[0]);
        } else {
          console.warn('No roles received from API');
        }
      })
      .catch(error => {
        console.error('Error fetching roles:', error);
      });
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
            value={selectedScenario?.id || ''} //Added null check
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
            value={selectedRole?.id || ''} //Added null check
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
          <p className="text-gray-600 mb-4">{selectedScenario?.description}</p>

          <h3 className="font-medium mb-2">RUBRIC</h3>
          <ul className="list-disc pl-4 space-y-2">
            {selectedScenario?.rubric?.map((item, index) => (
              <li key={index} className="text-gray-600">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}