import React, { useEffect, useRef } from "react";

export default function EventLog({ events }) {
  const transcriptRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [events]);

  if (!Array.isArray(events) || events.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 h-full shadow-md w-full">
        <h2 className="text-lg font-semibold mb-4">Conversation Transcript</h2>
        <p className="text-gray-500">No messages yet</p>
      </div>
    );
  }

  return (
    <div 
      ref={transcriptRef}
      className="bg-white/90 backdrop-blur-sm rounded-lg p-4 max-h-[calc(100vh-8rem)] overflow-y-auto shadow-md w-full"
    >
      <h2 className="text-lg font-semibold mb-4">Conversation Transcript</h2>
      <div className="flex flex-col gap-3">
        {events.map((event) => {
          let text = '';
          let isUser = false;

          switch (event.type) {
            case "audio.transcription":
              if (event.speech_final) {
                text = event.text;
                isUser = true;
              }
              break;
            case "response.text.done":
              text = event.text;
              isUser = false;
              break;
            case "response.audio_transcript.done":
              text = event.transcript;
              isUser = false;
              break;
          }

          if (!text) return null;

          return (
            <div 
              key={event.event_id} 
              className={`p-3 rounded-lg ${
                isUser ? 'bg-blue-100' : 'bg-gray-100'
              } max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}
            >
              <div className="text-sm text-gray-600 mb-1">
                {isUser ? 'You' : 'Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}