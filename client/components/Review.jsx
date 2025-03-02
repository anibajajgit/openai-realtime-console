import React, { useState, useEffect, useContext } from "react";
import AppSidebar from "./AppSidebar";
import { AuthContext } from "../utils/AuthContext";

export default function Review() {
  const { user } = useContext(AuthContext);
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcriptFeedback, setTranscriptFeedback] = useState(null); // Add state for feedback

  useEffect(() => {
    if (user) {
      fetchTranscripts();
    }
  }, [user]);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      if (!user || !user.id) {
        setError('User information not available. Please log in again.');
        setLoading(false);
        return;
      }

      console.log(`Fetching transcripts for user ID: ${user.id}`);
      const response = await fetch(`/api/transcripts/user/${user.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server response:', response.status, errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Received ${data.length} transcripts`);
      setTranscripts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      setError(`Failed to load transcripts: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const fetchTranscriptDetails = async (transcriptId) => {
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transcript details');
      }
      const data = await response.json();
      setSelectedTranscript(data);
      // Fetch feedback after fetching transcript details
      fetchTranscriptFeedback(transcriptId);
    } catch (error) {
      console.error('Error fetching transcript details:', error);
      setError('Failed to load transcript details. Please try again later.');
    }
  };

  const fetchTranscriptFeedback = async (transcriptId) => {
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/feedback?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const feedback = await response.json();
      setTranscriptFeedback(feedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError('Failed to load feedback. Please try again later.');
    }
  };


  const handleTranscriptSelect = (transcript) => {
    if (transcript.id === selectedTranscript?.id) {
      setSelectedTranscript(null);
      setTranscriptFeedback(null); // Clear feedback when deselecting
    } else {
      fetchTranscriptDetails(transcript.id);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <h1>Review your transcripts</h1>
        </div>
      </nav>
      <main className="fixed top-16 left-0 right-0 bottom-0 overflow-auto md:overflow-hidden">
        <div className="flex flex-col md:flex-row h-full bg-gray-50">
          <AppSidebar />
          <section className="w-full p-4">
            {!user ? (
              <div className="bg-white shadow-md rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-4">Please log in to view your transcripts</h2>
              </div>
            ) : loading ? (
              <div className="bg-white shadow-md rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-4">Loading transcripts...</h2>
              </div>
            ) : error ? (
              <div className="bg-white shadow-md rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-4">Error</h2>
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-4">Your Conversation History</h2>

                {transcripts.length === 0 ? (
                  <p>You don't have any saved conversations yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="mb-4">
                      <label htmlFor="transcript-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Select a conversation
                      </label>
                      <select
                        id="transcript-select"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        onChange={(e) => handleTranscriptSelect(transcripts.find(t => t.id.toString() === e.target.value))}
                        value={selectedTranscript?.id || ""}
                      >
                        <option value="">-- Select a conversation --</option>
                        {transcripts.map((transcript) => (
                          <option key={transcript.id} value={transcript.id}>
                            {transcript.title} - {formatDate(transcript.createdAt)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedTranscript && (
                      <div className="bg-gray-50 p-4 rounded-lg mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">{selectedTranscript.title}</h3>
                          <span className="text-sm text-gray-500">{formatDate(selectedTranscript.createdAt)}</span>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          {selectedTranscript.content.split('\n\n').map((paragraph, index) => (
                            <p key={index} className={`mb-4 ${paragraph.startsWith('AI:') ? 'text-blue-600' : 'text-gray-800'}`}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                        {transcriptFeedback && ( // Display feedback if available
                          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-medium mb-3">AI Feedback</h3>
                            <div className="prose max-w-none">
                              {transcriptFeedback.feedback.split('\n').map((line, index) => {
                                // Check if line contains a section header
                                if (line.includes('SCENARIO OBJECTIVE:') || 
                                    line.includes('WAS OBJECTIVE ACHIEVED:') || 
                                    line.includes('COMMUNICATION FEEDBACK:') ||
                                    line.includes('IMPROVEMENT OPPORTUNITY:')) {
                                  return <h4 key={index} className="font-bold mt-3">{line}</h4>;
                                } else if (line.startsWith('- ')) {
                                  // Format bullet points
                                  return <li key={index} className="ml-5">{line.substring(2)}</li>;
                                } else if (line.trim() === '') {
                                  return <br key={index} />;
                                } else {
                                  return <p key={index}>{line}</p>;
                                }
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}