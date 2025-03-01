
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function TranscriptList() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const response = await fetch('/api/transcripts');
        if (!response.ok) {
          throw new Error('Failed to fetch transcripts');
        }
        const data = await response.json();
        setTranscripts(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transcripts:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchTranscripts();
  }, []);

  if (loading) {
    return <div className="p-6">Loading transcripts...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  if (transcripts.length === 0) {
    return <div className="p-6">No transcripts available.</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Past Conversations</h2>
      <div className="grid gap-4">
        {transcripts.map((transcript) => {
          const date = new Date(transcript.createdAt).toLocaleString();
          return (
            <div key={transcript.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">
                    Conversation with {transcript.Role?.name || 'Unknown Role'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {transcript.Scenario?.name || 'Unknown Scenario'} • {date}
                  </p>
                </div>
                <Link
                  to={`/transcripts/${transcript.id}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  View
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
