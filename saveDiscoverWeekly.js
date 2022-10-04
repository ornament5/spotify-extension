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
                            // Returns the ISO week of the date.
            Date.prototype.getWeek = function() {
                const date = new Date(this.getTime());
                date.setHours(0, 0, 0, 0);
            // Thursday in current week decides the year.
                date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
            // January 4 is always in week 1.
                const week1 = new Date(date.getFullYear(), 0, 4);
            // Adjust to Thursday in week 1 and count number of weeks from date to week1.
                return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                                            - 3 + (week1.getDay() + 6) % 7) / 7);
            }
            return new Date().getWeek();
        }
    };

    const http = {
        get(url) {
            const accessToken = token.getFromStorage().id;
            return new Promise(function (resolve, reject) {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                xhr.onload = function () {
                    if (xhr.status == 200) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject(new Error(xhr.statusText));
                    }
                };
                xhr.onerror = function () {
                    reject(new Error("Network Error - please try again"));
                };
                xhr.send();
            });
        },
        post(url, requestBody) {
            const accessToken = token.getFromStorage().id;
            return new Promise(function (resolve, reject) {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url);
                xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onload = function () {
                    if (xhr.status == 200 || xhr.status == 201) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject(new Error(xhr.statusText));
                    }
                };
                xhr.onerror = function () {
                    reject(new Error('Network Error - please try again'));
                };
                xhr.send(JSON.stringify(requestBody));
            });
        }
    };

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

    const playlist = {
        create(user) {
            const currentUsersId = user.id;
            const currentWeek = util.getCurrentWeek();
            const options = {
                name: `My Discover Weekly - Week ${currentWeek}/${new Date().getFullYear()}`,
                public: true
            };
            return http.post(`https://api.spotify.com/v1/users/${currentUsersId}/playlists`, options);
        },
        addTracks(playlist) {
            const playlistId = playlist.id;
            http.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, this.trackUris);
            window.location.reload(true);
        },
        getTrackUris(tracks) {
            this.trackUris = tracks.items.map(item => item.track.uri);
        }
    };

    const discoverWeekly = {
        translations: ['Discover Weekly','Descubrimiento Semanal','Descobertas da Semana','Découvertes de la semaine','Dein Mix der Woche','Viikon suositukset',
                       'E Heti Kaland','Odkryj w tym tygodniu','Haftalık Keşifler','每週新發現'],
        copy() { // Get all current user's playlists
            http.get('https://api.spotify.com/v1/me/playlists')
                .then(this.isAlreadySaved)
                .then(this.getTracksEndpoint.bind(this))
                .then(playlist.getTrackUris)
                .then(() => http.get('https://api.spotify.com/v1/me')) // Get the current user
                .then(playlist.create)
                .then(playlist.addTracks)
                .catch(error => alert(error.message));
        },
        getTracksEndpoint(playlists) {
            const discoverPlaylist = playlists.items.filter(playlist => discoverWeekly.translations.includes(playlist.name))[0];
            const tracksUrl = discoverPlaylist.tracks.href;
            return http.get(tracksUrl);
        },
        isAlreadySaved(playlists) {
            const currentWeek = util.getCurrentWeek();
            const isSaved = playlists.items.some(playlist => playlist.name === `My Discover Weekly - Week ${currentWeek}/${new Date().getFullYear()}`);
               return isSaved ? Promise.reject(new Error(`This week's Discover Weekly playlist has already been saved!`)) : playlists;
        }
    };
   
    const infoToaster = {
        create(text) {
            const container = document.createElement('div');
            container.insertAdjacentHTML(`afterbegin`,`<p>${text}</p>`);
            return container;
        },
        addStyles(toasterContainer) {
            const containerStyles = `width:15rem;
                                    height:4rem;
                                    position:fixed;
                                    top:20vh;
                                    right:-50vw;
                                    box-sizing:border-box;
                                    font:12px Arial,Helvetica,sans-serif;
                                    color:white;
                                    padding:0.6em;
                                    background:linear-gradient(#00d2ff 0%,#3a7bd5 100%);
                                    transition:right 1.5s cubic-bezier(0.68,-0.55,0.27,1.55);`; 
            const paragraphStyles = `margin:0 auto;
                                    position:absolute;
                                    top:50%;
                                    `;

          toasterContainer.setAttribute('style', containerStyles);
          toasterContainer.firstElementChild.setAttribute('style', paragraphStyles);
          return toasterContainer;
        },
        show(text) {
            const toaster = this.addStyles(this.create(text));
            const body = document.body;
            body.appendChild(toaster);            
            setTimeout(() => toaster.style.right = '1.5vw', 0);
            setTimeout(() => toaster.style.right = '-50vw', 3000);
        },
    };
}());


// transform:translateY(-50%);
