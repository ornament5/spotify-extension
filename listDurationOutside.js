(function () {
  window.addEventListener('duration', handler);
  window.addEventListener('load', handler);
  chrome.runtime.onMessage.addListener(request => request.message === 'done' && handler());

  function handler() {
    return utility.urlIncludes('https://open.spotify.com/collection/playlists') && setTimeout(init, 500); // Zasto Timeout? Ako se direktno otvori stranica sa plejlistama, prvi put ne stigne da pokupi podatke pa bude NaNh:NaNm:NaNs 
  }

  function init() {
    if (token.isActive()) {
      displayDuration();
    } else {
      if (utility.urlIncludes('access_token')) {
        const tokenObject = token.extract(window.location.href);
        appStorage.set('token', tokenObject);
        displayDuration();
      } else {
        token.request();
      }
    }
  }

  function displayDuration() {
    const playlists = Object.keys(playlistIds.setAll());
    playlistDurations.getAll(playlists);
    setTimeout(playlistDurations.renderAll.bind(playlistDurations), 500);
  }

  const token = {
    request() {
      const requestURL = 'https://accounts.spotify.com/authorize?client_id=4033df41b69c46598a007e72e87448a1&redirect_uri=https://open.spotify.com/collection/playlists&scope=playlist-read-private%20playlist-read-collaborative&response_type=token'
      window.location.href = requestURL;
    },
    extract(urlString) {
      const tokenId = urlString.match(/access_token=(.+?)&/) ? urlString.match(/access_token=(.+?)&/)[1] : null,
        tokenDuration = urlString.match(/expires_in=(.+?)$/) ? urlString.match(/expires_in=(.+?)$/)[1] : null,
        expirationTime = tokenDuration ? Date.now() + Number(tokenDuration) * 1000 : 0;
      return {
        id: tokenId,
        expiresAt: expirationTime
      };
    },
    isActive() {
      const isExpired = Date.now() + 1000 > appStorage.get('token').expiresAt;
      return appStorage.get('token') && !isExpired;
    },

  };

  const appStorage = {
    set(name, data) {
      localStorage.setItem(name, JSON.stringify(data));
    },
    get(name) {
      if (!localStorage.getItem(name)) {
        return null;
      }
      const storedData = localStorage.getItem(name);
      return JSON.parse(storedData);
    }
  };

  const utility = {
    trackTimeAdder(tracks) {
      let totalDuration = 0;
      for (const trackObject of tracks.items) {
        totalDuration += Math.floor(trackObject.track.duration_ms / 1000);
      }
      return totalDuration;
    },
    generateDurationInDisplayFormat(timeInSecs) {
      const hours = Math.floor(timeInSecs / 3600),
        mins = Math.floor((timeInSecs - hours * 3600) / 60),
        secs = timeInSecs - (hours * 3600) - (mins * 60);

      const displayHours = `${this.padWithZero(hours)}h`,
        displayMins = `${this.padWithZero(mins)}m`,
        displaySecs = `${this.padWithZero(secs)}s`;

      return `${displayHours}:${displayMins}:${displaySecs}`;
    },
    urlIncludes(partOfUrl) {
      return window.location.href.includes(partOfUrl);
    },
    padWithZero(timeUnit) {
      return timeUnit < 10 ? `0${timeUnit}` : `${timeUnit}`;
    }
  };

  const playlistIds = {
    getSingle(playlistNode) {
      const playlistUrl = playlistNode.href,
        playlistId = playlistUrl.match(/playlist\/(.+)/)[1];
      return playlistId;
    },
    getAll(playlistsCollection) {
      const playlists = {};
      for (let i = 0; i < playlistsCollection.length; i++) {
        let playlistId = this.getSingle(playlistsCollection[i]);
        playlists[playlistId] = '';
      }
      return playlists;
    },
    setAll() {
      const playlistsCollection = document.querySelectorAll('.mo-info-name'),
        playlistsData = this.getAll(playlistsCollection);
      appStorage.set('playlists', playlistsData);
      return playlistsData;
    }
  };

  const playlistDurations = {
    getSingle(playlistId, accessToken) {
      const xhr = new XMLHttpRequest(),
        requestURL = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(duration_ms))`,
        self = this;
      xhr.open('GET', requestURL);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          self.setSingle(playlistId, JSON.parse(xhr.responseText));
        }
      }
      xhr.send();
    },
    getAll(allPlaylistIds) {
      const token = appStorage.get('token').id;
      for (const playlistId of allPlaylistIds) {
        this.getSingle(playlistId, token);
      }
    },
    setSingle(playlistId, tracks) {
      let storedPlaylists = appStorage.get('playlists');
      storedPlaylists[playlistId] = utility.trackTimeAdder(tracks);
      appStorage.set('playlists', storedPlaylists);
    },
    renderSingle(playlistNode) {
      const playlistId = playlistIds.getSingle(playlistNode),
        playlistDuration = appStorage.get('playlists')[playlistId],
        playlistDurationFormatted = utility.generateDurationInDisplayFormat(playlistDuration);
      playlistNode.insertAdjacentHTML('afterend', `<p class="extension-list-duration">${playlistDurationFormatted}</p>`);
    },
    renderAll() {
      const playlistsCollection = document.querySelectorAll('.mo-info-name');
      for (const singlePlaylist of playlistsCollection) {
        this.renderSingle(singlePlaylist);
      }
    }
  };
})();
