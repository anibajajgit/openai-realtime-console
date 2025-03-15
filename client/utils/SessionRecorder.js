
/**
 * SessionRecorder utility class
 * Handles recording of video feed and mixed audio streams
 */
export class SessionRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.audioContext = null;
    this.audioDestination = null;
    this.microphoneSource = null;
    this.aiAudioSource = null;
    this.mediaStream = null;
    this.outputStream = null;
    
    console.log('SessionRecorder instance created');
  }

  /**
   * Initialize the recorder with video and microphone streams
   * @param {MediaStream} videoStream - The camera feed stream
   * @param {MediaStream} microphoneStream - The user's microphone stream
   */
  async initialize(videoStream, microphoneStream) {
    try {
      // Create audio context for mixing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.audioDestination = this.audioContext.createMediaStreamDestination();
      
      // Set up microphone audio source
      if (microphoneStream) {
        this.microphoneSource = this.audioContext.createMediaStreamSource(microphoneStream);
        this.microphoneSource.connect(this.audioDestination);
      }
      
      // Create a composite stream with video from camera and mixed audio
      const videoTrack = videoStream.getVideoTracks()[0];
      
      // Create a new stream with the video track and the audio destination stream
      this.outputStream = new MediaStream();
      if (videoTrack) {
        this.outputStream.addTrack(videoTrack);
      }
      
      // Add the mixed audio track to the output stream
      this.audioDestination.stream.getAudioTracks().forEach(track => {
        this.outputStream.addTrack(track);
      });
      
      console.log('Session recorder initialized with streams', {
        videoTracks: this.outputStream.getVideoTracks().length,
        audioTracks: this.outputStream.getAudioTracks().length
      });
      
      this.mediaStream = this.outputStream;
    } catch (error) {
      console.error('Error initializing session recorder:', error);
    }
  }

  /**
   * Add an AI audio element to be recorded
   * @param {HTMLAudioElement} audioElement - The audio element playing AI responses
   */
  addAIAudioSource(audioElement) {
    if (!audioElement || !this.audioContext || !this.audioDestination) {
      console.warn('Cannot add AI audio source - recorder not fully initialized');
      return;
    }
    
    try {
      // Create a media element source from the audio element
      this.aiAudioSource = this.audioContext.createMediaElementSource(audioElement);
      
      // Connect to both the audio destination (for recording) and the audio context destination (for playback)
      this.aiAudioSource.connect(this.audioDestination);
      this.aiAudioSource.connect(this.audioContext.destination);
      
      console.log('AI audio source added to recorder');
    } catch (error) {
      console.error('Error adding AI audio source:', error);
    }
  }

  /**
   * Start recording the session
   */
  startRecording() {
    if (this.isRecording || !this.mediaStream) {
      console.warn('Cannot start recording - already recording or not initialized');
      return;
    }
    
    try {
      this.recordedChunks = [];
      
      // Set up MediaRecorder with the output stream (video + mixed audio)
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });
      
      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      // Start recording
      this.mediaRecorder.start(1000); // Capture in 1-second chunks
      this.isRecording = true;
      console.log('Session recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  /**
   * Stop recording and return the recorded data as a Blob
   * @returns {Promise<Blob>} The recorded video blob
   */
  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        console.warn('Cannot stop recording - not currently recording');
        reject(new Error('Not recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        try {
          const recordedBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
          this.isRecording = false;
          console.log(`Recording stopped. Size: ${recordedBlob.size} bytes`);
          resolve(recordedBlob);
        } catch (error) {
          reject(error);
        }
      };
      
      this.mediaRecorder.stop();
    });
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.microphoneSource) {
      this.microphoneSource.disconnect();
    }
    
    if (this.aiAudioSource) {
      this.aiAudioSource.disconnect();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    console.log('Session recorder resources disposed');
  }
}
