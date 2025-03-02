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
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState(null); // Add state for selected role
  const [selectedScenario, setSelectedScenario] = useState(null); // Add state for selected scenario


  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  async function startSession() {
    try {
      setSelectedRole(JSON.parse(localStorage.getItem('selectedRole')) || { id: 1 });
      setSelectedScenario(JSON.parse(localStorage.getItem('selectedScenario')) || { id: 1 });
      const tokenResponse = await fetch(`/token?roleId=${selectedRole.id}&scenarioId=${selectedScenario.id}`);
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
    if (!user || !user.id) {
      console.error('Cannot save transcript: No authenticated user');
      return;
    }
    
    // Format the transcript content
    const formattedContent = events
      .filter(event => {
        return event.type === "conversation.item.input_audio_transcription.completed" || 
               event.type === "response.text.done" ||
               event.type === "response.audio_transcript.done";
      })
      .map(event => {
        let prefix = "";
        let text = "";
        
        if (event.type === "conversation.item.input_audio_transcription.completed") {
          prefix = "User:";
          text = event.transcript;
        } else if (event.type === "response.text.done" || event.type === "response.audio_transcript.done") {
          prefix = "AI:";
          text = event.type === "response.text.done" ? event.text : event.transcript;
        }
        
        return `${prefix} ${text}`;
      })
      .join('\n\n');
      
    try {
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: formattedContent,
          userId: user.id,
          roleId: roleId || null,
          scenarioId: scenarioId || null,
          title: `Conversation on ${new Date().toLocaleDateString()}`
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Transcript saved successfully!');
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  }


  const endSession = () => {
    setIsSessionActive(false);
    if (dataChannel) {
      dataChannel.close();
      setDataChannel(null);
    }

    // Save transcript when session ends
    if (events.length > 0) {
      saveTranscript(events, user, selectedRole?.id, selectedScenario?.id);
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
    <AuthContext.Provider value={{ user, login, logout }}>
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