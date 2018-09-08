(function () {
    window.addEventListener('load', init);
    chrome.runtime.onMessage.addListener(request => request.message === 'done' && init());
    
    const utility = {
            extractDuration(durationInDisplayFormat) {
                return durationInDisplayFormat.split(`:`).reduce((mins, secs) => Number(mins) * 60 + Number(secs));
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
            padWithZero(timeUnit){
                return timeUnit < 10 ? `0${timeUnit}`: `${timeUnit}`;
            },
            isDomReady(){
                return document.querySelector('.text-silence') && document.querySelectorAll('.tracklist-duration span').length;
            },
            isPathnameSuitable(regexp) {
                return regexp.test(window.location.pathname);
            }
    };

    function renderTotalDuration() {
        const trackDurationNodes = document.querySelectorAll('.tracklist-duration span'),
        trackDurations = [];
        for (const track of trackDurationNodes) {
            trackDurations.push(track.textContent);
        }
        const totalDurationInSecs = trackDurations.reduce((total, single) => total + utility.extractDuration(single), 0),
            durationText = `Total duration: ${utility.generateDurationInDisplayFormat(totalDurationInSecs)}`,
            durationParagraph = document.getElementById(`extension-list-duration`) || document.createElement(`p`);
        durationParagraph.id = durationParagraph.id || `extension-list-duration`;
        durationParagraph.textContent = durationText;
        document.querySelector('.text-silence').after(durationParagraph);
    }

    function init() {
        if(utility.isPathnameSuitable(/show|album|(playlist\b)/)){
            utility.isDomReady() ? renderTotalDuration() : setTimeout(init, 0);
        }
    }
})();
