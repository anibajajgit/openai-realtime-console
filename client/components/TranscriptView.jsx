
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function TranscriptView() {
  const { id } = useParams();
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTranscript() {
      try {
        const response = await fetch(`/api/transcripts/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch transcript');
        }
        const data = await response.json();
        setTranscript(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTranscript();
  }, [id]);

  if (loading) return <div className="p-8">Loading transcript...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!transcript) return <div className="p-8">Transcript not found</div>;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Conversation Transcript</h1>
        <Link to="/" className="bg-blue-500 text-white px-4 py-2 rounded">
          Back to Home
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold">Role:</h3>
            <p>{transcript.role?.name || 'Unknown'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Scenario:</h3>
            <p>{transcript.scenario?.name || 'Unknown'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Date:</h3>
            <p>{new Date(transcript.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="font-semibold">Duration:</h3>
            <p>{formatTime(transcript.duration)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Conversation</h2>
        <div className="space-y-4">
          {transcript.content.map((event, index) => {
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
                  isUser 
                    ? "bg-blue-100 ml-12" 
                    : "bg-gray-100 mr-12"
                }`}
              >
                <div className="font-semibold mb-1">
                  {isUser ? "You" : transcript.role?.name || "AI"}
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
