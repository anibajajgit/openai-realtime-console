import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";

export default function Review() {
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/transcripts");

      if (!response.ok) {
        throw new Error(`Error fetching transcripts: ${response.status}`);
      }

      const data = await response.json();
      setTranscripts(data.transcripts || []);
    } catch (err) {
      console.error("Failed to fetch transcripts:", err);
      setError("Failed to load transcripts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async (transcriptId) => {
    try {
      const response = await fetch(`/api/transcript-feedback/${transcriptId}`);

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
      } else {
        setFeedback(null);
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
      setFeedback(null);
    }
  };

  const handleSelectTranscript = async (transcript) => {
    setSelectedTranscript(transcript);

    // Fetch feedback for this transcript
    if (transcript && transcript.id) {
      await fetchFeedback(transcript.id);
    } else {
      setFeedback(null);
    }
  };

  const formatContent = (content) => {
    try {
      // Check if content is already parsed
      if (typeof content === 'object') {
        return content;
      }
      return JSON.parse(content);
    } catch (err) {
      // If parsing fails, return content as is
      console.error('Error parsing transcript content:', err);
      return content;
    }
  };

  const renderTranscriptContent = (content) => {
    try {
      const formattedContent = formatContent(content);

      if (typeof formattedContent === 'string') {
        return <div className="whitespace-pre-wrap">{formattedContent}</div>;
      }

      if (Array.isArray(formattedContent)) {
        return (
          <div className="space-y-4">
            {formattedContent.map((message, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                } ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}
              >
                <div className="text-sm text-gray-600 mb-1">
                  {message.role === 'user' ? 'User' : 'Assistant'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            ))}
          </div>
        );
      }

      // If it's neither string nor array, convert to string
      return <div className="whitespace-pre-wrap">{JSON.stringify(formattedContent, null, 2)}</div>;
    } catch (err) {
      console.error("Error rendering transcript content:", err);
      return <div className="text-red-500">Error displaying transcript content</div>;
    }
  };

  const renderFeedback = () => {
    if (!feedback) return null;

    return (
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-medium mb-3">Transcript Feedback</h3>
        <div className="whitespace-pre-wrap">{feedback.content}</div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading transcripts...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
        <Button className="mt-4" onClick={fetchTranscripts}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Transcript List Sidebar */}
      <div className="w-64 border-r p-4 h-full overflow-y-auto">
        <h2 className="text-lg font-medium mb-4">Saved Transcripts</h2>
        {transcripts.length === 0 ? (
          <p className="text-gray-500">No transcripts found</p>
        ) : (
          <ul className="space-y-2">
            {transcripts.map((transcript) => (
              <li key={transcript.id}>
                <button
                  onClick={() => handleSelectTranscript(transcript)}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    selectedTranscript?.id === transcript.id
                      ? "bg-blue-100 text-blue-800"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium truncate">{transcript.title || `Transcript #${transcript.id}`}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(transcript.created_at).toLocaleString()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Transcript Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedTranscript ? (
          <div>
            <h2 className="text-xl font-medium mb-4">
              {selectedTranscript.title || `Transcript #${selectedTranscript.id}`}
            </h2>
            <div className="text-xs text-gray-500 mb-6">
              Created on {new Date(selectedTranscript.created_at).toLocaleString()}
            </div>

            <div className="prose prose-sm max-w-full">
              {renderTranscriptContent(selectedTranscript.content)}
            </div>

            {/* Render feedback if available */}
            {renderFeedback()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a transcript to view its content
          </div>
        )}
      </div>
    </div>
  );
}