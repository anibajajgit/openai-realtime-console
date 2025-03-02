
import React, { useState, useEffect, useContext } from "react";
import AppSidebar from "./AppSidebar";
import { AuthContext } from "./App";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Review() {
  const { user } = useContext(AuthContext);
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [transcriptContent, setTranscriptContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchTranscripts();
    }
  }, [user]);

  async function fetchTranscripts() {
    try {
      setLoading(true);
      const response = await fetch(`/api/transcripts/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch transcripts');
      
      const data = await response.json();
      setTranscripts(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transcripts:', err);
      setError('Failed to load transcripts. Please try again later.');
      setLoading(false);
    }
  }

  async function fetchTranscriptContent(transcriptId) {
    try {
      setLoading(true);
      const response = await fetch(`/api/transcripts/${transcriptId}`);
      if (!response.ok) throw new Error('Failed to fetch transcript content');
      
      const data = await response.json();
      setTranscriptContent(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transcript content:', err);
      setError('Failed to load transcript content. Please try again later.');
      setLoading(false);
    }
  }

  function handleTranscriptSelect(transcriptId) {
    if (selectedTranscript === transcriptId) {
      setSelectedTranscript(null);
      setTranscriptContent(null);
    } else {
      setSelectedTranscript(transcriptId);
      fetchTranscriptContent(transcriptId);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function renderTranscriptMessages(transcript) {
    if (!transcript || !transcript.data || !transcript.data.transcript) {
      return <p>No messages in this transcript</p>;
    }

    return transcript.data.transcript.map((event, index) => {
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
        case "audio.transcription":
          text = event.text;
          isUser = true;
          break;
      }

      if (!text) return null;

      return (
        <div 
          key={index} 
          className={`p-3 rounded-lg my-2 ${isUser ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}
          style={{ maxWidth: '80%', alignSelf: isUser ? 'flex-end' : 'flex-start' }}
        >
          <p className="text-xs text-gray-500 mb-1">{isUser ? 'You' : transcript.data.roleName || 'AI'}</p>
          <p>{text}</p>
        </div>
      );
    });
  }

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
          <section className="w-full p-4 overflow-auto">
            <div className="bg-white shadow-md rounded-xl p-5">
              <h2 className="text-xl font-semibold mb-4">Your Session Transcripts</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {loading && <p>Loading...</p>}
              
              {!user ? (
                <p>Please log in to view your transcripts.</p>
              ) : transcripts.length === 0 ? (
                <p>You don't have any saved transcripts yet.</p>
              ) : (
                <div className="space-y-4">
                  {transcripts.map(transcript => (
                    <div key={transcript.id} className="border rounded-lg overflow-hidden">
                      <div 
                        className="bg-gray-100 p-4 cursor-pointer flex justify-between items-center"
                        onClick={() => handleTranscriptSelect(transcript.id)}
                      >
                        <div>
                          <h3 className="font-medium">
                            {transcript.scenarioName || 'Untitled Session'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {transcript.roleName ? `With: ${transcript.roleName}` : ''}
                            {' • '}
                            {formatDate(transcript.createdAt)}
                          </p>
                        </div>
                        {selectedTranscript === transcript.id ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                      
                      {selectedTranscript === transcript.id && (
                        <div className="p-4">
                          {transcriptContent ? (
                            <div className="flex flex-col">
                              {renderTranscriptMessages(transcriptContent)}
                            </div>
                          ) : (
                            <p>Loading transcript...</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
