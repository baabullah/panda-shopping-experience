// Background script for Amazon Netflix Extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Redirect to Amazon home & living search on first install
    chrome.tabs.create({
      url: 'https://www.amazon.com/s?k=home+living'
    });
  }
});
