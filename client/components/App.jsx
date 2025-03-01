import { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom"; // Updated import

import EventLog from "./EventLog";
import ScenarioSelector from "./ScenarioSelector";
import SessionControls from "./SessionControls";
import Button from "./Button";
import AppSidebar from "./AppSidebar";
// Placeholder imports for authentication components.  These need to be replaced with your actual components.
import MainScreen from "./MainScreen";
import Scenarios from "./Scenarios";
import Transcripts from "./Transcripts";
import Settings from "./Settings";


export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const [showSidebar, setShowSidebar] = useState(true); //Added state for sidebar visibility.
  const navigate = useNavigate();

  // Placeholder for authentication.  Replace this with your actual authentication logic.
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Added authentication state


  useEffect(() => {
    // Check for existing user in local storage on component mount
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!user);
  }, []);

  const handleLogin = async (username, password) => {
    //Replace this with your actual login logic.  This is a placeholder.
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('user', data.token); //Store token or user data.
      setIsAuthenticated(true);
      navigate('/scenarios'); // Redirect to scenarios after successful login

    } catch (error) {
      console.error("Login failed:", error);
      // Handle login error (e.g., display an error message)
    }
  };

  // Check authentication
  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {isAuthenticated && showSidebar && <AppSidebar onLogout={handleLogout} />} {/*Conditional rendering of sidebar based on authentication*/}
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<MainScreen onLogin={handleLogin} />} /> {/* Pass onLogin function to MainScreen */}
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/transcripts" element={<Transcripts />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

async function startSession() {
    const selectedRole = JSON.parse(localStorage.getItem('selectedRole')) || { id: 1 };
    const selectedScenario = JSON.parse(localStorage.getItem('selectedScenario')) || { id: 1 };
    // Get an ephemeral key from the Fastify server
    const tokenResponse = await fetch(`/token?roleId=${selectedRole.id}&scenarioId=${selectedScenario.id}`);
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
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
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
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

  // Send a text message to the model
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

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
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

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <h1>Voice chat app</h1>
        </div>
      </nav>
      <main className="fixed top-16 left-0 right-0 bottom-0 overflow-auto md:overflow-hidden">
        <div className="flex flex-col md:flex-row h-full bg-gray-50">
          {isAuthenticated && <AppSidebar />} {/* Added AppSidebar here */}
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
                stopSession={stopSession}
                sendClientEvent={sendClientEvent}
                sendTextMessage={sendTextMessage}
                events={events}
                isSessionActive={isSessionActive}
                onAudioTranscript={(transcript) => {
                  setEvents(prev => [{
                    type: "audio.transcription",
                    transcript,
                    event_id: Date.now().toString()
                  }, ...prev]);
                }}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}