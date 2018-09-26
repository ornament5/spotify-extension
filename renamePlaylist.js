// let playlistDivs = document.getElementsByClassName('media-object');
// for (let pDiv of playlistDivs) {
//     if (pDiv.querySelector('[href="/user/ornament5"]')) {
//         let pDur = pDiv.getElementsByClassName('extension-list-duration')[0];
//         pDur.insertAdjacentHTML('afterend', '<span class="extension-rename-playlist" title="Rename playlist">&#xF1E2;</span>');
//         let pen = document.getElementsByClassName('extension-rename-playlist')[0];
//         pen.style.fontFamily = 'glue1-spoticon';

//     }
    
//     }
// let container = document.querySelector('.main-view-container');
// container.addEventListener('click', function(e) {
//      if (e.target.classList.contains('extension-rename-playlist')) {
//          let newName = prompt('Enter new name');
//          let playlistEl = e.target.parentElement.firstElementChild;
//          playlistEl.textContent = newName;
//          let playlistId = playlist.href.match(/playlist\/(.+)/)[1];
//          let reqB = {
//              name: newName
//          };
//          request(reqB, playlistId);         
//      }
// } )

// function request(name, playlistId) {
//  const xhr = new XMLHttpRequest(),
//                  requestURL = `https://api.spotify.com/v1/playlists/${playlistId}`;
//              xhr.open('PUT', requestURL);
//              xhr.setRequestHeader('Authorization', `Bearer BQA2UUYLkps20iDawnfD4-MTOH9WoUG8tBSwzgBzTFELOTSWPdNxKi44EsDsJEqa2mKqrsltiRE0DNw7kL3BIlOSuEKmde7gN-uneTM7WV5aJXHqTafQWerCBHbBGfquijq04g1aAHCR3QaWtakUl3XQZq72e_Djrg_519ivn11dZyADd8ghVG_Db3gnUo4rr1KYVqmc_ZRotMskb5oykiA`);
//                 xhr.setRequestHeader('Content-Type', 'application/json');
//                 xhr.onload = function() {
//                     if (xhr.status === 200) console.log('fala bogu');
//                     else console.log(this.responseText);

// }
//                 xhr.send(JSON.stringify(name));

// }
