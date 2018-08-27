/*

1. ------ DONE -------  a. ako u local Storageu nema tokena 
                                       ILI je token istekao, 
                           salje zahtev za token i otvara stranicu za autorizaciju:
                                  window.location.href = https://accounts.spotify.com/authorize?client_id=4033df41b69c46598a007e72e87448a1&redirect_uri=https://open.spotify.com/collection/playlists&scope=playlist-read-private%20playlist-read-collaborative&response_type=token
                        b. ako nema plejlisti, ali je token tu i nije istekao idi na korak 4.
                            metode:
                              handler

2. vraca na redirect URi, koji je https://open.spotify.com/collection/playlists, zajedno sa tokenom

3. ------ DONE ------- izvlaci i cuva token iz url-a, i njegovo vreme trajanja u local storage-u - DONE
                            metode:
                                extractTokenInfo("https://example.com/callback#access_token=NwAExz...BV3O2Tk&token_type=Bearer&expires_in=3600")
                                store(name, data) 

4. ------ DONE ------- skuplja id-jeve plejlisti, koji se nalaze u a.mo-info-name elementu, u objekat i cuva u Local Storage key = playlist id, value = null 
                            metode: 
                                getPlaylistIds(HTMLCollection)
                                store(name, data)

5. ------ DONE ------- salje Get Single Playlist`s Tracks request
                             metode:
                                getSinglePlaylistTracksDuration

6. ------ DONE ------- za svaku plejlistu preko loopa
                            metode:
                                getAllPlaylistsTracksDuration

7. ------ DONE ------- racuna ukupno trajanje svake plejliste 
                            metode:
                                trackTimeAdderInSeconds

8. ------ DONE ------- storuje trajanje svake plejliste u sekundama u localStorage-u
                            metode:
                                storeSinglePlaylistTracksDuration
9. ------ DONE ------- formatira trajanje u sekundama u string "00h:00m:00s"
                            metode:
                                timeFormatter

10.  ------ DONE -------ubacuje trajanje svake plejliste ispod odgovarajuceg a.mo-info-name elementa
                            metode:
                                insertSinglePlaylistDuration
                                insertAllPlaylistsDurations

*/

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
  if (isStored(`token`) && !isExpired(getFromStorage(`token`).expires)) {
    takeCareOfBusiness();
  } else {
    if (window.location.href.includes(`access_token`)) {
      let token = extractTokenInfo(window.location.href);
      store(`token`, token);
      takeCareOfBusiness();
    } else {
      requestToken();
    }
  }
}

function takeCareOfBusiness() {
  storeAllPlaylistIds();
  getAllPlaylistDurations();
  setTimeout(() => insertAllPlaylistsDurations(), 500);
}

// -----------------Token Functions--------------- //
function requestToken() {
  let requestURL = `https://accounts.spotify.com/authorize?client_id=4033df41b69c46598a007e72e87448a1&redirect_uri=https://open.spotify.com/collection/playlists&scope=playlist-read-private%20playlist-read-collaborative&response_type=token`
  window.location.href = requestURL;
}

function isExpired(expirationTime) {
  return Date.now() + 1000 > expirationTime;
}

function extractTokenInfo(urlString) {
  let tokenId = urlString.match(/access_token=(.+?)&/) ? urlString.match(/access_token=(.+?)&/)[1] : null,
    tokenDuration = urlString.match(/expires_in=(.+?)$/) ? urlString.match(/expires_in=(.+?)$/)[1] : null,
    expirationTime = tokenDuration ? Date.now() + Number(tokenDuration) * 1000 : 0;
  return {
    id: tokenId,
    expires: expirationTime
  }
}

// -----------------Storage Util Functions--------------- //
function store(name, data) {
  localStorage.setItem(name, JSON.stringify(data));
}

function getFromStorage(name) {
  if (!isStored(name)) {
    return null;
  }
  let storedData = localStorage.getItem(name);
  return JSON.parse(storedData);
}

function isStored(key) {
  if (localStorage.getItem(key)) return true;
  return false;
}

// -----------------Time Util Functions--------------- //
function trackTimeAdderInSeconds(tracks) {
  let totalDuration = 0;
  for (let trackObject of tracks.items) {
    totalDuration += Math.floor(trackObject.track.duration_ms / 1000);
  }
  return totalDuration;
}

function timeFormatter(timeInSecs) {
  let hours = Math.floor(timeInSecs / 3600),
    mins = Math.floor((timeInSecs - hours * 3600) / 60),
    secs = timeInSecs - (hours * 3600) - (mins * 60);
  let hoursString = hours < 10 ? `0` + hours : `` + hours,
    minsString = mins < 10 ? `0` + mins : `` + mins,
    secsString = secs < 10 ? `0` + secs : `` + secs;
  return hoursString + `h:` + minsString + `m:` + secsString + `s`;
}

// -----------------PlaylistIDs Functions for DOM Nodes--------------- //
function getSinglePlaylistId(playlistNode) {
  let playlistUrl = playlistNode.href,
    playlistId = playlistUrl.match(/playlist\/(.+)/)[1];
  return playlistId;
}

function getAllPlaylistIds(playlistsCollection) {
  let playlists = {};
  for (let i = 0; i < playlistsCollection.length; i++) {
    let playlistId = getSinglePlaylistId(playlistsCollection[i]);
    playlists[playlistId] = "";
  }
  return playlists;
}

function storeAllPlaylistIds() {
  let playlistsCollection = document.querySelectorAll(".mo-info-name"),
    playlistsData = getAllPlaylistIds(playlistsCollection);
  store("playlists", playlistsData);
}

// -----------------Playlist Duration Functions with Spotify API calls--------------- //
function getSinglePlaylistDuration(playlistId, accessToken) {
  let xhr = new XMLHttpRequest(),
    requestURL = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(duration_ms))`;
  xhr.open("GET", requestURL);
  xhr.setRequestHeader(`Authorization`, `Bearer ${accessToken}`);
  xhr.onreadystatechange = function () {
    if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
      storeSinglePlaylistDuration(playlistId, JSON.parse(xhr.responseText));
    }
  }
  xhr.send();
}

function getAllPlaylistDurations() {
  let token = getFromStorage("token").id,
    allPlaylistIds = Object.keys(getFromStorage("playlists"));
  for (let playlistId of allPlaylistIds) {
    getSinglePlaylistDuration(playlistId, token);
  }
}

function storeSinglePlaylistDuration(playlistId, tracks) {
  let storedPlaylists = getFromStorage("playlists");
  storedPlaylists[playlistId] = trackTimeAdderInSeconds(tracks);
  store("playlists", storedPlaylists);
}

// -----------------Insert playlist duration HTML functions--------------- //
function insertSinglePlaylistDuration(playlistNode) {
  let playlistId = getSinglePlaylistId(playlistNode),
    playlistDuration = getFromStorage(`playlists`)[playlistId],
    playlistDurationFormatted = timeFormatter(playlistDuration);
  playlistNode.insertAdjacentHTML(`afterend`, `<p>${playlistDurationFormatted}</p>`);

}

function insertAllPlaylistsDurations() {
  let playlistsCollection = document.querySelectorAll(".mo-info-name");
  for (let singlePlaylist of playlistsCollection) {
    insertSinglePlaylistDuration(singlePlaylist);
  }
}

//Authorization token request URL   https://accounts.spotify.com/authorize?client_id=4033df41b69c46598a007e72e87448a1&redirect_uri=https://open.spotify.com/collection/playlists&scope=playlist-read-private%20playlist-read-collaborative&response_type=token
//Get playlists tracks URL  https://api.spotify.com/v1/playlists/{playlist_id}/tracks?fields=items(track(duration_ms))