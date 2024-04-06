chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.storage.local.set({
            apiUrl: 'http://127.0.0.1:5000/classify'
        });
    }
});

// You can also handle 'update' if you need to set/update something when the extension updates
console.log("Background.js loaded");
