const saveDiscoverWeekly = document.getElementById('discover-weekly');

saveDiscoverWeekly.addEventListener('click', event => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'dispatchEvent(new CustomEvent(`discover`));'}
    );
  });
  event.target.blur();
});


