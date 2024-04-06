function saveOptions(e) {
    e.preventDefault();
    chrome.storage.local.set({
        apiUrl: document.getElementById('apiUrl').value,
    });
}

// Load from Chrome's local storage
function restoreOptions() {
    chrome.storage.local.get(['apiUrl'], (res) => {
        document.getElementById('apiUrl').value = res.apiUrl || '';
    });
}


document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('optionsForm').addEventListener('submit', saveOptions);
