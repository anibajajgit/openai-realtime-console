
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function TranscriptList() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTranscripts() {
      try {
        const response = await fetch('/api/transcripts');
        if (!response.ok) {
          throw new Error('Failed to fetch transcripts');
        }
        const data = await response.json();
        setTranscripts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTranscripts();
  }, []);

  if (loading) return <div className="p-8">Loading transcripts...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (transcripts.length === 0) return <div className="p-8">No transcripts found</div>;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Past Conversations</h1>
        <Link to="/" className="bg-blue-500 text-white px-4 py-2 rounded">
          Start New Conversation
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transcripts.map((transcript) => (
              <tr key={transcript.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(transcript.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transcript.role?.name || `Role ID: ${transcript.roleId}`}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transcript.scenario?.name || `Scenario ID: ${transcript.scenarioId}`}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDuration(transcript.duration)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/transcript/${transcript.id}`} className="text-blue-600 hover:text-blue-900">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
