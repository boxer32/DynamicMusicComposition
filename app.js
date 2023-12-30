document.addEventListener('DOMContentLoaded', function () {
    // Get the current hour
    const currentHour = new Date().getHours();

    // Get the cover element
    const coverElement = document.querySelector('.disco--cover');

    // Determine day or night based on the current hour
    const isDayTime = currentHour >= 6 && currentHour < 18;

    // Set the background image based on day or night
    if (isDayTime) {
        coverElement.style.backgroundImage = 'url(cover2.png)';
    } else {
        coverElement.style.backgroundImage = 'url(cover2.png)';
    }

    const NUM_STEMS_PER_FOLDER = 10; // Define the number of stems per folder
  
    let audioContext;
    let userStemChoices = {};
    let isAudioInitialized = false;
    let isAudioPlaying = false;
  
    // Function to initialize the audio context
    function initAudioContext() {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  
    // Function to get the user's IP address using ipify API
    function getIpAddress() {
      // Using a free API to get the IP address information
      return fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => data.ip)
        .catch(error => {
          console.error('Error fetching IP address:', error);
          // Fallback to a default IP address for demonstration purposes
          return '111.111.111.111';
        });
    }
  
    function getUserStemChoice(userIpAddress) {
      // Extract the digits from the IP address (start from the end and skip dots)
      const digits = userIpAddress
        .split('')
        .reverse()
        .filter((char) => char !== '.')
        .map(Number);
  
      const drumIndex = digits[0] % NUM_STEMS_PER_FOLDER;
      const bassIndex = digits[1] % NUM_STEMS_PER_FOLDER;
      const chordIndex = digits[2] % NUM_STEMS_PER_FOLDER;
      const melodyIndex = digits[3] % NUM_STEMS_PER_FOLDER;
      const fxIndex = digits[4] % NUM_STEMS_PER_FOLDER;
  
      return {
        drum: drumIndex,
        bass: bassIndex,
        chord: chordIndex,
        melody: melodyIndex,
        fx: fxIndex,
      };
    }
  
    const stemNames = ['drum', 'bass', 'chord', 'melody', 'fx'];
    const bufferLoader = new BufferLoader(stemNames, finishedLoading);
  
    // Click event to control audio
    document.addEventListener('click', function () {
      if (!isAudioInitialized) {
        initAudioContext();
        getIpAddress().then(ipAddress => {
          userStemChoices = getUserStemChoice(ipAddress);
          console.log('User IP Address:', ipAddress);
          console.log('User Stem Choices:', userStemChoices);
          bufferLoader.load();
        });
        isAudioInitialized = true;
      } else {
        if (!isAudioPlaying) {
          // Start playing
          for (let i = 0; i < stemNames.length; i++) {
            const source = audioContext.createBufferSource();
            source.buffer = bufferLoader.bufferList[i];
            source.connect(audioContext.destination);
            source.start(0);
          }
          isAudioPlaying = true;
        } else {
          // Stop playing
          audioContext.close();
          isAudioInitialized = false;
          isAudioPlaying = false;
        }
      }
    });
  
    function finishedLoading(bufferList) {
      // Rest of the code for handling the loaded buffers
      // ...
    }
  
    function BufferLoader(stemNames, callback) {
      this.stemNames = stemNames;
      this.onload = callback;
      this.bufferList = new Array(stemNames.length);
      this.loadCount = 0;
    }
  
    BufferLoader.prototype.loadBuffer = function (stemName, index) {
      const url = stemName + '/1.wav';
      const request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
  
      const loader = this;
  
      request.onload = function () {
        audioContext.decodeAudioData(
          request.response,
          function (buffer) {
            if (!buffer) {
              console.error('Error decoding file data: ' + url);
              return;
            }
            loader.bufferList[index] = buffer;
            if (++loader.loadCount === loader.stemNames.length) {
              loader.onload(loader.bufferList);
            }
          },
          function (error) {
            console.error('decodeAudioData error', error);
          }
        );
      };
  
      request.onerror = function () {
        console.error('BufferLoader: XHR error');
      };
  
      request.send();
    };
  
    BufferLoader.prototype.load = function () {
      for (let i = 0; i < this.stemNames.length; ++i) {
        this.loadBuffer(this.stemNames[i], i);
      }
    };
  });
  