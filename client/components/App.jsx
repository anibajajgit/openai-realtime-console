import { useState, useEffect, useRef } from 'react';
import Auth from './Auth';
import ScenarioSelector from './ScenarioSelector';
import SessionControls from './SessionControls';
import EventLog from "./EventLog";

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);

  // Scenario state
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);

  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);

  // Refs
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const mediaRecorder = useRef(null);
  const audioContext = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setSelectedRole(null);
    setSelectedScenario(null);
    setIsSessionActive(false);
    if (peerConnection.current) {
      peerConnection.current.close();
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

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
          if (event.type === "audio.transcription") {
            setEvents(prev => [event, ...prev]);
          } else {
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Sales Training Simulator</h1>
          <div className="flex items-center gap-4">
            <span>{user.name}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <ScenarioSelector
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedScenario={selectedScenario}
          setSelectedScenario={setSelectedScenario}
        />
        {selectedRole && selectedScenario && (
          <>
            <div className="mt-4">
              {isSessionActive ? <EventLog events={events} /> : null}
            </div>
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
      </main>
    </div>
  );
}