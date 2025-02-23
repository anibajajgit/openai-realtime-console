import React, { useState, useEffect, useRef } from 'react';
import Auth from './Auth';
import ScenarioSelector from './ScenarioSelector';
import SessionControls from './SessionControls';
import EventLog from './EventLog';

export default function App() {
  // User state
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);

  // Refs
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const mediaRecorder = useRef(null);
  const audioContext = useRef(null);

  // Load user effect
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  // Data channel effect
  useEffect(() => {
    if (!dataChannel) return;

    const handleMessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        setEvents(prev => [event, ...prev]);
      } catch (error) {
        console.error("Error processing event:", error);
      }
    };

    dataChannel.addEventListener("message", handleMessage);
    dataChannel.addEventListener("open", () => {
      setIsSessionActive(true);
      setEvents([]);
    });

    return () => {
      dataChannel.removeEventListener("message", handleMessage);
    };
  }, [dataChannel]);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    if (peerConnection.current) {
      peerConnection.current.close();
    }
  };

  const startSession = async () => {
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

  const stopSession = () => {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current?.getSenders().forEach((sender) => {
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

  const sendClientEvent = (message) => {
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

  const sendTextMessage = (message) => {
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


  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          {user ? (
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
              <button onClick={handleLogout} className="text-red-600">
                Logout
              </button>
            </div>
          ) : (
            <Auth onLogin={handleLogin} />
          )}
        </div>
      </header>

      <main className="container mx-auto p-4">
        {user && (
          <>
            <ScenarioSelector
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              selectedScenario={selectedScenario}
              setSelectedScenario={setSelectedScenario}
            />
            {selectedRole && selectedScenario && (
              <>
                {isSessionActive && <EventLog events={events} />}
                <SessionControls
                  selectedRole={selectedRole}
                  selectedScenario={selectedScenario}
                  isSessionActive={isSessionActive}
                  setIsSessionActive={setIsSessionActive}
                  events={events}
                  setEvents={setEvents}
                  dataChannel={dataChannel}
                  setDataChannel={setDataChannel}
                  peerConnection={peerConnection}
                  audioElement={audioElement}
                  mediaRecorder={mediaRecorder}
                  audioContext={audioContext}
                  startSession={startSession}
                  stopSession={stopSession}
                  sendClientEvent={sendClientEvent}
                  sendTextMessage={sendTextMessage}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}