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
        {events.map((event, index) => {
          let text = '';
          let isUser = false;

          if (event.type === 'audio.transcription') {
            text = event.transcript;
            isUser = true;
          } else if (event.type === 'conversation.item.text' || event.type === 'conversation.item.create') {
            if (event.item?.content?.[0]?.text) {
              text = event.item.content[0].text;
              isUser = event.item.role === 'user';
            }
          }

          if (!text) return null;

          return (
            <div 
              key={event.event_id || index}
              className={`p-3 rounded-lg ${isUser ? 'bg-blue-100 ml-auto' : 'bg-gray-100'} max-w-[80%]`}
            >
              <p className="text-sm text-gray-600 mb-1">{isUser ? 'You' : 'Assistant'}</p>
              <p>{text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}