import React, { useState } from "react";
import ScenarioSelector from "./ScenarioSelector";
import EventLog from "./EventLog";
import VideoCard from "./VideoCard";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);

  const startSession = () => {
    setIsSessionActive(true);
  };

  const stopSession = () => {
    setIsSessionActive(false);
  };

  const sendClientEvent = (event) => {
    setEvents(prev => [event, ...prev]);
  };

  const sendTextMessage = (text) => {
    setEvents(prev => [{
      type: "text.message",
      text,
      event_id: Date.now().toString()
    }, ...prev]);
  };

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <h1>Voice chat app</h1>
        </div>
      </nav>
      <main className="fixed top-16 left-0 right-0 bottom-0 overflow-hidden">
        <div className="flex h-full bg-gray-50">
          <section className="w-2/5 p-4">
            {isSessionActive ? <EventLog events={events} /> : <ScenarioSelector />}
          </section>
          <section className="w-3/5 p-4">
            <VideoCard 
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              serverEvents={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </div>
      </main>
    </>
  );
}