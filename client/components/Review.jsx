import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";

export default function Review() {
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      // Get user from local storage or context
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/transcripts/user/${user.id}`);

      if (!response.ok) {
        throw new Error(`Error fetching transcripts: ${response.status}`);
      }

      const data = await response.json();
      setTranscripts(data || []);
    } catch (err) {
      console.error("Failed to fetch transcripts:", err);
      setError("Failed to load transcripts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async (transcriptId) => {
    try {
      // Get user from local storage or context
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user || !user.id) {
        console.warn('User not authenticated, cannot fetch feedback');
        return;
      }

      const response = await fetch(`/api/transcripts/${transcriptId}/feedback?userId=${user.id}`);

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
      } else {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
          console.error('Failed to fetch feedback:', errorJson.error || errorText);
        } catch (e) {
          // If the response is not valid JSON, log the text
          console.error('Failed to fetch feedback:', errorText);
        }
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleSelectTranscript = async (transcript) => {
    // Get user from local storage or context
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    if (!user || !user.id) {
      console.warn('User not authenticated, cannot select transcript');
      return;
    }

    try {
      setFeedbackLoading(true);
      setFeedbackError(null);
      setFeedback(null);

      // Get full transcript data if needed
      const response = await fetch(`/api/transcripts/${transcript.id}?userId=${user.id}`);

      if (response.ok) {
        const fullTranscript = await response.json();
        setSelectedTranscript(fullTranscript);

        // Once we have the transcript, fetch its feedback
        await fetchFeedback(transcript.id);
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setFeedbackError(errorData.error || 'Failed to fetch transcript details');
        } catch (e) {
          setFeedbackError('Failed to fetch transcript details');
        }
        console.error('Failed to fetch full transcript details');
      }
    } catch (error) {
      setFeedbackError('Error loading transcript: ' + error.message);
      console.error('Error fetching transcript details:', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const retryFeedback = async (feedbackId) => {
    try {
      // Get user from local storage or context
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user || !user.id) {
        console.warn('User not authenticated, cannot retry feedback');
        return;
      }

      const response = await fetch(`/api/openai-feedback/${feedbackId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
      } else {
        console.error('Failed to retry feedback generation');
      }
    } catch (error) {
      console.error('Error retrying feedback:', error);
    }
  };

  const formatContent = (content) => {
    if (!content) return "";

    // First try to parse as JSON
    try {
      const parsedContent = JSON.parse(content);
      return parsedContent;
    } catch (error) {
      // If not valid JSON, content might be plain text format (common for conversation logs)
      // Check if it has the format of a conversation - if so, just return the original
      if (typeof content === 'string' && 
          (content.includes("User:") || content.includes("AI:") || 
           content.includes("Human:") || content.includes("Assistant:"))) {
        return content;
      }

      console.warn('Content is not in valid JSON format:', error);
      return content; // Return original content 
    }
  };

  const renderTranscriptContent = (content) => {
    const formattedContent = formatContent(content);

    if (typeof formattedContent === 'string') {
      return <div className="whitespace-pre-wrap">{formattedContent}</div>;
    }

    // Handle JSON content if needed
    return <div className="whitespace-pre-wrap">{JSON.stringify(formattedContent, null, 2)}</div>;
  };

  const renderFeedback = () => {
    if (feedbackLoading) {
      return (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading feedback...
          </p>
        </div>
      );
    }

    if (feedbackError) {
      return (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">Error loading feedback:</p>
          <p>{feedbackError}</p>
          <Button 
            className="mt-2"
            onClick={() => fetchFeedback(selectedTranscript.id)}
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!feedback) {
      return (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <p>No feedback available for this transcript.</p>
          <Button 
            className="mt-2"
            onClick={() => {
              setFeedbackLoading(true);
              // Request feedback generation for this transcript
              fetch('/api/openai-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  transcriptId: selectedTranscript.id, 
                  userId: JSON.parse(localStorage.getItem('user')).id 
                })
              })
              .then(response => {
                if (response.ok) {
                  return response.json();
                }
                throw new Error('Failed to generate feedback');
              })
              .then(data => {
                setFeedback(data.feedback);
              })
              .catch(error => {
                setFeedbackError('Error generating feedback: ' + error.message);
                console.error('Error generating feedback:', error);
              })
              .finally(() => {
                setFeedbackLoading(false);
              });
            }}
          >
            Generate Feedback
          </Button>
        </div>
      );
    }

    if (feedback.status === 'pending') {
      return (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Feedback is being generated. This may take a moment...
          </p>
        </div>
      );
    }

    if (feedback.status === 'failed') {
      return (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">Feedback generation failed:</p>
          <p>{feedback.errorMessage || 'Unknown error'}</p>
          <Button 
            className="mt-2"
            onClick={() => {
              setFeedbackLoading(true);
              retryFeedback(feedback.id)
                .finally(() => setFeedbackLoading(false));
            }}
          >
            Retry
          </Button>
        </div>
      );
    }

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