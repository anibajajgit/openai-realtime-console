
import React from "react";

export default function EventLog({ events }) {
  if (!Array.isArray(events)) return null;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 max-h-[calc(100vh-8rem)] overflow-y-auto shadow-md w-full">
      <h2 className="text-lg font-semibold mb-4">Conversation Transcript</h2>
      <div className="flex flex-col gap-3">
        {events
          .slice()
          .reverse()
          .map((event) => {
            if (event?.item?.type === 'message' && event?.item?.content?.[0]?.text) {
              return (
                <div 
                  key={event.event_id} 
                  className={`p-3 rounded-lg ${
                    event.item.role === 'user' 
                      ? 'bg-blue-100 ml-auto' 
                      : 'bg-gray-100'
                  } max-w-[80%]`}
                >
                  <div className="text-sm text-gray-600 mb-1">
                    {event.item.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div>{event.item.content[0].text}</div>
                </div>
              );
            }
            return null;
          })}
      </div>
    </div>
  );
}
