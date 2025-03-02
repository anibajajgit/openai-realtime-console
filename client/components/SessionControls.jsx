import React, { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";

export default function SessionControls({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
  user,
  selectedScenario,
  selectedRole
}) {
  return (
    <div className="flex gap-4 border-t-2 border-gray-200 h-full rounded-md">
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
          user={user}
          selectedScenario={selectedScenario}
          selectedRole={selectedRole}
        />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </div>
  );
}

function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Button
        onClick={handleStartSession}
        className={isActivating ? "bg-gray-600" : "bg-red-600"}
        icon={<CloudLightning height={16} />}
      >
        {isActivating ? "starting session..." : "start session"}
      </Button>
    </div>
  );
}

function SessionActive({ stopSession, sendTextMessage, serverEvents, user, selectedScenario, selectedRole }) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }

  async function handleStopSession() {
    // First stop the session
    stopSession();
    
    // Then save the transcript if user is logged in
    if (user && serverEvents && serverEvents.length > 0) {
      try {
        const scenarioName = selectedScenario ? selectedScenario.name : 'Unknown Scenario';
        const roleName = selectedRole ? selectedRole.name : 'Unknown Role';
        
        // Save transcript to object storage through API
        await fetch('/api/transcripts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            transcript: serverEvents,
            scenarioName,
            roleName
          }),
        });
        
        console.log('Transcript saved successfully');
      } catch (error) {
        console.error('Failed to save transcript:', error);
      }
    }
  }

  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim()) {
            handleSendClientEvent();
          }
        }}
        type="text"
        placeholder="send a text message..."
        className="border border-gray-200 rounded-full p-4 flex-1"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        onClick={() => {
          if (message.trim()) {
            handleSendClientEvent();
          }
        }}
        icon={<MessageSquare height={16} />}
        className="bg-blue-400"
      >
        send text
      </Button>
      <Button onClick={handleStopSession} icon={<CloudOff height={16} />}>
        disconnect
      </Button>
    </div>
  );
}