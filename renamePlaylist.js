// let container = document.querySelector('.main-view-container');
// container.addEventListener('click', function (e) {
//     if (e.target.classList.contains('extension-rename-playlist')) {
//         let newName = prompt('Enter new name');
//         let playlistEl = e.target.parentElement.firstElementChild;
//         playlistEl.textContent = newName;
//         let playlistId = playlist.href.match(/playlist\/(.+)/)[1];
//         let reqB = {
//             name: newName
//         };
//         request(reqB, playlistId);
//     }
// })

(function () {
    window.addEventListener('durationRendered', init);

    function init(e) {
        currUser.getId()
            .then((userId) => renderGlyphicon(userId, e.message))
            .then((glyphicon) => glyphicon.addEventListener('click', handler))
            .catch();
    }

    function renderGlyphicon(currentUser, playlistId) {
        const mainContainer = document.querySelector('.main-view-container');
        const playlistAnchor = mainContainer.querySelector(`[href='/playlist/${playlistId}']`);
        const playlistNode = playlistAnchor.closest('.media-object');
        if (playlistNode.querySelector(`[href='/user/${currentUser}']`)) {
            const duration = playlistNode.getElementsByClassName('extension-list-duration')[0];
            duration.insertAdjacentHTML('beforeend', '<a href= ""> <span class="extension-rename-playlist" title="Rename playlist"> &#xF1E2;</span></a>');
            const glyphiconNode = playlistNode.getElementsByClassName('extension-rename-playlist')[0];
            glyphiconNode.style.fontFamily = 'glue1-spoticon';
            return Promise.resolve(glyphiconNode);
        } else return Promise.reject('Not allowed to rename this playlist');
    }

    function handler(event) {
        event.preventDefault();
        const playlistAnchor = event.target.closest('.mo-info').querySelector('.mo-info-name');
        const playlistId = playlistAnchor.href.match(/playlist\/(.+)/)[1];
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.placeholder = playlistAnchor.textContent;
        textInput.style.color = 'black';
        playlistAnchor.replaceWith(textInput);
        textInput.focus();
        textInput.onblur = () => textInput.replaceWith(playlistAnchor);
        document.addEventListener('keydown', (event) => {
            console.log(event.key);
            if (event.key === 'Enter') {
                playlistAnchor.textContent = textInput.value;
                textInput.replaceWith(playlistAnchor);
                http.put({name:textInput.value}, playlistId)
                    .catch(console.log);
            } else if (event.key === 'Escape') {
                textInput.replaceWith(playlistAnchor);
            }
        })
    }

    const currUser = {
        getId() {
            return http.get('https://api.spotify.com/v1/me')
                .then(user => user.id);
        }
    };

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
                        reject(new Error(xhr.statusText));
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
                        reject(new Error(xhr.statusText));
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