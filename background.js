chrome.runtime.onInstalled.addListener(() =>{
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () =>{
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {hostEquals: 'open.spotify.com'},
                })
             ],
            actions: [ new chrome.declarativeContent.ShowPageAction() ]
       }]);
    });
});
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (change.status === 'complete') {
        tab.url.includes('https://open.spotify.com/collection/playlists') ?  chrome.tabs.sendMessage(tabId, { message: 'runOutside' }) :
        /show|album|(playlist\b)/.test(tab.url) ? chrome.tabs.sendMessage(tabId, { message: 'runInside' }) : undefined;
    } 
});