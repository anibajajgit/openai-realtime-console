import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import HomePage from '../pages/HomePage';
import ScenariosPage from '../pages/ScenariosPage';  
import TranscriptsPage from '../pages/TranscriptsPage';
import SettingsPage from '../pages/SettingsPage';
import LandingPage from '../pages/LandingPage';
import ScenarioSelector from './ScenarioSelector';
import EventLog from './EventLog';
import SessionControls from './SessionControls';
import '../base.css';

export default function App() {
  const [events, setEvents] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const startSession = () => {
    setIsSessionActive(true);
  };

  const stopSession = () => {
    setIsSessionActive(false);
  };

  const sendClientEvent = (eventType, data) => {
    // Implementation for sending client events
    console.log("Sending client event:", eventType, data);
  };

  const sendTextMessage = (message) => {
    // Implementation for sending text messages
    console.log("Sending text message:", message);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scenarios" element={
            <div className="flex flex-col md:flex-row h-full bg-gray-50">
              <section className="w-full md:w-2/5 p-4">
                {isSessionActive ? <EventLog events={events} /> : <ScenarioSelector />}
              </section>
              <section className="w-full md:w-3/5 p-6 flex flex-col gap-6 bg-blue-50 rounded-lg">
                <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-5 h-[400px] md:h-[500px] w-4/5 ml-auto">
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
                    className="h-full w-full aspect-video object-cover rounded-lg"
                    playsInline
                    muted
                  />
                </div>
                <div className="h-24 md:h-32">
                  <SessionControls
                    startSession={startSession}
                    stopSession={stopSession}
                    sendClientEvent={sendClientEvent}
                    sendTextMessage={sendTextMessage}
                    events={events}
                    isSessionActive={isSessionActive}
                    onAudioTranscript={(transcript) => {
                      setEvents(prev => [{
                        type: "audio.transcription",
                        transcript,
                        event_id: Date.now().toString()
                      }, ...prev]);
                    }}
                  />
                </div>
              </section>
            </div>
          } />
          <Route path="/transcripts" element={<TranscriptsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/landing" element={<LandingPage />} />
        </Routes>
      </main>
    </div>
  );
}