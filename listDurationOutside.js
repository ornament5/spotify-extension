(function () {
    // window.addEventListener('load', duration.init);
    chrome.runtime.onMessage.addListener(request => request.message === 'runOutside' && setTimeout(() => duration.init(), 200));

    const duration = {
        init() {
            if (document.querySelector('.extension-list-duration')) {
                return;
            } else {
                if (token.isActive()) {
                    this.display();
                } else {
                    if (window.location.href.includes('access_token')) {
                        const tokenObject = token.extract(window.location.href);
                        token.setToStorage(tokenObject);
                        this.display();
                    } else {
                        token.request();
                    }
                }
            }
        },
        display() {
            const playlistsCollection = document.querySelectorAll('.Root__main-view div>a[href^="/playlist/"]');
            playlists.getCurrentUser().then((userId) => {
                for (const playlistNode of playlistsCollection) {
                    const playlistId = playlists.extractId(playlistNode);
                    playlists.getDuration(playlistId, playlistNode)
                        .then((duration) => playlists.renderDuration(duration))
                        .then(() => utility.sendEvent('durationRendered', {playlistId, userId}))
                        .catch(error => console.log(error));
                }
            })
        }
    }

    const token = {
        request() {
            const requestURL = 'https://accounts.spotify.com/authorize?client_id=4033df41b69c46598a007e72e87448a1&redirect_uri=https://open.spotify.com/collection/playlists&scope=playlist-read-private%20playlist-read-collaborative%20playlist-modify-public%20playlist-modify-private&response_type=token'
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
        padWithZero(timeUnit) {
            return timeUnit < 10 ? `0${timeUnit}` : `${timeUnit}`;
        },
        sendEvent(eventType, message) {
            const event = new CustomEvent(eventType);
            event.message = message;
            dispatchEvent(event);
        },
        httpGet(url){
            const accessToken = token.getFromStorage().id;
            return new Promise(function (resolve, reject) {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                xhr.onload = function () {
                    if (xhr.status == 200) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject(new Error(xhr.status));
                    }
                };
                xhr.onerror = function () {
                    reject(new Error("Network Error - please try again"));
                };
                xhr.send();
            });
        }
    };

    const playlists = {
        extractId(playlistNode) {
            const playlistUrl = playlistNode.href,
                playlistId = playlistUrl.match(/playlist\/(.+)/)[1];
            return playlistId;
        },
        getDuration(playlistId, playlistNode) {
            return utility.httpGet(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(duration_ms))`)
                .then(duration => {
                    const playlistDuration = utility.trackTimeAdder(duration);
                    return {
                        playlistDuration,
                        playlistNode
                    }
                });
        },
        renderDuration({
            playlistDuration,
            playlistNode
        }) {
            const playlistDurationFormatted = utility.generateDurationInDisplayFormat(playlistDuration);
            playlistNode.parentElement.insertAdjacentHTML('afterend', `<div class='extension-list-duration'><span>${playlistDurationFormatted}</span></div>`);
        },
        getCurrentUser(){
            return utility.httpGet('https://api.spotify.com/v1/me').then(user => user.id);
        }

    };
})();