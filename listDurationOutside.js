// -----------------Event Listeners--------------- //
window.addEventListener(`duration`, handler);

window.addEventListener(`load`, handler);

chrome.runtime.onMessage.addListener(
  function (request) {
    // listen for tab updated messages sent from background.js
    if (request.message === `done`) {
      handler();
    }
  });


function handler() {
  if (window.location.href.includes("https://open.spotify.com/collection/playlists")) {
    setTimeout(() => go(), 500); // Zasto Timeout? Ako se direktno otvori stranica sa plejlistama, prvi put ne stigne da pokupi podatke pa bude NaNh:NaNm:NaNs 
  }
}

/* Main function that inserts each playlist's duration if the token is still valid OR 
   requests & stores a new token, if the current one is expired, and subsequently inserts total durations
*/
function go() {
  if (token.isActive()) {
    takeCareOfBusiness();
  } else {
    if (window.location.href.includes(`access_token`)) {
      let tokenObject = token.extract(window.location.href);
      appStorage.set(`token`, tokenObject);
      takeCareOfBusiness();
    } else {
      token.request();
    }
  }
}

function takeCareOfBusiness() {
  playlistIds.setAll();
  playlistDurations.getAll();
  setTimeout(() => playlistDurations.renderAll(), 500);
}

// -----------------Token Functions--------------- //
const token = {
  request() {
    let requestURL = `https://accounts.spotify.com/authorize?client_id=4033df41b69c46598a007e72e87448a1&redirect_uri=https://open.spotify.com/collection/playlists&scope=playlist-read-private%20playlist-read-collaborative&response_type=token`
    window.location.href = requestURL;
  },
  extract(urlString) {
    let tokenId = urlString.match(/access_token=(.+?)&/) ? urlString.match(/access_token=(.+?)&/)[1] : null,
      tokenDuration = urlString.match(/expires_in=(.+?)$/) ? urlString.match(/expires_in=(.+?)$/)[1] : null,
      expirationTime = tokenDuration ? Date.now() + Number(tokenDuration) * 1000 : 0;
    return {
      id: tokenId,
      expires: expirationTime
    }
  },
  isExpired(expirationTime) {
    return Date.now() + 1000 > expirationTime;
  },
  isActive() {
    return appStorage.get(`token`) && !this.isExpired(appStorage.get(`token`).expires);
  }

};

// -----------------Storage Util Functions--------------- //
const appStorage = {
  set(name, data) {
    localStorage.setItem(name, JSON.stringify(data));
  },
  get(name) {
    if (!localStorage.getItem(name)) {
      return null;
    }
    let storedData = localStorage.getItem(name);
    return JSON.parse(storedData);
  }
};

// -----------------Time Util Functions--------------- //
const util = {
  trackTimeAdder(tracks) {
    let totalDuration = 0;
    for (let trackObject of tracks.items) {
      totalDuration += Math.floor(trackObject.track.duration_ms / 1000);
    }
    return totalDuration;
  },

  timeFormatter(timeInSecs) {
    let hours = Math.floor(timeInSecs / 3600),
      mins = Math.floor((timeInSecs - hours * 3600) / 60),
      secs = timeInSecs - (hours * 3600) - (mins * 60);
    let hoursString = hours < 10 ? `0` + hours : `` + hours,
      minsString = mins < 10 ? `0` + mins : `` + mins,
      secsString = secs < 10 ? `0` + secs : `` + secs;
    return hoursString + `h:` + minsString + `m:` + secsString + `s`;
  }
};

// -----------------PlaylistIDs Functions for DOM Nodes--------------- //
const playlistIds = {
  getSingle(playlistNode) {
    let playlistUrl = playlistNode.href,
      playlistId = playlistUrl.match(/playlist\/(.+)/)[1];
    return playlistId;
  },
  getAll(playlistsCollection) {
    let playlists = {};
    for (let i = 0; i < playlistsCollection.length; i++) {
      let playlistId = this.getSingle(playlistsCollection[i]);
      playlists[playlistId] = "";
    }
    return playlists;
  },
  setAll() {
    let playlistsCollection = document.querySelectorAll(".mo-info-name"),
      playlistsData = this.getAll(playlistsCollection);
    appStorage.set("playlists", playlistsData);
  }
};

// -----------------Playlist Duration Functions with Spotify API calls--------------- //
const playlistDurations = {
  getSingle(playlistId, accessToken) {
    let xhr = new XMLHttpRequest(),
      requestURL = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(duration_ms))`
    self = this;
    xhr.open("GET", requestURL);
    xhr.setRequestHeader(`Authorization`, `Bearer ${accessToken}`);
    xhr.onreadystatechange = function () {
      if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
        self.setSingle(playlistId, JSON.parse(xhr.responseText));
      }
    }
    xhr.send();
  },
  getAll() {
    let token = appStorage.get("token").id,
      allPlaylistIds = Object.keys(appStorage.get("playlists"));
    for (let playlistId of allPlaylistIds) {
      this.getSingle(playlistId, token);
    }
  },
  setSingle(playlistId, tracks) {
    let storedPlaylists = appStorage.get("playlists");
    storedPlaylists[playlistId] = util.trackTimeAdder(tracks);
    appStorage.set("playlists", storedPlaylists);
  },
  renderSingle(playlistNode) {
    let playlistId = playlistIds.getSingle(playlistNode),
      playlistDuration = appStorage.get(`playlists`)[playlistId],
      playlistDurationFormatted = util.timeFormatter(playlistDuration);
    playlistNode.insertAdjacentHTML(`afterend`, `<p class="extension-lsit-duration">${playlistDurationFormatted}</p>`);
  },
  renderAll() {
    let playlistsCollection = document.querySelectorAll(".mo-info-name");
    for (let singlePlaylist of playlistsCollection) {
      this.renderSingle(singlePlaylist);
    }
  }
};



//Authorization token request URL   https://accounts.spotify.com/authorize?client_id=4033df41b69c46598a007e72e87448a1&redirect_uri=https://open.spotify.com/collection/playlists&scope=playlist-read-private%20playlist-read-collaborative&response_type=token
//Get playlists tracks URL  https://api.spotify.com/v1/playlists/{playlist_id}/tracks?fields=items(track(duration_ms))