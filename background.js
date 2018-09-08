chrome.runtime.onInstalled.addListener(() =>{
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () =>{
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {hostEquals: `open.spotify.com`},
                })
             ],
            actions: [ new chrome.declarativeContent.ShowPageAction() ]
       }]);
    });
});
chrome.tabs.onUpdated.addListener((tabId, change) => change.status === `complete` &&
        chrome.tabs.sendMessage(tabId, { message: `done` }));