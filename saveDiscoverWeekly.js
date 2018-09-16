(function () {

    window.addEventListener('discover', init);
    window.addEventListener('load', init);

    function init(event) {
        if (event.type === 'load') {
            if (util.isInitiatedByUser()) {
                runWithTokenCheck();
            }
        } else {
            runWithTokenCheck();
        }

    }

    function runWithTokenCheck() {
        if (token.isActive()) {
            discoverWeekly.copy();
        } else {
            const currentUrl = window.location.href;
            if (currentUrl.includes('access_token')) {
                const tokenObject = token.extract(window.location.href);
                token.setToStorage(tokenObject);
                localStorage.removeItem('initiatedByUser');
                discoverWeekly.copy();
            } else {
                localStorage.setItem('initiatedByUser', true);
                token.request();
            }
        }
    }

    const util = {
        isInitiatedByUser() {
            return !!localStorage.getItem('initiatedByUser');
        },
        getCurrentWeek() {
            const now = new Date();
            const yearStart = new Date(now.getFullYear(), 0);
            const msInWeek = 1000 * 60 * 60 * 24 * 7;
            return Math.ceil((now - yearStart) / msInWeek);
        }


    }

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

    const discoverWeekly = {
        get(url) {
            const accessToken = token.getFromStorage().id;
            return new Promise(function (resolve, reject) {
                const req = new XMLHttpRequest();
                req.open('GET', url);
                req.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                req.onload = function () {
                    if (req.status == 200) {
                        resolve(JSON.parse(req.response));
                    } else {
                        reject(Error(req.statusText));
                    }
                };

                req.onerror = function () {
                    reject(Error("Network Error - - please try again"));
                };

                req.send();
            });
        },
        post(url, requestBody) {
            const accessToken = token.getFromStorage().id;
            return new Promise(function (resolve, reject) {
                const req = new XMLHttpRequest();
                req.open('POST', url);
                req.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                req.setRequestHeader('Content-Type', 'application/json');
                req.onload = function () {
                    if (req.status == 200 || req.status == 201) {
                        resolve(JSON.parse(req.response));
                    } else {
                        reject(new Error(req.statusText));
                    }
                };
                req.onerror = function () {
                    reject(new Error('Network Error - please try again'));
                };
                req.send(JSON.stringify(requestBody));
            });
        },
        copy() {
            // Get all current user's playlists 
            this.get('https://api.spotify.com/v1/me/playlists').then(response => {
                if (this.isAlreadySaved(response)) {
                    return Promise.reject(new Error('This weeks Discover Weekly playlist has already been saved!'));
                } else {
                    const discoverPlaylist = response.items.filter(playlist => playlist.name === 'Discover Weekly')[0];
                    const url = discoverPlaylist.tracks.href;
                    // Get al tracks of the Discover playlist    
                    return this.get(url);
                }
            }).then(response => {
                const discoverTracks = response.items.map(item => item.track.uri);
                // Get the current user's ID
                this.get('https://api.spotify.com/v1/me').then(response => {
                    const currentUsersId = response.id;
                    const currentWeek = util.getCurrentWeek();
                    // Create a new playlist for the current user
                    this.post(`https://api.spotify.com/v1/users/${currentUsersId}/playlists`, {
                        name: `My Discover Weekly - Week ${currentWeek}`,
                        public: false
                    }).then(response => {
                        const playlistId = response.id;
                        // Add tracks from the Discover playlist to the newly created playlist            
                        this.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, discoverTracks);
                        window.location.reload(true);
                    });
                });
            }, error => console.log(error.message));
        },
        isAlreadySaved(playlists) {
            const currentWeek = util.getCurrentWeek();
            return playlists.items.some(playlist => playlist.name === `My Discover Weekly - Week ${currentWeek}`);
        }
    };
}());