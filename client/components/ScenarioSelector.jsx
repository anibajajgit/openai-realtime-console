import React, { useState } from 'react';

const scenarios = [
  {
    id: 1,
    name: "Cold Sales Call",
    description: "Try your hand at booking a meeting from a cold sales call",
    rubric: [
      "Book a follow-up: Successfully arrange a follow-up call to continue the conversation.",
      "Actively listen: Demonstrate active listening by responding thoughtfully and acknowledging key points."
    ]
  },
  {
    id: 2,
    name: "Product Demo",
    description: "Present a product demo to a potential client",
    rubric: [
      "Feature showcase: Effectively demonstrate key product features",
      "Handle objections: Address customer concerns professionally"
    ]
  }
];

const roles = [
  {
    id: 1,
    name: "Priya Anand",
    title: "CTO",
    style: "ASSERTIVE",
    photoUrl: "https://picsum.photos/40"
  },
  {
    id: 2,
    name: "Michael Chen",
    title: "Product Manager",
    style: "COLLABORATIVE",
    photoUrl: "https://picsum.photos/40"
  }
];

const PersonComponent = ({ person }) => (
  <div className="flex items-center space-x-2">
    <img src={person.photoUrl} alt={person.name} className="w-8 h-8 rounded-full" />
    <span>{person.name}</span>
  </div>
);


export default function ScenarioSelector({ onRoleSelect }) {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0]);
  const [selectedRole, setSelectedRole] = useState(roles[0]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 h-full shadow-md w-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
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
                onChange={(e) => {
              const role = roles.find(r => r.id === Number(e.target.value));
              setSelectedRole(role);
              onRoleSelect(role);
            }}
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.title} ({role.style})
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>
        <div className="w-48">
          <VideoComponent selectedRole={selectedRole} />
        </div>
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
  );
}


const VideoComponent = ({ selectedRole }) => {
  return (
    <div className="relative w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg p-2">
        <PersonComponent person={selectedRole} />
      </div>
      <video className="w-full h-full object-cover" autoPlay playsInline muted />
    </div>
  );
}