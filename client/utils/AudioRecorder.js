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

      console.log('Starting new recording...');
      this.stream = stream;
      
      // Create media recorder directly from the stream
      const options = { mimeType: 'audio/webm' };
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];

      // Event handler for data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Got audio chunk of size: ${event.data.size} bytes`);
          this.audioChunks.push(event.data);
        }
      };

      // Start recording with 1 second intervals to collect chunks
      this.mediaRecorder.start(1000);
      this.isRecording = true;
      console.log('Recording started successfully');
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

      console.log('Stopping recording...');
      
      // Create event handler for recording stopped
      this.mediaRecorder.onstop = async () => {
        try {
          console.log(`Recording stopped, processing ${this.audioChunks.length} audio chunks...`);
          
          if (this.audioChunks.length === 0) {
            console.warn('No audio chunks were recorded');
            this.isRecording = false;
            resolve(null);
            return;
          }
          
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          console.log(`Created audio blob of size: ${audioBlob.size} bytes`);
          
          const timestamp = Date.now();
          const fileName = `recording-${timestamp}.webm`;

          // Store in localStorage
          const success = await this.storeRecording(fileName, audioBlob);
          
          if (success) {
            console.log(`Successfully saved recording as ${fileName}`);
            // Clean up
            if (this.stream) {
              this.stream.getTracks().forEach(track => track.stop());
              this.stream = null;
            }
            this.isRecording = false;
            this.audioChunks = [];
            resolve(fileName);
          } else {
            console.error('Failed to save recording');
            reject(new Error('Failed to save recording'));
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          reject(error);
        }
      };

      // Request final audio chunk then stop
      this.mediaRecorder.requestData();
      this.mediaRecorder.stop();
    });
  }

  async storeRecording(fileName, blob) {
    try {
      console.log(`Attempting to store recording ${fileName} (${blob.size} bytes)...`);
      
      // For larger files, use a more memory-efficient approach
      // Read the blob as an array buffer
      const buffer = await blob.arrayBuffer();
      console.log(`Converted blob to array buffer of length: ${buffer.byteLength}`);
      
      // Convert array buffer to base64 string in chunks to avoid memory issues
      const uint8Array = new Uint8Array(buffer);
      const chunkSize = 1024 * 1024; // Process 1MB at a time
      let base64 = '';
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64 += btoa(
          Array.from(chunk)
            .map(byte => String.fromCharCode(byte))
            .join('')
        );
      }
      
      console.log(`Converted to base64 string of length: ${base64.length}`);
      
      try {
        // Store in localStorage
        localStorage.setItem(fileName, base64);
        console.log(`Saved audio data to localStorage as ${fileName}`);
        
        // Update recordings list
        let recordings = [];
        const existingRecordings = localStorage.getItem('recordings');
        
        if (existingRecordings) {
          try {
            recordings = JSON.parse(existingRecordings);
            console.log(`Found ${recordings.length} existing recordings`);
          } catch (e) {
            console.warn('Error parsing existing recordings:', e);
          }
        }
        
        // Add new recording to the list
        recordings.push({
          fileName,
          timestamp: new Date().toISOString(),
          size: blob.size
        });
        
        localStorage.setItem('recordings', JSON.stringify(recordings));
        console.log(`Updated recordings list, now has ${recordings.length} items`);
        
        // Debug info to verify storage
        this.debugStoredRecordings();
        
        return true;
      } catch (storageError) {
        console.error('localStorage error:', storageError);
        
        // Check if it's a quota error
        if (storageError.name === 'QuotaExceededError' || 
            storageError.code === 22 || 
            storageError.code === 1014) {
          console.error('LocalStorage quota exceeded. Try clearing old recordings.');
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error in storeRecording:', error);
      return false;
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

  // Utility method to debug and list all stored recordings
  debugStoredRecordings() {
    try {
      console.log('--- Stored Recordings Debug Info ---');
      // Check localStorage for recordings list
      const recordingsData = localStorage.getItem('recordings');
      if (recordingsData) {
        const recordings = JSON.parse(recordingsData);
        console.log(`Found ${recordings.length} recordings in localStorage:`);
        recordings.forEach((rec, index) => {
          console.log(`[${index + 1}] ${rec.fileName} (${Math.round(rec.size / 1024)} KB) - ${new Date(rec.timestamp).toLocaleString()}`);
          // Verify the actual recording data exists
          const hasData = localStorage.getItem(rec.fileName) !== null;
          console.log(`   Data exists: ${hasData ? 'Yes' : 'No'}`);
        });
      } else {
        console.log('No recordings list found in localStorage');
      }
      
      // Look for other recording-related keys
      const recordingKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('recording-')) {
          recordingKeys.push(key);
        }
      }
      
      if (recordingKeys.length > 0) {
        console.log(`Found ${recordingKeys.length} recording files that may not be in the index:`);
        recordingKeys.forEach(key => console.log(`  ${key}`));
      }
      
      console.log('--- End Debug Info ---');
    } catch (error) {
      console.error('Error debugging recordings:', error);
    }
  }
}

const recorder = new AudioRecorder();
// Debug recordings on load
setTimeout(() => recorder.debugStoredRecordings(), 1000);
export default recorder;