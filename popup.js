const getTotalDuration = document.getElementById('total-duration');
const saveDiscoverWeekly = document.getElementById('discover-weekly');

getTotalDuration.addEventListener('click', element => {
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      chrome.tabs.executeScript(
          tabs[0].id,
          {code: 'dispatchEvent(new CustomEvent(`duration`));'}
      );
    });
  });

  saveDiscoverWeekly.addEventListener('click', element => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'dispatchEvent(new CustomEvent(`discover`));'}
    );
  });
});


