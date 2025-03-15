class AudioRecorder {
  constructor() {
    // Use localStorage instead of Replit database for browser compatibility
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
    // Define constants that might have been using process.env
    this.STORAGE_PREFIX = 'recording_';
  }

  async startRecording(stream) {
    try {
      if (this.isRecording) {
        console.log('Recording already in progress');
        return;
      }

      // Create a new audio context to handle microphone input
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);

      // Create a destination for recording
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(destination.stream);
      this.audioChunks = [];

      // Event handler for data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  }

  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        console.log('No recording in progress');
        resolve(null);
        return;
      }

      // Create event handler for recording stopped
      this.mediaRecorder.onstop = async () => {
        try {
          console.log('Recording stopped, processing audio...');
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const timestamp = new Date().toISOString();
          const fileName = `recording-${timestamp}.webm`;

          // Store in Replit Storage
          await this.storeRecording(fileName, audioBlob);

          this.isRecording = false;
          this.audioChunks = [];
          resolve(fileName);
        } catch (error) {
          console.error('Error processing recording:', error);
          reject(error);
        }
      };

      // Stop the recording
      this.mediaRecorder.stop();
    });
  }

  async storeRecording(fileName, blob) {
    try {
      // Convert blob to base64
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Store in localStorage
      localStorage.setItem(fileName, base64);
      console.log(`Recording saved to localStorage as ${fileName}`);

      // Save a list of recordings
      let recordings = [];
      try {
        const existingRecordings = localStorage.getItem('recordings');
        if (existingRecordings) {
          recordings = JSON.parse(existingRecordings);
        }
      } catch (e) {
        console.log('No existing recordings found');
      }

      recordings.push({
        fileName,
        timestamp: new Date().toISOString(),
        size: blob.size
      });

      localStorage.setItem('recordings', JSON.stringify(recordings));
      return fileName;
    } catch (error) {
      console.error('Error storing recording:', error);
      throw error;
    }
  }

  async getRecordings() {
    try {
      const recordingsData = localStorage.getItem('recordings');
      if (recordingsData) {
        return JSON.parse(recordingsData);
      }
      return [];
    } catch (error) {
      console.error('Error getting recordings list:', error);
      return [];
    }
  }

  async getRecording(fileName) {
    try {
      const base64Data = localStorage.getItem(fileName);
      if (!base64Data) {
        throw new Error('Recording not found');
      }

      // Convert base64 back to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new Blob([bytes], { type: 'audio/webm' });
    } catch (error) {
      console.error('Error retrieving recording:', error);
      throw error;
    }
  }
}

export default new AudioRecorder();