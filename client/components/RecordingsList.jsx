
import React, { useState, useEffect } from 'react';
import AudioRecorder from '../utils/AudioRecorder';

export default function RecordingsList() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRef = React.useRef(null);

  useEffect(() => {
    async function loadRecordings() {
      try {
        setLoading(true);
        const recordingsList = await AudioRecorder.getRecordings();
        setRecordings(recordingsList);
        setLoading(false);
      } catch (err) {
        console.error('Error loading recordings:', err);
        setError('Failed to load recordings');
        setLoading(false);
      }
    }

    loadRecordings();
  }, []);

  const playRecording = async (fileName) => {
    try {
      const blob = await AudioRecorder.getRecording(fileName);
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setCurrentlyPlaying(fileName);
        
        audioRef.current.onended = () => {
          setCurrentlyPlaying(null);
        };
      }
    } catch (err) {
      console.error('Error playing recording:', err);
      setError(`Failed to play recording: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-4">Loading recordings...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!recordings || recordings.length === 0) {
    return (
      <div className="p-4">
        <p>No recordings found. Complete a session to create a recording.</p>
        <button 
          onClick={() => AudioRecorder.debugStoredRecordings()} 
          className="mt-3 px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
        >
          Check for Recordings
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-5 mt-5">
      <h2 className="text-xl font-semibold mb-4">Session Recordings</h2>
      <audio ref={audioRef} className="hidden" controls />
      
      <div className="space-y-3">
        {recordings.map((recording, index) => (
          <div key={recording.fileName} className="border p-3 rounded-lg flex justify-between items-center">
            <div>
              <div className="font-medium">Recording {recordings.length - index}</div>
              <div className="text-sm text-gray-500">
                {new Date(recording.timestamp).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">
                {Math.round(recording.size / 1024)} KB
              </div>
            </div>
            <button
              onClick={() => playRecording(recording.fileName)}
              className={`px-4 py-2 rounded-md ${
                currentlyPlaying === recording.fileName
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {currentlyPlaying === recording.fileName ? 'Stop' : 'Play'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
