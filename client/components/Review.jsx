import React, { useState, useEffect, useContext } from "react";
import AppSidebar from "./AppSidebar";
import { AuthContext } from "../utils/AuthContext";

export default function Review() {
  const { user } = useContext(AuthContext);
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcriptContent, setTranscriptContent] = useState(""); // Added state for transcript content
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null);

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
      console.log(`Fetching transcript details for ID: ${transcriptId}, User ID: ${user.id}`);
      const response = await fetch(`/api/transcripts/${transcriptId}?userId=${user.id}`);

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        throw new Error('Failed to fetch transcript details');
      }

      const data = await response.json();
      console.log('Transcript details received:', data);
      setSelectedTranscript(data);

      // Check for feedback - handle both data.Feedback (singular) and data.Feedbacks (plural)
      const feedbackData = data.Feedback || (data.Feedbacks && data.Feedbacks[0]);

      if (feedbackData && feedbackData.status === 'pending') {
        console.log('Feedback is pending, will poll for updates in 5 seconds');
        // Wait 5 seconds before polling again
        setTimeout(() => {
          console.log('Polling for feedback updates...');
          fetchTranscriptDetails(transcriptId);
        }, 5000);
      }
    } catch (error) {
      console.error('Error fetching transcript details:', error);
      setError('Failed to load transcript details. Please try again later.');
    }
  };

  const handleTranscriptSelect = (transcript) => {
    if (transcript.id === selectedTranscript?.id) {
      setSelectedTranscript(null);
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

  useEffect(() => {
    if (selectedTranscript) {
      setFeedbackLoading(true);
      setFeedbackStatus(null);

      console.log(`Fetching transcript ${selectedTranscript.id} for user ${user.id}`);

      fetch(`/api/transcripts/${selectedTranscript.id}?userId=${user.id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log("Transcript details received:", data);
          setTranscriptContent(data.content || "No content available");

          // Parse feedback if available
          console.log("Complete transcript data:", data);

          if (data.Feedbacks && data.Feedbacks.length > 0) {
            const feedbackData = data.Feedbacks[0];
            setFeedbackStatus(feedbackData.status);

            console.log("Feedback data:", feedbackData);

            if (feedbackData.status === 'completed' && feedbackData.content) {
              setFeedback(feedbackData.content);
            } else if (feedbackData.status === 'pending') {
              setFeedback("Feedback generation is in progress... This may take a minute.");

              // Poll for feedback updates if status is pending
              const feedbackPollInterval = setInterval(() => {
                console.log("Polling for feedback updates...");
                fetch(`/api/transcripts/${selectedTranscript.id}?userId=${user.id}`)
                  .then(response => response.json())
                  .then(updatedData => {
                    if (updatedData.Feedbacks && updatedData.Feedbacks.length > 0) {
                      const updatedFeedback = updatedData.Feedbacks[0];
                      if (updatedFeedback.status !== 'pending') {
                        clearInterval(feedbackPollInterval);
                        setFeedbackStatus(updatedFeedback.status);
                        if (updatedFeedback.status === 'completed') {
                          setFeedback(updatedFeedback.content);
                        } else if (updatedFeedback.status === 'failed') {
                          setFeedback(`Feedback generation failed: ${updatedFeedback.content || 'Unknown error'}`);
                        }
                      }
                    }
                  })
                  .catch(error => console.error("Error polling for feedback:", error));
              }, 5000); // Poll every 5 seconds

              // Clean up interval on unmount
              return () => clearInterval(feedbackPollInterval);
            } else if (feedbackData.status === 'failed') {
              setFeedback(`Feedback generation failed: ${feedbackData.content || 'Unknown error'}`);
            } else {
              setFeedback("No feedback available");
            }
          } else {
            console.log("No feedback entries found for this transcript");
            setFeedback("No feedback available - the system will attempt to generate one now");
          }

          setFeedbackLoading(false);
        })
        .catch(error => {
          console.error("Error fetching transcript:", error);
          setTranscriptContent("Error loading transcript: " + error.message);
          setFeedback("Error loading feedback: " + error.message);
          setFeedbackLoading(false);
        });
    } else {
      setTranscriptContent("");
      setFeedback(null);
      setFeedbackStatus(null);
    }
  }, [selectedTranscript, user]);


  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <h1>Review</h1>
        </div>
      </nav>
      <main className="fixed top-16 left-0 right-0 bottom-0 overflow-auto md:overflow-hidden relative z-10">
        <div className="flex flex-col md:flex-row h-full bg-gray-50 relative">
          <AppSidebar />
          <div className="w-full overflow-auto pl-16 md:pl-32"> {/* Removed md:w-2/5 to allow full width */}
            <h2 className="text-xl font-semibold mb-4">Your Conversation History</h2>
            <section className="w-full p-4 review-section">
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
                    <div className="w-full gap-4">
                      <div className="mb-4 w-full">
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
                      
                      {/* Display recording if available */}
                      {selectedTranscript?.recordingUrl ? (
                        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                          <h3 className="text-lg font-medium mb-2">Session Recording</h3>
                          <video
                            controls
                            className="w-full rounded-lg"
                            src={selectedTranscript.recordingUrl}
                          >
                            Your browser does not support HTML video.
                          </video>
                        </div>
                      ) : (
                        selectedTranscript && <p className="mt-4 text-gray-500 italic">No recording available for this conversation.</p>
                      )}

                      {selectedTranscript && (
                        <div className="bg-gray-50 p-4 rounded-lg mt-4 w-full">
                          <div className="flex justify-between items-center mb-4 w-full">
                            <h3 className="text-lg font-medium">{selectedTranscript.title}</h3>
                            <span className="text-sm text-gray-500">{formatDate(selectedTranscript.createdAt)}</span>
                          </div>

                          <div className="bg-white p-4 rounded-lg shadow-sm w-full">
                            {(() => {
                              try {
                                return selectedTranscript.content.split('\n\n').map((paragraph, index) => (
                                  <p key={index} className={`mb-4 ${paragraph.startsWith('AI:') ? 'text-blue-600' : 'text-gray-800'}`}>
                                    {paragraph}
                                  </p>
                                ));
                              } catch (error) {
                                console.error('Error parsing transcript content:', error);
                                return <p className="text-red-500">Error displaying transcript. Content may be malformed.</p>;
                              }
                            })()}
                          </div>

                          {/* Feedback section with status indicators */}
                          <div className="mt-6">
                            <h3 className="text-xl font-semibold mb-2">AI Feedback:</h3>
                            {feedbackLoading ? (
                              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mr-3"></div>
                                <p>Loading feedback...</p>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">
                                {feedbackStatus === 'pending' && (
                                  <div className="flex items-center mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span>Feedback is being generated. You may need to refresh in a minute.</span>
                                  </div>
                                )}

                                {feedbackStatus === 'failed' && (
                                  <div className="flex items-center mb-3 p-2 bg-red-50 rounded border border-red-200">
                                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span>There was an error generating feedback.</span>
                                  </div>
                                )}

                                {feedback || "No feedback available yet. If this persists, there may be an issue with the OpenAI API connection."}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}