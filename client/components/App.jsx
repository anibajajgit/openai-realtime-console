import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import ScenarioSelector from "./ScenarioSelector";
import EventLog from "./EventLog";
import Home from "./Home";
import "../base.css";


export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const location = useLocation(); // Using useLocation to conditionally render header

  async function startSession() {
    const selectedRole = JSON.parse(localStorage.getItem('selectedRole')) || { id: 1 };
    const selectedScenario = JSON.parse(localStorage.getItem('selectedScenario')) || { id: 1 };
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
  }

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
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/scenarios" replace />} /> {/* Redirect to scenarios page by default */}
        <Route path="/scenarios" element={
          <>
            {location.pathname !== "/home" && ( // Conditionally render header based on route
              <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
                <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
                  <h1>Scenarios</h1>
                </div>
              </nav>
            )}
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
        } />
        <Route path="/home" element={<Home />} />
      </Routes>
    </>
  );
}

// Note: SessionControls component is assumed to be defined elsewhere and handles session control elements.  This is not included in the original code.