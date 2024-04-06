const enableLog = true;

function console_log(message) {
    if (enableLog) {
        console.log(message)
    }
}

function getOptionValue(option_name) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(option_name, (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(String(result[option_name]));
        });
    });
}

// Function to decide whether to hide a tweet
async function shouldHideTweet(llm_config, tweet_text, tweet_author) {
    return await (async () => {
        try {
            const request = {
                "tweet_text": tweet_text,
                "tweet_author": tweet_author
            }

            const response = await fetch(llm_config.api_url, {
                "headers": {
                    "accept": "application/json",
                    "content-type": "application/json",
                },
                "body": JSON.stringify(request),
                "method": "POST",
            });

            if (response.ok) {
                const data = await response.json();
                return data.hide_from_view
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    })();
}

// Function to process and hide tweets
async function processTweets(llm_config) {
    const parentTweetSelector = 'article[data-testid="tweet"]'
    const tweetSelector = 'div[data-testid="tweetText"]';
    const tweetUserSelector = 'div[data-testid="User-Name"]'
    for (const parentTweet of document.querySelectorAll(parentTweetSelector)) {
        const parentTweetStyle = window.getComputedStyle(parentTweet);
        if (parentTweetStyle.display !== 'none') {
            const tweet_text = parentTweet.querySelector(tweetSelector) ? parentTweet.querySelector(tweetSelector).textContent : "";
            const tweet_author = parentTweet.querySelector(tweetUserSelector) ? parentTweet.querySelector(tweetUserSelector).textContent : "";

            if (await shouldHideTweet(llm_config, tweet_text, tweet_author)) {
                if (parentTweet) {
                    console_log(`🙈 Hiding ${tweet_text}`)
                    greyOutElement(parentTweet)
                }
            }
        }
    }
}

function greyOutElement(element) {
    // element.style.opacity = '0.1';
    element.style.display = 'none';
    element.style.pointerEvents = 'none'; // Disable pointer events (clicks, hover, etc.)
}

async function initializeClient() {
    try {
        const api_url = await getOptionValue('apiUrl');
        console_log('Using API URL:', api_url);

        return {
            api_url: api_url
        };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Initialize the client and then set up the observer
initializeClient().then(llm_config => {
    // Call processTweets initially to hide existing tweets
    processTweets(llm_config).then(() => {
        console_log('Done hiding existing tweets');
    });
    // Use MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                processTweets(llm_config)
                    .then(() => {
                        console_log('Done hiding new tweets');
                    });
            }
        });
    });

    // Start observing the DOM for changes
    const config = {childList: true, subtree: true};
    const targetNode = document.body; // Adjust this to the specific container
    observer.observe(targetNode, config);
}).catch(error => {
    console.error('Error initializing client:', error);
});

