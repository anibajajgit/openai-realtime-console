import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import ScenarioSelector from "./ScenarioSelector";
import EventLog from "./EventLog";
import Home from "./Home";
import Login from "./Login"; //New Component
import Review from "./Review"; //Review Component
import "../base.css";
import SessionControls from "./SessionControls";
import { AuthContext, AuthProvider } from "../utils/AuthContext"; // Assuming AuthContext is in ../utils


export default function App() {
  // Get user from context if available, otherwise null
  const authContext = useContext(AuthContext);
  const user = authContext ? authContext.user : null;
  const [events, setEvents] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState(null); // Add state for selected role
  const [selectedScenario, setSelectedScenario] = useState(null); // Add state for selected scenario


  const loginApp = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    authContext.login(userData); // Use authContext.login here
  };

  const logoutApp = () => {
    localStorage.removeItem('user');
    authContext.logout(); // Use authContext.logout here
  };

  useEffect(() => {
    console.log("App component mounted with user:", user);
    // No need to check localStorage here since AuthContext already does this
    // This prevents potential duplicate or conflicting user state
  }, [user]);

  async function startSession() {
    try {
      // Get role and scenario from localStorage or use defaults
      const roleFromStorage = localStorage.getItem('selectedRole');
      const scenarioFromStorage = localStorage.getItem('selectedScenario');

      const role = roleFromStorage ? JSON.parse(roleFromStorage) : { id: 1 };
      const scenario = scenarioFromStorage ? JSON.parse(scenarioFromStorage) : { id: 1 };

      // Update state with these values
      setSelectedRole(role);
      setSelectedScenario(scenario);

      // Use the local variables instead of state since state updates are asynchronous
      const tokenResponse = await fetch(`/token?roleId=${role.id}&scenarioId=${scenario.id}`);
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      const pc = new RTCPeerConnection();
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      peerConnection.current = pc;
      setEvents((prev) => [...prev, { type: "system", message: "Starting session..." }]);
      setIsSessionActive(true);
    } catch (error) {
      console.error("Error starting session:", error);
      setEvents((prev) => [...prev, { type: "error", message: `Failed to start session: ${error.message}` }]);
    }
  }

  async function saveTranscript(events, user, roleId, scenarioId) {
    // Verify all parameters are properly defined
    console.log("saveTranscript called with:", {
      eventsCount: events.length,
      user: user?.id ? `User ID: ${user.id}` : "Missing user",
      roleId: roleId || "null",
      scenarioId: scenarioId || "null"
    });

    if (!user?.id) {
      console.error("Cannot save transcript: User ID is missing");
      return;
    }

    if (events.length === 0) {
      console.error("Cannot save transcript: No events to save");
      return;
    }

    // Log event types for debugging
    console.log("Event types to process:", events.map(e => e.type));
    
    // Format the content as a readable conversation
    const formattedContent = events
      .slice()
      .reverse()
      .filter(event => {
        const isValidType = event.type === "conversation.item.input_audio_transcription.completed" ||
                          event.type === "response.text.done" ||
                          event.type === "response.audio_transcript.done";
        if (!isValidType) {
          console.log("Filtering out event type:", event.type);
        }
        return isValidType;
      })
      .map(event => {
        let prefix = "", text = "";

        if (event.type === "conversation.item.input_audio_transcription.completed") {
          prefix = "User:";
          text = event.transcript || "[No transcript]";
        } else if (event.type === "response.text.done" || event.type === "response.audio_transcript.done") {
          prefix = "AI:";
          text = event.type === "response.text.done" ? (event.text || "[No text]") : (event.transcript || "[No transcript]");
        }

        console.log(`Processing ${event.type} event, text length: ${text?.length || 0}`);
        return `${prefix} ${text}`;
      })
      .join('\n\n');

    console.log("Formatted content length:", formattedContent.length);

    if (formattedContent.length === 0) {
      console.error("Cannot save transcript: No valid conversation content to save");
      console.log("All events:", JSON.stringify(events.slice(0, 3), null, 2)); // Log first 3 events for debugging
      return;
    }

    try {
      const payload = { 
        content: formattedContent,
        userId: user.id,
        roleId: roleId || null,
        scenarioId: scenarioId || null,
        title: `Conversation on ${new Date().toLocaleDateString()}`
      };

      console.log("Saving transcript with payload:", payload);

      // Try with absolute URL to avoid routing issues
      const apiUrl = window.location.origin + '/api/transcripts';
      console.log("Using API URL:", apiUrl);
      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      try {
        console.log("Making initial API request");
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
        });

        // Check response type before trying to parse JSON
        const contentType = response.headers.get('content-type');
        console.log(`Response status: ${response.status}, content type: ${contentType}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Server error (${response.status}):`, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Only try to parse as JSON if content type is JSON
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('Transcript saved successfully!', data);
        } else {
          const text = await response.text();
          console.log('Transcript saved with non-JSON response. First 100 chars:', text.substring(0, 100));
          
          if (text.includes('<!DOCTYPE html>')) {
            console.error("Received HTML instead of JSON - this indicates a routing issue");
          }
        }

        // Force refresh the transcripts list if we're on the review page
        if (window.location.pathname.includes('/review')) {
          window.location.reload();
        }
      } catch (error) {
        console.error("Initial transcript save failed:", error);
        
        // Add a short delay before retry
        console.log("Waiting 1 second before retry...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("Attempting retry with explicit server port");
        try {
          // Try with explicit port in the URL as a fallback
          const backupUrl = `${window.location.protocol}//${window.location.hostname}:3000/api/transcripts`;
          console.log("Retry using URL:", backupUrl);
          
          const retryResponse = await fetch(backupUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
          });
          
          console.log(`Retry response status: ${retryResponse.status}`);
          if (retryResponse.ok) {
            console.log("Transcript saved successfully on retry!");
          } else {
            console.error("Retry also failed with status:", retryResponse.status);
          }
        } catch (retryError) {
          console.error("Retry also failed with error:", retryError);
        }
      }
    } catch (error) {
      console.error('Error saving transcript:', error);
      console.error('Error details:', error.message);

      // Retry once with a delay - sometimes server issues are temporary
      setTimeout(async () => {
        try {
          console.log("Retrying transcript save after failure...");
          // Create a simplified payload for retry
          const retryPayload = { 
            content: formattedContent,
            userId: user.id,
            roleId: roleId || null,
            scenarioId: scenarioId || null,
            title: `Conversation on ${new Date().toLocaleDateString()} (Retry)`
          };

          const retryResponse = await fetch('/api/transcripts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(retryPayload),
          });

          if (retryResponse.ok) {
            console.log('Transcript saved successfully on retry!');
          }
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      }, 1000);
    }
  }


  const endSession = () => {
    setIsSessionActive(false);
    if (dataChannel) {
      dataChannel.close();
      setDataChannel(null);
    }

    // Save transcript when session ends
    console.log("End session triggered. Events:", events.length);
    if (events.length > 0) {
      try {
        console.log("Getting role and scenario from localStorage");
        const roleStr = localStorage.getItem('selectedRole');
        const scenarioStr = localStorage.getItem('selectedScenario');
        console.log("Raw values from localStorage:", { roleStr, scenarioStr });
        
        const role = JSON.parse(roleStr || '{"id":1}');
        const scenario = JSON.parse(scenarioStr || '{"id":1}');
        console.log("Parsed values:", { role, scenario });
        
        if (!user) {
          console.error("No user found when trying to save transcript");
          return;
        }
        
        console.log("Calling saveTranscript with:", { 
          eventsCount: events.length, 
          userId: user.id, 
          roleId: role.id, 
          scenarioId: scenario.id 
        });
        saveTranscript(events, user, role.id, scenario.id);
      } catch (error) {
        console.error("Error preparing transcript save:", error);
      }
    } else {
      console.warn("No events to save in transcript");
    }

    setEvents(prevEvents => [...prevEvents]);
  };

  function sendClientEvent(message) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log("Raw event data:", e.data);
          console.log("Parsed event:", event);

          if (event.type === "audio.transcription") {
            console.log("Audio transcription event:", event);
            setEvents(prev => [event, ...prev]);
          } else {
            console.log("Non-transcription event:", event.type);
            setEvents(prev => [event, ...prev]);
          }
        } catch (error) {
          console.error("Error processing event:", error);
          console.error("Raw event data:", e.data);
        }
      });

      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  return (
    <AuthContext.Provider value={{ user, login: loginApp, logout: logoutApp }}>
      {console.log("AuthContext Provider rendering with user:", user)}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} /> {/*Login Route*/}
        <Route path="/review" element={
          user ? (
            <>
              <Review />
            </>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/scenarios" element={
          user ? (
            console.log("Rendering scenarios route with user:", user) ||
            <>
              <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
                <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
                  <h1>Scenarios</h1>
                </div>
              </nav>
              <main className="fixed top-16 left-0 right-0 bottom-0 overflow-auto md:overflow-hidden">
                <div className="flex flex-col md:flex-row h-full bg-gray-50">
                  <AppSidebar />
                  <section className="w-full md:w-2/5 p-4">
                    {isSessionActive ? <EventLog events={events} /> : <ScenarioSelector />}
                  </section>
                  <section className="w-full md:w-3/5 p-6 flex flex-col gap-6 bg-blue-50 rounded-lg">
                    <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-5 h-[400px] md:h-[500px] w-4/5 ml-auto">
                      <video
                        ref={(video) => {
                          if (video) {
                            navigator.mediaDevices.getUserMedia({ video: true })
                              .then(stream => {
                                video.srcObject = stream;
                                video.onloadedmetadata = () => {
                                  video.play().catch(err => console.error("Error playing video:", err));
                                };
                              })
                              .catch(err => console.error("Error accessing camera:", err));
                          }
                        }}
                        className="h-full w-full aspect-video object-cover rounded-lg"
                        playsInline
                        muted
                      />
                    </div>
                    <div className="h-24 md:h-32">
                      <SessionControls
                        startSession={startSession}
                        stopSession={endSession}  //Corrected stopSession call
                        sendClientEvent={sendClientEvent}
                        sendTextMessage={sendTextMessage}
                        serverEvents={events}
                        isSessionActive={isSessionActive}
                      />
                    </div>
                  </section>
                </div>
              </main>
            </>
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </AuthContext.Provider>
  );
}