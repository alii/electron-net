const { app, net } = require('electron');

const WebSocket = require('ws');

class Socket extends WebSocket {
  constructor(options) {
    super(options);
  }

  json(data) {
    this.send(JSON.stringify(data));
  }
}

const parent = new Socket('ws://127.0.0.1:' + process.env.WS_PORT);

app.whenReady().then(() => {
  parent.on('message', data => {
    const { url, options, requestId } = JSON.parse(data);

    const request = net.request({ url, ...options });

    let body = '';

    request.on('response', response => {
      response.on('data', chunk => {
        body += chunk;
      });

      response.on('end', () => {
        parent.json({
          requestId,
          result: {
            body,
            headers: response.headers,
            status: response.statusCode,
          },
        });
      });
    });

    request.end();
  });
});
