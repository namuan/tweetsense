const {LRUCache} = require('lru-cache');

const enableLog = false;

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
async function shouldHideTweet(llm_config, tweet_text) {
    if (tweet_cache.has(tweet_text)) {
        console_log(`Found tweet in cache: ${tweet_text}`)
        return tweet_cache.get(tweet_text);
    }

    const tweetPromise = await (async () => {
        try {
            const request = {
                "tweet_text": tweet_text
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
                const score = data.score
                const sentiment = data.sentiment
                const vader_score = data.vader_score
                const result = score < llm_config.hide_threshold && vader_score < 0.5;
                if (result) {
                    console_log(`Hiding tweet: ${tweet_text}, result: ${result}, score: ${sentiment}, sentiment: ${sentiment}, vader_score: ${vader_score}`);
                }
                return result;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    })();

    tweet_cache.set(tweet_text, tweetPromise);
    return tweetPromise;
}

// Function to process and hide tweets
async function processTweets(llm_config) {
    const tweetSelector = 'div[data-testid="tweetText"]';
    for (const tweet of document.querySelectorAll(tweetSelector)) {
        const tweet_text = tweet.textContent;
        if (await shouldHideTweet(llm_config, tweet_text)) {
            const article = tweet.closest('article');
            if (article) {
                greyOutElement(article)
            }
        }
    }
}

function greyOutElement(element) {
    element.style.opacity = '0.2'; // Set opacity to 50%
    element.style.pointerEvents = 'none'; // Disable pointer events (clicks, hover, etc.)
}

async function initializeClient() {
    try {
        const api_url = await getOptionValue('apiUrl');
        console_log('Using API URL:', api_url);

        const hide_threshold_str = await getOptionValue('hide_threshold');
        const hide_threshold = parseFloat(hide_threshold_str);
        console_log('Using hide threshold:', hide_threshold);

        return {
            api_url: api_url,
            hide_threshold: hide_threshold
        };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

const lru_options = {
    max: 500,
}

const tweet_cache = new LRUCache(lru_options); // Initialize the cache
console_log("Cache size:", tweet_cache.size);

// Initialize the client and then set up the observer
initializeClient().then(llm_config => {
    // // Hide distractions
    // aria_labels = [
    //     "Subscribe to Premium",
    //     "Timeline: Trending now",
    //     "Who to follow",
    //     "Footer"
    // ]
    //
    // for (const aria_label in aria_labels) {
    //     const aria_element = document.querySelector('[aria-label="' + aria_labels[aria_label] + '"]');
    //     aria_element.parentElement.style.display = 'none';
    // }
    // Call processTweets initially to hide existing tweets
    processTweets(llm_config).then(() => {
        console.log('Done hiding existing tweets');
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

