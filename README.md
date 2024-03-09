# TweetSense

Filter tweets using sentiment analysis

![](images/screenshot.png)

## Development

Setup Python environment.

```shell
make setup
```

Install dependencies

```shell
make deps
```

Build Chrome extension

```shell
make build-extension
```

The output will be in chrome_extension/bundled.
Use `Load unpacked` option in `chrome://extensions` to load the extension.

Run server

```shell
make run
```
