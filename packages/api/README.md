# API

This project exposes a simple REST API on localhost:8000. The following resources are available:

`/historical?date=MM-DD-YYYY`

A GET request with a specified date formatted as above will return historical data of processed tweets from the Hive server.
Date can not be prior to 12-08-2020.

`/live`

This exposes a websocket connection through which the API broadcasts live data about processed tweets to all connected clients.

## Usage

To run in a production environment, build the application by running `npm run build`.
Afterwards, start the server through `pm2` with `npm run start`, which runs the following command:
`pm2 start dist/app.js --name api --cron "0 0 * * *"`.
If not installed already, `pm2` should be installed globally like so: `npm install pm2@latest -g`.
