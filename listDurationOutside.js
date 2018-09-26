(function () {
	window.addEventListener('duration', init);
	// window.addEventListener('load', init);
	chrome.runtime.onMessage.addListener(request => request.message === 'tabUpdated' && init());

	function init() {
		return utility.urlIncludes('https://open.spotify.com/collection/playlists') && setTimeout(() => duration.runWithTokenCheck(), 200);
	}

	const duration = {
		runWithTokenCheck() {
			if (token.isActive()) {
				this.display();
			} else {
				if (utility.urlIncludes('access_token')) {
					const tokenObject = token.extract(window.location.href);
					token.setToStorage(tokenObject);
					this.display();
				} else {
					token.request();
				}
			}
		},
		display() {
			const playlistsCollection = document.querySelectorAll('.mo-info-name');
			for (const playlistNode of playlistsCollection) {
				const playlistId = playlists.extractId(playlistNode);
				playlists.getDuration(playlistId, playlistNode)
					.then((duration) => playlists.renderDuration(duration))
					.catch(error => console.log(error));
			}
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
		urlIncludes(partOfUrl) {
			return window.location.href.includes(partOfUrl);
		},
		padWithZero(timeUnit) {
			return timeUnit < 10 ? `0${timeUnit}` : `${timeUnit}`;
		}
	};

	const playlists = {
		extractId(playlistNode) {
			const playlistUrl = playlistNode.href,
				playlistId = playlistUrl.match(/playlist\/(.+)/)[1];
			return playlistId;
		},
		getDuration(playlistId, playlistNode) {
			const accessToken = token.getFromStorage().id;
			return new Promise((resolve, reject) => {
				const xhr = new XMLHttpRequest(),
					requestURL = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(duration_ms))`;
				xhr.open('GET', requestURL);
				xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
				xhr.onload = function () {
					if (xhr.status === 200) {
						const playlistDuration = utility.trackTimeAdder(JSON.parse(xhr.responseText));
						resolve({
							playlistDuration,
							playlistNode
						});
					} else {
						reject(new Error(xhr.statusText));
					}
				};
				xhr.send();
			});
		},
		renderDuration({
			playlistDuration,
			playlistNode
		}) {
			if (playlistNode.nextElementSibling) return;
			const playlistDurationFormatted = utility.generateDurationInDisplayFormat(playlistDuration);
			playlistNode.insertAdjacentHTML('afterend', `<br><span class='extension-list-duration'>${playlistDurationFormatted}</span>`);
		}
	};
})();