import React, { useState, useEffect, useRef, useContext } from "react";
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
import { BorderTrail } from './BorderTrail';

export default function App() {
  // Get user from context if available, otherwise null
  const authContext = useContext(AuthContext);
  const user = authContext ? authContext.user : null;
  const [events, setEvents] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const audioRef = useRef(null); // Added audioRef
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState(null); // Add state for selected role
  const [selectedScenario, setSelectedScenario] = useState(null); // Add state for selected scenario


  const loginApp = (userData) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      // Only call login if authContext exists
      if (authContext && authContext.login) {
        authContext.login(userData);
      }
      console.log("User logged in:", userData);
    }
  };

  const logoutApp = () => {
    localStorage.removeItem('user');
    // Only call logout if authContext exists
    if (authContext && authContext.logout) {
      authContext.logout();
    }
    console.log("User logged out");
  };

  useEffect(() => {
    console.log("App component mounted with user:", user);

    // Check if we're in the login state but actually have a user in localStorage
    if (!user && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            console.log("Found user in localStorage, restoring:", parsedUser);
            if (authContext && authContext.login) {
              authContext.login(parsedUser);
            }
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }
    }
  }, [user, authContext]);

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
      const role = JSON.parse(localStorage.getItem('selectedRole') || '{"id":1}');
      const scenario = JSON.parse(localStorage.getItem('selectedScenario') || '{"id":1}');
      saveTranscript(events, user, role.id, scenario.id);
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

  useEffect(() => {
    console.log("Session active state changed:", isSessionActive);

    if (isSessionActive && audioRef.current) {
      console.log("Attempting to play call sound");
      // Reset audio and try to play call sound
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.5;
      
      // Use user interaction to explicitly enable audio
      const playAudio = () => {
        console.log("Playing audio from user interaction");
        audioRef.current.play()
          .then(() => {
            console.log("Audio started successfully");
          })
          .catch(err => {
            console.error("Error playing audio:", err);
          });
      };
      
      // Try to play immediately
      const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Audio is playing successfully");
            })
            .catch(err => {
              console.error("Error playing audio:", err);
            });
        }
      }, 100);
    } else if (!isSessionActive && audioRef.current) {
      // Stop audio when session ends
      console.log("Stopping audio playback");
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isSessionActive]);


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
            <>
              <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
                <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
                  <h1>Scenarios</h1>
                </div>
              </nav>
              <main className="fixed top-16 left-0 right-0 bottom-0 overflow-auto md:overflow-hidden relative z-20"> {/*Added relative and z-20 */}
                <div className={`flex flex-col md:flex-row h-full bg-gray-50 relative ${isSessionActive ? 'border border-transparent rounded-lg p-2' : ''}`}> 
                  {isSessionActive && <BorderTrail className="bg-blue-500" size={10} />}
                  <AppSidebar />
                  <section className="w-full md:w-2/5 p-4">
                    {isSessionActive ? <EventLog events={events} /> : <ScenarioSelector />}
                  </section>
                  <section className="w-full md:w-3/5 p-6 flex flex-col gap-6 bg-blue-50 rounded-lg relative">
                    {/* Avatar photo container */}
                    {console.log("Selected role:", selectedRole)}
                    <div className="absolute top-6 left-6 w-1/5 aspect-square rounded-lg overflow-hidden shadow-md border-2 border-red-500 bg-white z-10">
                      {selectedRole ? (
                        <img 
                          src={`/attached_assets/${selectedRole.name.split(' ')[0].toLowerCase()}.jpg`}
                          alt={`${selectedRole.name} avatar`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log(`Failed to load image: ${e.target.src}`);
                            // Try direct test-image route as fallback
                            const firstName = selectedRole.name.split(' ')[0].toLowerCase();
                            e.target.src = `/test-image/${firstName}`;

                            // Add a second error handler for the fallback attempt
                            e.target.onerror = () => {
                              console.log(`Fallback image also failed: ${e.target.src}`);
                              // Use a data URI placeholder as last resort
                              e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22150%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23e0e0e0%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2230%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3E${firstName.charAt(0).toUpperCase()}%3C%2Ftext%3E%3C%2Fsvg%3E';
                            };
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300">
                          {/* Empty gray screen when no role is selected */}
                        </div>
                      )}
                    </div>
                    <div className={`bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-5 h-[400px] md:h-[500px] w-4/5 ml-auto 
                      ${isSessionActive ? '' : ''}`}>
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
      {/* Audio element for call sound */}
      <audio 
        ref={audioRef} 
        src="/attached_assets/call-sound.mp3"
        preload="auto"
        id="callSound"
        muted={false}
        crossOrigin="anonymous"
      />

      {/* Overlay when session is active */}
      {isSessionActive && (
        <div className="absolute inset-0 bg-black/40 pointer-events-none z-10">
          {/* This overlay covers everything except the main container */}
        </div>
      )}
    </AuthContext.Provider>
  );
}