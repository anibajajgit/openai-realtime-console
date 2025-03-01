
import React from 'react';

export default function LandingPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to the Platform</h1>
      <p className="mb-4">This is the landing page for our application.</p>
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
        <p>Select a role and scenario to begin your interactive session.</p>
      </div>
    </div>
  );
}
