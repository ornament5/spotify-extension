/*

1.

1. Get Current Users Playlists : https://api.spotify.com/v1/me/playlists
   response.items.filter(playlist.name = "Discover Weekly") => tracks.href 
   return user + discover playlists tracks

2.Get playlists tracks sa outputom prethodnog requesta

3. Create a playlist: POST https://api.spotify.com/v1/users/{user_id}/playlists
    + Content-type header application/json
    + "{\"name\":\"A New Playlist\", \"public\":false}"
    returns playlist object, with id
4. Add Tracks to a Playlist  POST https://api.spotify.com/v1/playlists/{playlist_id}/tracks
    + Content-type header application/json      
     A JSON array of the Spotify track URIs to add. For example: {"uris": ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh","spotify:track:1301WleyT98MSxVHPZCA6M"]}



*/

(function () {
    const token = {
        request() {
            const requestURL = 'https://accounts.spotify.com/authorize?client_id=4033df41b69c46598a007e72e87448a1&redirect_uri=https://open.spotify.com/collection/playlists&scope=playlist-read-private%20playlist-read-collaborative%20playlist-modify-private%20playlist-modify-public&response_type=token'
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
        setToStorage(data) {
            localStorage.setItem('token', JSON.stringify(data));
        },
        getFromStorage() {
            if (!localStorage.getItem('token')) {
                return null;
            }
            const storedData = localStorage.getItem('token');
            return JSON.parse(storedData);
        },
        isActive() {
            return this.getFromStorage() ?
                Date.now() + 1000 < this.getFromStorage().expiresAt :
                false;
        }
    };

//runWithTokenCheck
    function init() {
        if (token.isActive()) {
            // something
        } else {
            if (utility.urlIncludes('access_token')) {
                const tokenObject = token.extract(window.location.href);
                token.setToStorage(tokenObject);
                //something

            } else {
                token.request();
            }
        }
    }


    function get(url) {
        // Return a new promise.
        const accessToken = token.getFromStorage().id;
        return new Promise(function (resolve, reject) {
            // Do the usual XHR stuff
            const req = new XMLHttpRequest();
            req.open('GET', url);
            req.setRequestHeader('Authorization', `Bearer ${accessToken}`);

            req.onload = function () {
                // This is called even on 404 etc
                // so check the status
                if (req.status == 200) {
                    // Resolve the promise with the response text
                    resolve(JSON.parse(req.response));
                } else {
                    // Otherwise reject with the status text
                    // which will hopefully be a meaningful error
                    reject(Error(req.statusText));
                }
            };

            // Handle network errors
            req.onerror = function () {
                reject(Error("Network Error"));
            };

            // Make the request
            req.send();
        });
    }


    function post(url, requestBody) {
        // Return a new promise.
        const accessToken = token.getFromStorage().id;
        return new Promise(function (resolve, reject) {
            // Do the usual XHR stuff
            const req = new XMLHttpRequest();
            req.open('POST', url);
            req.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            req.setRequestHeader('Content-Type', 'application/json');

            req.onload = function () {
                if (req.status == 200 || req.status == 201) {
                    resolve(JSON.parse(req.response));
                } else {
                    reject(Error(req.statusText));
                }
            };

            req.onerror = function () {
                reject(Error("Network Error"));
            };

            req.send(JSON.stringify(requestBody));
        });
    }

    get('https://api.spotify.com/v1/me/playlists').then(response => {
        const discoverPlaylist = response.items.filter(playlist => playlist.name === 'Discover Weekly')[0];
        console.log(discoverPlaylist);
        const url = discoverPlaylist.tracks.href;
        return get(url);
    }).then(response => {
        const discoverTracks = response.items.map(item => item.track.uri);
        console.log(discoverTracks);
        post('https://api.spotify.com/v1/users/ornament5/playlists', {name:"A New Playlist", public:false}).then(response => {
             const playlistId = response.id;
             post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, discoverTracks);
             window.location.reload(true);
        });
    });
}());