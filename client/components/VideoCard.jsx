import React from 'react';
import SessionControls from './SessionControls';

export default function VideoCard({ startSession, stopSession, sendClientEvent, sendTextMessage, serverEvents, isSessionActive }) {
  return (
    <div className="bg-indigo-100 rounded-lg p-6 h-full shadow-md flex flex-col gap-4">
      <div className="flex-grow relative w-full bg-blue-100 rounded-lg overflow-hidden">
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
          className="w-full h-full object-cover"
          playsInline
          muted
        />
      </div>
      <SessionControls
        startSession={startSession}
        stopSession={stopSession}
        sendClientEvent={sendClientEvent}
        sendTextMessage={sendTextMessage}
        serverEvents={serverEvents}
        isSessionActive={isSessionActive}
      />
    </div>
  );
}