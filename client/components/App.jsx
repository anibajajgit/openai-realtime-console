import { useState, useEffect, useRef } from 'react';
import Auth from './Auth';
import ScenarioSelector from './ScenarioSelector';
import SessionControls from './SessionControls';
import EventLog from "./EventLog";


export default function App() {
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false); //Added from original
  const [events, setEvents] = useState([]); //Added from original
  const [dataChannel, setDataChannel] = useState(null); //Added from original
  const peerConnection = useRef(null); //Added from original
  const audioElement = useRef(null); //Added from original
  const mediaRecorder = useRef(null);
  const audioContext = useRef(null);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setSelectedRole(null);
    setSelectedScenario(null);
    setIsSessionActive(false); //Added from original
    stopSession(); //Added from original
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  async function startSession() { //Added from original
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
  function stopSession() { //Added from original
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

  // Send a message to the model
  function sendClientEvent(message) { //Added from original
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
  function sendTextMessage(message) { //Added from original
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Interview Practice</h1>
          <div className="flex items-center gap-4">
            <span>{user.name}</span>
            <button 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <ScenarioSelector
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedScenario={selectedScenario}
          setSelectedScenario={setSelectedScenario}
        />
        {selectedRole && selectedScenario && (
          <>
            <div className="mt-4"> {/*Added to provide spacing*/}
              {isSessionActive ? <EventLog events={events} /> : null} </div> {/* Conditionally render EventLog */}
            <SessionControls
              selectedRole={selectedRole}
              selectedScenario={selectedScenario}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              mediaRecorder={mediaRecorder}
              audioContext={audioContext}
              startSession={startSession} //Added from original
              stopSession={stopSession} //Added from original
              sendClientEvent={sendClientEvent} //Added from original
              sendTextMessage={sendTextMessage} //Added from original
              events={events} //Added from original
              isSessionActive={isSessionActive} //Added from original
              onAudioTranscript={(transcript) => { //Added from original
                setEvents(prev => [{
                  type: "audio.transcription",
                  transcript,
                  event_id: Date.now().toString()
                }, ...prev]);
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}