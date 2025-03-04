import React, { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

export default function SessionControls({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
}) {
  return (
    <div className="flex gap-4 border-t-2 border-gray-200 h-full rounded-md relative z-20">
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
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

function SessionActive({ stopSession, sendTextMessage }) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
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

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button icon={<CloudOff height={16} />}>
            disconnect
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>End Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this session? Your conversation will be saved for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                stopSession();
                // Show the confirmation dialog after ending the session
                setTimeout(() => {
                  // Create a React-based dialog instead of direct DOM manipulation
                  // Import React components we need at the top of the file
                  const { useNavigate } = require('react-router-dom');
                  const navigate = useNavigate();
                  
                  // Create a dialog element using React's approach
                  const confirmDialog = document.createElement('div');
                  confirmDialog.className = "fixed inset-0 bg-black/80 z-[200] flex items-center justify-center";
                  
                  // Add the dialog content
                  confirmDialog.innerHTML = `
                    <div class="bg-white p-6 rounded-lg max-w-md w-full">
                      <h3 class="text-xl font-semibold">Session Ended</h3>
                      <p class="text-gray-500 my-2">Feedback on this conversation will be processed and can be reviewed in the Review pane.</p>
                      <div class="flex justify-end gap-2 mt-4">
                        <button id="try-again-btn" class="px-4 py-2 border rounded">Try Again</button>
                        <button id="review-btn" class="px-4 py-2 bg-red-600 text-white rounded">Review Feedback</button>
                      </div>
                    </div>
                  `;
                  
                  document.body.appendChild(confirmDialog);
                  
                  // Add event listeners with proper React Router navigation
                  document.getElementById('try-again-btn').addEventListener('click', () => {
                    confirmDialog.remove();
                  });
                  
                  document.getElementById('review-btn').addEventListener('click', () => {
                    try {
                      confirmDialog.remove();
                      console.log("Navigating to review page...");
                      // Use window.location.pathname which is more reliable
                      window.location.pathname = '/review';
                    } catch (error) {
                      console.error("Navigation error:", error);
                      // Fallback in case of error
                      window.location.href = window.location.origin + '/review';
                    }
                  });
                }, 500);
              }} 
              className="bg-red-600 text-white hover:bg-red-700"
            >
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}