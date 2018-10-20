(function () {
    window.addEventListener('durationRendered', init);

    function init(e) {
        const {playlistId, userId} = e.message;
        renderGlyphicon(userId, playlistId)
            .then((glyphicon) => glyphicon && glyphicon.addEventListener('click', rename))
    }

    function renderGlyphicon(currentUser, playlistId) {
        const mainContainer = document.querySelector('.main-view-container');
        const playlistAnchor = mainContainer.querySelector(`[href='/playlist/${playlistId}']`);
        const playlistNode = playlistAnchor.closest('.media-object');
        if (playlistNode.querySelector(`[href='/user/${currentUser}']`)) {
            const duration = playlistNode.getElementsByClassName('extension-list-duration')[0];
            duration.insertAdjacentHTML('beforeend', '<span class="extension-rename-playlist" title="Rename playlist"><a href="#">&#xF1E2;</a></span>');
            const glyphiconNode = playlistNode.getElementsByClassName('extension-rename-playlist')[0];
            glyphiconNode.style.fontFamily = 'glue1-spoticon';
            glyphiconNode.style.marginLeft = '4px';
            return Promise.resolve(glyphiconNode);
        }
        else {
            return Promise.resolve();
        }
    }

    function rename(event) {
        event.preventDefault();
        const playlistAnchor = event.target.closest('.mo-info').querySelector('.mo-info-name');
        const playlistId = playlistAnchor.href.match(/playlist\/(.+)/)[1];

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = playlistAnchor.textContent;
        textInput.style.color = 'black';

        playlistAnchor.replaceWith(textInput);
        textInput.focus();
        textInput.select();

        textInput.onblur = () => textInput.replaceWith(playlistAnchor);
        document.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                playlistAnchor.textContent = textInput.value;
                http.put({ name: textInput.value}, playlistId).catch(error => console.log(error));
                textInput.blur();                
            } else if (event.key === 'Escape') {
                textInput.blur();
            }
        })
    }

    const http = {
        get(url) {
            const token = JSON.parse(localStorage.getItem('token')).id;
            return new Promise(function (resolve, reject) {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
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
        },
        put(newName, playlistId) {
            const token = JSON.parse(localStorage.getItem('token')).id;
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const requestURL = `https://api.spotify.com/v1/playlists/${playlistId}`;
                xhr.open('PUT', requestURL);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onload = function () {
                    if (xhr.status == 200) {
                        resolve('Playlist renamed succesfully');
                    } else {
                        reject(new Error(xhr.status));
                    }
                };
                xhr.onerror = function () {
                    reject(new Error('Network Error - please try again'));
                };
                xhr.send(JSON.stringify(newName));
            })
        }
    };
}());