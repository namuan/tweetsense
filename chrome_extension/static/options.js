function saveOptions(e) {
    e.preventDefault();
    chrome.storage.local.set({
        apiUrl: document.getElementById('apiUrl').value,
        hide_threshold: document.getElementById('hide_threshold').value,
    });
}

// Load the API key and URL from Chrome's local storage
function restoreOptions() {
    chrome.storage.local.get(['apiUrl', 'hide_threshold'], (res) => {
        document.getElementById('apiUrl').value = res.apiUrl || '';
        document.getElementById('hide_threshold').value = res.hide_threshold || '';
    });
}


document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('optionsForm').addEventListener('submit', saveOptions);
