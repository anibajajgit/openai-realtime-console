import React, { useState, useEffect, useRef, useContext } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import ScenarioSelector from "./ScenarioSelector";
import EventLog from "./EventLog";
import Home from "./Home";
import Login from "./Login"; //New Component
import Review from "./Review"; //Review Component
import "../base.css";
import SessionControls from "./SessionControls";
import { AuthContext, AuthProvider } from "../utils/AuthContext"; // Assuming AuthContext is in ../utils
import { BorderTrail } from './BorderTrail';

export default function App() {
  // Get user from context if available, otherwise null
  const authContext = useContext(AuthContext);
  const user = authContext ? authContext.user : null;
  const [events, setEvents] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const audioRef = useRef(null); // Added audioRef
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState(null); // Add state for selected role
  const [selectedScenario, setSelectedScenario] = useState(null); // Add state for selected scenario
  const navigate = useNavigate(); //Import and use useNavigate
  const sessionRecorder = useRef(null); // Reference for the session recorder
  const userVideoStream = useRef(null); // Reference for the user's video stream
  const [recordingBlob, setRecordingBlob] = useState(null); // State to hold the recorded blob
  const [recordingUrl, setRecordingUrl] = useState(null); // State to hold the recorded blob URL
  const currentTranscriptId = useRef(null); // Ref to store the transcript ID after saving
  const [isUploading, setIsUploading] = useState(false); // State to track upload progress

  const loginApp = (userData) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      // Only call login if authContext exists
      if (authContext && authContext.login) {
        authContext.login(userData);
      }
      console.log("User logged in:", userData);
    }
  };

  const logoutApp = () => {
    localStorage.removeItem('user');
    // Only call logout if authContext exists
    if (authContext && authContext.logout) {
      authContext.logout();
    }
    console.log("User logged out");
  };

  useEffect(() => {
    console.log("App component mounted with user:", user);

    // Check if we're in the login state but actually have a user in localStorage
    if (!user && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            console.log("Found user in localStorage, restoring:", parsedUser);
            if (authContext && authContext.login) {
              authContext.login(parsedUser);
            }
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }
    }
  }, [user, authContext]);

  // Listen for the custom navigation event
  useEffect(() => {
    const handleNavigateToReview = () => {
      // Use React Router's navigate function
      navigate('/review');
    };

    // Add event listener
    window.addEventListener('navigateToReview', handleNavigateToReview);

    // Cleanup
    return () => {
      window.removeEventListener('navigateToReview', handleNavigateToReview);
    };
  }, [navigate]);

  async function startSession() {
    try {
      setIsSessionActive(true);

      if (!selectedRole || !selectedScenario) {
        console.error("Role or scenario not selected");
        return;
      }

      // Fetch the token using selected role and scenario
      const tokenResponse = await fetch(`/token?roleId=${selectedRole.id}&scenarioId=${selectedScenario.id}`);
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || "Failed to generate token");
      }

      const { token } = await tokenResponse.json();

      // Use RTCPeerConnection to establish a media connection
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
        ],
      });

      // Get the user's video and audio stream for display
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        // Store the stream reference for later use
        userVideoStream.current = userStream;

        // Initialize the session recorder with the video stream
        const SessionRecorder = (await import('../utils/SessionRecorder')).default;
        sessionRecorder.current = new SessionRecorder();
        await sessionRecorder.current.initialize(userStream, userStream);

        // We don't need to call addMicrophoneAudio separately as it's handled in initialize

        // Start recording
        sessionRecorder.current.startRecording();
        console.log('Session recording started');
      } catch (mediaError) {
        console.error("Error accessing media devices:", mediaError);
        // Continue without recording if media access fails
      }

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      peerConnection.current.addTrack(ms.getTracks()[0]);

      const dc = peerConnection.current.createDataChannel("oai-events");
      setDataChannel(dc);

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await peerConnection.current.setRemoteDescription(answer);

      // Add event listeners to the data channel to handle the responses
      dataChannel.addEventListener("open", () => {
        console.log("Data channel opened");
        // Send an initial message to start the conversation
        sendClientEvent({
          type: "conversation.create",
        });
      });

      // Set up AI audio capture for recording
      if (audioElement.current && sessionRecorder.current) {
        // Wait for the audio to start playing
        audioElement.current.addEventListener('playing', () => {
          try {
            // Get the audio stream from the audio element for recording
            const audioStream = audioElement.current.captureStream 
              ? audioElement.current.captureStream() 
              : audioElement.current.mozCaptureStream();

            // Add the AI audio to the recorder
            sessionRecorder.current.addAIAudio(audioStream);
            console.log('AI audio added to recording');
          } catch (error) {
            console.error('Error capturing AI audio for recording:', error);
          }
        }, { once: true });
      }

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


      peerConnection.current.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

      setEvents((prev) => [...prev, { type: "system", message: "Starting session..." }]);
      setIsSessionActive(true);

      dc.onopen = () => console.log("WebRTC Data Channel opened");
      const events = [];
      dc.onmessage = (messageEvent) => {
        console.log(`Raw event data: ${messageEvent.data}`);
        const data = JSON.parse(messageEvent.data);
        console.log(`Parsed event:`, data);
        events.push(data);
        setEvents(events);
      };

      const localAnswer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(localAnswer);

      // Wait for ICE gathering to complete
      let offerSdp;
      if (peerConnection.current.localDescription.sdp) {
        offerSdp = peerConnection.current.localDescription.sdp;
      } else {
        offerSdp = await new Promise((resolve) => {
          const maxAttempts = 30; // give up eventually
          let attempts = 0;
          const intervalId = setInterval(() => {
            if (
              peerConnection.current.localDescription &&
              peerConnection.current.localDescription.sdp &&
              peerConnection.current.iceGatheringState === "complete"
            ) {
              clearInterval(intervalId);
              resolve(peerConnection.current.localDescription.sdp);
            }
            if (attempts >= maxAttempts) {
              clearInterval(intervalId);
              resolve(peerConnection.current.localDescription?.sdp || "");
              console.error("Gave up waiting for ICE gathering to complete");
            }
            attempts++;
          }, 100);
        });
      }
    } catch (error) {
      console.error("Error starting session:", error);
      setEvents((prev) => [...prev, { type: "error", message: `Failed to start session: ${error.message}` }]);
    }
  }

  async function saveTranscript() {
    if (events.length === 0 || !user) {
      console.log("No events to save or user not logged in");
      return null;
    }

    try {
      // Aggregate AI responses to form transcript content
      const transcript = events
        .filter(event => event.type === 'response_audio_transcript_delta')
        .map(event => event?.payload?.text || '')
        .join('');

      if (!transcript.trim()) {
        console.log("No transcript content to save");
        return null;
      }

      // Extract role and scenario IDs
      const roleId = selectedRole?.id;
      const scenarioId = selectedScenario?.id;

      // Create a request body with all necessary details
      const requestBody = {
        content: transcript,
        userId: user.id,
        roleId: roleId,
        scenarioId: scenarioId,
        title: `Conversation with ${selectedRole?.name || 'AI'}`,
        hasRecording: true  // Flag to indicate this transcript will have a recording
      };

      console.log("Saving transcript:", requestBody);

      // Send the transcript to the server
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save transcript: ${errorData.error || response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Transcript saved successfully:", responseData);

      // Store the transcript ID for the recording upload
      currentTranscriptId.current = responseData.transcript.id;

      // Create and dispatch a custom event to navigate to the review page
      const customEvent = new CustomEvent('navigateToReview', {
        detail: { transcriptId: responseData.transcript.id }
      });
      window.dispatchEvent(customEvent);

      return responseData.transcript.id;
    } catch (error) {
      console.error("Error saving transcript:", error);
      return null;
    }
  }


  async function stopSession() {
    try {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      if (dataChannel) {
        dataChannel.close();
        setDataChannel(null);
      }

      if (audioElement.current && audioElement.current.srcObject) {
        audioElement.current.srcObject.getTracks().forEach((track) => track.stop());
        audioElement.current.srcObject = null;
      }

      // Stop all tracks in the user video stream
      if (userVideoStream.current) {
        userVideoStream.current.getTracks().forEach(track => track.stop());
      }

      // Stop recording and get the recorded blob
      if (sessionRecorder.current) {
        try {
          const recordedBlob = await sessionRecorder.current.stopRecording();
          setRecordingBlob(recordedBlob);

          // Store the blob URL for potential preview
          const blobUrl = URL.createObjectURL(recordedBlob);
          setRecordingUrl(blobUrl);

          console.log("Session recording stopped, preparing to upload...");

          // Save transcript first to get the transcript ID
          const transcriptId = await saveTranscript();

          // Upload the recording if we have a transcript ID
          if (transcriptId) {
            await uploadRecording(recordedBlob, transcriptId);
          }

          // Clean up recorder resources
          sessionRecorder.current.dispose();
          sessionRecorder.current = null;
        } catch (recorderError) {
          console.error("Error stopping recording:", recorderError);
        }
      }

      setIsSessionActive(false);
    } catch (error) {
      console.error("Error stopping session:", error);
      setIsSessionActive(false);
    }
  }

  /**
   * Upload the recording to the server
   * @param {Blob} blob - The recording blob to upload
   * @param {string|number} transcriptId - The associated transcript ID
   */
  async function uploadRecording(blob, transcriptId) {
    try {
      setIsUploading(true);
      console.log(`Uploading recording for transcript ${transcriptId}...`);

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('recording', blob, `session-${transcriptId}.webm`);
      formData.append('transcriptId', transcriptId);

      // Send the recording to the server
      const response = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Recording uploaded successfully:", result);

      // Clean up the blob URL
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(null);
      }

      setRecordingBlob(null);
    } catch (error) {
      console.error("Error uploading recording:", error);
    } finally {
      setIsUploading(false);
    }
  }

  function sendClientEvent(message) {
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

  function sendTextMessage(message) {
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

  useEffect(() => {
    if (dataChannel) {
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

      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  useEffect(() => {
    console.log("Session active state changed:", isSessionActive);

    if (isSessionActive && audioRef.current) {
      console.log("Attempting to play call sound");

      // Use Web Audio API as a more reliable solution
      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz tone
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // 50% volume

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          console.log("Beep sound completed");
        }, 500); // Play for 500ms

        console.log("Playing beep sound with Web Audio API");
      } catch (e) {
        console.error("Web Audio API failed:", e);

        // Fallback to standard audio element
        try {
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 0.5;
          audioRef.current.muted = false;
          audioRef.current.load();

          console.log("Attempting standard audio playback");
          audioRef.current.play()
            .then(() => console.log("Standard audio playback succeeded"))
            .catch(err => console.error("Standard audio playback failed:", err));
        } catch (audioError) {
          console.error("All audio playback methods failed:", audioError);
        }
      }
    } else if (!isSessionActive && audioRef.current) {
      // Stop audio when session ends
      console.log("Stopping audio playback");
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isSessionActive]);


  return (
    <AuthContext.Provider value={{ user, login: loginApp, logout: logoutApp }}>
      {console.log("AuthContext Provider rendering with user:", user)}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} /> {/*Login Route*/}
        <Route path="/review" element={
          user ? (
            <>
              <Review />
            </>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/scenarios" element={
          user ? (
            <>
              <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
                <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
                  <h1>Scenarios</h1>
                </div>
              </nav>
              <main className="fixed top-16 left-0 right-0 bottom-0 overflow-auto md:overflow-hidden relative z-20"> {/* Increased z-index to stay above overlay */}
                <div className={`flex flex-col md:flex-row h-full bg-gray-50 relative ${isSessionActive ? 'border-2 border-transparent rounded-lg p-2' : ''}`}> 
                  {isSessionActive && <BorderTrail className="bg-blue-500" size={15} />}
                  <AppSidebar />
                  <div className="w-full md:w-2/5 overflow-auto">
                    {!isSessionActive && <h2 className="text-xl font-semibold">Choose a scenario</h2>}
                    <section className="w-full p-4 scenario-section">
                      {isSessionActive ? <EventLog events={events} /> : <ScenarioSelector />}
                    </section>
                  </div>
                  <section className="w-full md:w-3/5 p-6 flex flex-col gap-6 bg-blue-50 rounded-lg relative flex-grow">
                    {/* Avatar photo container */}
                    {console.log("Selected role:", selectedRole)}
                    <div className="absolute top-6 left-6 w-1/5 aspect-square rounded-lg overflow-hidden shadow-md border-2 border-red-500 bg-white z-10">
                      {selectedRole ? (
                        <img 
                          src={`/attached_assets/${selectedRole.name.split(' ')[0].toLowerCase()}.jpg`}
                          alt={`${selectedRole.name} avatar`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log(`Failed to load image: ${e.target.src}`);
                            // Try direct test-image route as fallback
                            const firstName = selectedRole.name.split(' ')[0].toLowerCase();
                            e.target.src = `/test-image/${firstName}`;

                            // Add a second error handler for the fallback attempt
                            e.target.onerror = () => {
                              console.log(`Fallback image also failed: ${e.target.src}`);
                              // Use a data URI placeholder as last resort
                              e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22150%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23e0e0e0%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2230%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3E${firstName.charAt(0).toUpperCase()}%3C%2Ftext%3E%3C%2Fsvg%3E';
                            };
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300">
                          {/* Empty gray screen when no role is selected */}
                        </div>
                      )}
                    </div>
                    <div className={`bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-5 h-[400px] md:h-[500px] w-4/5 ml-auto 
                      ${isSessionActive ? '' : ''}`}>
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
                        stopSession={stopSession}  //Corrected stopSession call
                        sendClientEvent={sendClientEvent}
                        sendTextMessage={sendTextMessage}
                        serverEvents={events}
                        isSessionActive={isSessionActive}
                      />
                    </div>
                  </section>
                </div>
              </main>
            </>
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
      {/* Audio element for call sound */}
      <audio 
        ref={audioRef} 
        preload="auto"
        id="callSound"
        muted={false}
      >
        <source src="/attached_assets/call-sound.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Overlay when session is active */}
      {isSessionActive && (
        <div className="absolute inset-0 bg-black/40 pointer-events-none z-5">
          {/* This overlay should have a lower z-index than the main container */}
        </div>
      )}
    </AuthContext.Provider>
  );
}


// SessionRecorder import is handled with dynamic import

  startRecording = async () => {
    const stream = new MediaStream([
      ...this.videoStream.getVideoTracks(), 
      ...this.mixedStream.getAudioTracks(),
    ]);
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    this.mediaRecorder.start();
    this.recordedChunks = [];
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
  }


  async stopRecording() {
    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        resolve(blob);
      };
      this.mediaRecorder.onerror = (error) => reject(error);
      this.mediaRecorder.stop();
    });
  }

  dispose() {
    this.mediaRecorder = null;
    this.audioContext.close();
  }
}