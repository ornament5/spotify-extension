let getTotalDuration = document.getElementById(`getTotalDuration`);

getTotalDuration.addEventListener(`click`, function (element) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.executeScript(
          tabs[0].id,
          {code: `dispatchEvent(new Event('duration'));` }
      );
    });
  });


