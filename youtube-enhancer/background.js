// Background script can be used for more complex ad blocking
// but most ad blocking is handled by declarativeNetRequest rules

// Listen for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    // Set default settings
    chrome.storage.sync.set({
      adBlockEnabled: true,
      shortsDisabled: false,
      commentFilterEnabled: false,
      filterKeywords: ['subscribe', 'like', 'follow', 'http', 'www.']
    });
  }
});