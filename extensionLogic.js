window.addEventListener(`load`, function () {
    console.log(`window je loudovannnn`);
    checkUrlAndDomAndRun();
});

chrome.runtime.onMessage.addListener(
    function (request) {
        // listen for messages sent from background.js
        if (request.message === `done`) {
            console.log(`tab je apdejtovannnn`);
            checkUrlAndDomAndRun();
        }
    });



// ---------------------------- Body Click pokusaj
// window.onload = totalDuration;
// let body = document.body;
// body.addEventListener(`click`,function(e){
//     if(e.target.href && /album|playlist/.test(e.target.href)) {
//         setTimeout(() => {
//             console.log(`aaaaaaaaaaaaaaaaaaaaaa`);
//             totalDuration();
//         },2000);
//     }
// });


function totalDuration() {

    let myFunctions = {
            timeAdder(totalTimeSecs, singleTime) {
                let singleTimeSecs = singleTime.split(`:`).reduce((m, s) => Number(m) * 60 + Number(s));
                totalTimeSecs += singleTimeSecs;
                return totalTimeSecs;
            },
            timeFormatter(timeInSecs) {
                let hours = Math.floor(timeInSecs / 3600),
                    mins = Math.floor((timeInSecs - hours * 3600) / 60),
                    secs = timeInSecs - (hours * 3600) - (mins * 60);

                let hoursString = hours < 10 ? `0` + hours : `` + hours,
                    minsString = mins < 10 ? `0` + mins : `` + mins,
                    secsString = secs < 10 ? `0` + secs : `` + secs;

                return hoursString + `h:` + minsString + `m:` + secsString + `s`;
            }
        },
        trackDurations = document.querySelectorAll(`.tracklist-duration span`),
        durationArr = [];

    for (let track of trackDurations) {
        durationArr.push(track.textContent);
    }

    let totalDurationInSecs = durationArr.reduce(myFunctions.timeAdder, 0),
        durationText = `Total duration: ` + myFunctions.timeFormatter(totalDurationInSecs),
        durationPara = document.getElementById(`extension-list-duration`) || document.createElement(`p`),
        numberOfSongs = document.querySelector(`.text-silence`);

    durationPara.id = durationPara.id || `extension-list-duration`;
    durationPara.textContent = durationText;

    numberOfSongs.after(durationPara);
}

function checkUrlAndDomAndRun() {
    if (/show|album|(playlist\b)/.test(window.location.pathname)) {
        if (!document.querySelector(`.text-silence`) || document.querySelectorAll(`.tracklist-duration span`).length == 0) {
            setTimeout(checkUrlAndDomAndRun, 0);
            return;
        }
        totalDuration();
    }
}