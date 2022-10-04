(function () {
    window.addEventListener('durationRendered', init);

    function init(e) {
        const {playlistId, userId} = e.message;
        renderGlyphicon(userId, playlistId)
            .then((glyphicon) => glyphicon && glyphicon.addEventListener('click', rename))
    }

    function renderGlyphicon(currentUser, playlistId) {
        const mainContainer = document.querySelector('.contentSpacing');
        const playlistAnchor = mainContainer.querySelector(`[href='/playlist/${playlistId}']`);
        const playlistUser = playlistAnchor.nextElementSibling.firstElementChild ? playlistAnchor.nextElementSibling.firstElementChild.textContent: "";
        if (playlistUser.includes(currentUser)) {
            const penSymbol = '<svg role="img" height="14" width="14" aria-hidden="true" viewBox="0 0 24 24" class="Svg-ytk21e-0 jAKAlG"><path d="M17.318 1.975a3.329 3.329 0 114.707 4.707L8.451 20.256c-.49.49-1.082.867-1.735 1.103L2.34 22.94a1 1 0 01-1.28-1.28l1.581-4.376a4.726 4.726 0 011.103-1.735L17.318 1.975zm3.293 1.414a1.329 1.329 0 00-1.88 0L5.159 16.963c-.283.283-.5.624-.636 1l-.857 2.372 2.371-.857a2.726 2.726 0 001.001-.636L20.611 5.268a1.329 1.329 0 000-1.879z"></path></svg>'
            playlistAnchor.insertAdjacentHTML('afterend', `<span class="extension-rename-playlist" title="Rename playlist"><a href="#">${penSymbol}</a></span>`);
            const glyphiconNode = playlistAnchor.nextElementSibling.firstElementChild;
            return Promise.resolve(glyphiconNode);
        }
        else {
            return Promise.resolve();
        }
    }

    function rename(event) {
        event.preventDefault();
        console.log(event.target)
        const playlistAnchor = event.target.parentElement.parentElement.previousElementSibling;
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