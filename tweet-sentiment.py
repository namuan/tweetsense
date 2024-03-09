from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
from vaderSentiment import vaderSentiment

app = Flask(__name__)
CORS(app)

# Load the pre-trained sentiment analysis pipeline
sentiment_pipeline = pipeline(
    "text-classification", model="distilbert-base-uncased-finetuned-sst-2-english"
)
sentiment_analyser = vaderSentiment.SentimentIntensityAnalyzer()


@app.route("/classify", methods=["POST"])
def analyze_sentiment():
    tweet_text = request.json.get("tweet_text")
    if not tweet_text:
        return jsonify({"error": "Tweet text is required"}), 400

    bert_sentiment = sentiment_pipeline(tweet_text)
    bert_sentiment_label = bert_sentiment[0]["label"]
    bert_sentiment_score = round(bert_sentiment[0]["score"], 2)

    vader_sentiment = sentiment_analyser.polarity_scores(tweet_text)
    vader_sentiment_score = vader_sentiment.get("compound")

    if bert_sentiment_score < 0.6 and vader_sentiment_score < 0.5:
        print(f"⛔ 🐦 {tweet_text}")
        print(f">> ⚡ {bert_sentiment_label} - {bert_sentiment_score}")
        print(f">> ⚡ {vader_sentiment_score}")

    return jsonify(
        {
            "sentiment": bert_sentiment_label,
            "score": bert_sentiment_score,
            "vader_score": vader_sentiment_score,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
