
import React, { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";
import { Link, useNavigate } from "react-router-dom";
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
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const navigate = useNavigate();

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }

  function handleEndSession() {
    stopSession();
    // Show the feedback dialog
    setShowFeedbackDialog(true);
  }

  function handleNavigateToReview() {
    // Close the dialog and navigate to review page
    setShowFeedbackDialog(false);
    navigate('/review');
  }

  return (
    <>
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
                onClick={handleEndSession}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                End Session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Second dialog for Review Feedback */}
      {showFeedbackDialog && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold">Session Ended</h3>
            <p className="text-gray-500 my-2">
              Feedback on this conversation will be processed and can be reviewed in the Review pane.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setShowFeedbackDialog(false)} 
                className="px-4 py-2 border rounded"
              >
                Try Again
              </button>
              <Link 
                to="/review" 
                className="px-4 py-2 bg-red-600 text-white rounded inline-block"
                onClick={() => setShowFeedbackDialog(false)}
              >
                Review Feedback
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
