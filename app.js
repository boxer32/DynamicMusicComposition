document.addEventListener('DOMContentLoaded', function () {
  const NUM_STEMS_PER_FOLDER = 10;

  let audioContext = new (window.AudioContext || window.webkitAudioContext)();


  let userStemChoices = {};
  let audioSources = [];
  let isAudioPlaying = false;
  

  function initAudioContext() {
      if (audioContext.state === 'closed') {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
  }

  async function getIpAddress() {
    try {
        // Add a timestamp to the request to avoid caching
        const timestamp = new Date().getTime();
        const response = await fetch(`https://api.ipify.org?format=json&t=${timestamp}`);
        const data = await response.json();
        return data.ip;
        //return '171.28.62.85'; // Fallback IP
    } catch (error) {
        console.error('Error fetching IP address:', error);
        return '111.111.111.111'; // Fallback IP
    }
}

  function getUserStemChoice(userIpAddress) {
      const digits = userIpAddress.split('').reverse().filter((char) => char !== '.').map(Number);
      const drumIndex = digits[0] % NUM_STEMS_PER_FOLDER;
      const bassIndex = digits[1] % NUM_STEMS_PER_FOLDER;
      const chordIndex = digits[2] % NUM_STEMS_PER_FOLDER;
      const melodyIndex = digits[3] % NUM_STEMS_PER_FOLDER;
      const fxIndex = digits[4] % NUM_STEMS_PER_FOLDER;
      const percIndex = digits[5] % NUM_STEMS_PER_FOLDER;
      const tranIndex = digits[6] % NUM_STEMS_PER_FOLDER;
      const vinlIndex = digits[7] % NUM_STEMS_PER_FOLDER;

      return {
          drum: drumIndex,
          bass: bassIndex,
          chord: chordIndex,
          melody: melodyIndex,
          fx: fxIndex,
          perc: percIndex,
          tran: tranIndex,
          vinl: vinlIndex,
      };
  }

  async function loadAndPlayStems() {
      const ipAddress = await getIpAddress();
      userStemChoices = getUserStemChoice(ipAddress);
      console.log('User IP Address:', ipAddress);
      console.log('User Stem Choices:', userStemChoices);

      stopAudio();
      bufferLoader.load();
  }

  function stopAudio() {
    audioSources.forEach(source => {
        // Check if the source is playing before trying to stop it
        if (source.buffer && source.playbackState === source.PLAYING_STATE) {
            source.stop();
        }
    });
    audioSources = [];
    isAudioPlaying = false;
}

  document.addEventListener('click', async function () {
      initAudioContext();

      if (!isAudioPlaying) {
          await loadAndPlayStems();
          isAudioPlaying = true;
      } else {
          stopAudio();
      }
  });

  function finishedLoading(bufferList) {
    // Stop any currently playing audio first
    stopAudio();

    // Now load and play the new buffers
    bufferList.forEach((buffer, index) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0); // Start the source immediately
        audioSources.push(source);
    });

    isAudioPlaying = true;
}

  function BufferLoader(stemNames, callback) {
      this.stemNames = stemNames;
      this.onload = callback;
      this.bufferList = new Array(stemNames.length);
      this.loadCount = 0;
  }

  BufferLoader.prototype.loadBuffer = function (stemName, index) {
      const url = `${stemName}/${userStemChoices[stemName]}.wav`;
      console.log(`Loading audio file: ${url}`);

      const request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';

      const loader = this;

      request.onload = function () {
          audioContext.decodeAudioData(request.response, function (buffer) {
              if (!buffer) {
                  console.error('Error decoding file data: ' + url);
                  return;
              }
              loader.bufferList[index] = buffer;
              if (++loader.loadCount === loader.stemNames.length) {
                  loader.onload(loader.bufferList);
              }
          }, function (error) {
              console.error('decodeAudioData error', error);
          });
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

  const stemNames = ['drum', 'bass', 'chord', 'melody', 'fx', 'perc','tran','vinl'];
  const bufferLoader = new BufferLoader(stemNames, finishedLoading);
});
