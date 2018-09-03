chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
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
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.status === `complete`) {
        chrome.tabs.sendMessage(tabId, {
            message: `done`
        });
    }
});