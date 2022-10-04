const saveDiscoverWeekly = document.getElementById('discover-weekly');

saveDiscoverWeekly.addEventListener('click', event => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.scripting.executeScript({
      target:{tabId:tabs[0].id},
      function: dispatchDiscoverEvent
    });
  });
  event.target.blur();
});

function dispatchDiscoverEvent() {
  dispatchEvent(new CustomEvent(`discover`));
}
