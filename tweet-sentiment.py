from functools import cache

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline

import logging

logging.basicConfig(filename='tweet-sentiment.log', level=logging.INFO)

app = Flask(__name__)
CORS(app)

# Load the pre-trained sentiment analysis pipeline
sentiment_pipeline = pipeline(
    "zero-shot-classification", model="MoritzLaurer/deberta-v3-base-zeroshot-v1.1-all-33"
)

hypothesis_template = "This text is about {}"
classes_verbalized = ["code", "software-development", "machine-learning", "trading", "python"]

allowed_accounts = ["@betterhn50"]


def is_in_allowed_accounts(tweet_author):
    for account in allowed_accounts:
        if account in tweet_author:
            return True

    return False


@app.route("/classify", methods=["POST"])
def analyze_sentiment():
    tweet_author = request.json.get("tweet_author")

    if (is_in_allowed_accounts(tweet_author)):
        return jsonify({"hide_from_view": False})

    tweet_text = request.json.get("tweet_text")
    if not tweet_text:
        return jsonify({"hide_from_view": True})

    categories_found = match_categories(tweet_text)
    app.logger.info(f"🤔 {tweet_author}: {tweet_text} -> {categories_found}")

    return jsonify(
        {
            "hide_from_view": False if categories_found else True
        }
    )


@cache
def match_categories(tweet_text):
    sentiment = sentiment_pipeline(tweet_text,
                                   classes_verbalized,
                                   hypothesis_template=hypothesis_template,
                                   multi_label=True)
    app.logger.info(sentiment)
    return any([x for x in sentiment["scores"] if x > 0.75])


if __name__ == "__main__":
    app.run(debug=True)
