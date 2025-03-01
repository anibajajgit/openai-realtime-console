
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function TranscriptView() {
  const { id } = useParams();
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const response = await fetch(`/api/transcripts/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch transcript');
        }
        const data = await response.json();
        setTranscript(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transcript:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading transcript...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  if (!transcript) {
    return <div className="p-6">Transcript not found.</div>;
  }

  // Filter and process events to show only relevant transcript items
  const conversationEvents = transcript.content.filter(event => 
    event.type === "conversation.item.input_audio_transcription.completed" ||
    event.type === "response.text.done" ||
    event.type === "response.audio_transcript.done"
  );

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link to="/transcripts" className="text-blue-500 hover:underline">
          &larr; Back to Transcripts
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-2">
          Conversation with {transcript.Role?.name || 'Unknown Role'}
        </h2>
        <p className="text-gray-600 mb-4">
          {transcript.Scenario?.name || 'Unknown Scenario'} • 
          {new Date(transcript.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Transcript</h3>
        <div className="space-y-4">
          {conversationEvents.map((event, index) => {
            let text = '';
            let isUser = false;

            switch (event.type) {
              case "conversation.item.input_audio_transcription.completed":
                text = event.transcript;
                isUser = true;
                break;
              case "response.text.done":
                text = event.text;
                isUser = false;
                break;
              case "response.audio_transcript.done":
                text = event.transcript;
                isUser = false;
                break;
            }

            if (!text) return null;

            return (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  isUser ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                } max-w-[80%] ${isUser ? 'ml-auto' : ''}`}
              >
                <div className="font-semibold mb-1">
                  {isUser ? 'You' : transcript.Role?.name || 'AI'}
                </div>
                <div>{text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
