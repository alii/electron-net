const electron = require('electron');
const proc = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');
const { Server } = require('ws');
const id = require('smaller-id');

class Emitter extends EventEmitter {
  constructor(port) {
    super();

    const child = proc.spawn(electron, ['--disable-gpu', path.join(__dirname, 'child.js')], {
      env: { WS_PORT: port },
      shell: true,
    });

    child.stdout.on('data', m => console.log(m.toString()));
    child.stderr.on('data', m => console.log(m.toString()));

    this.server = new Server({ port });

    this.server.on('connection', ws => {
      this.emit('ready');

      ws.on('message', data => {
        const message = JSON.parse(data);
        this.emit(message.requestId, message);
      });
    });
  }

  request(url, options = {}, requestId) {
    [...this.server.clients][0].send(JSON.stringify({ url, options, requestId }));
  }
}

module.exports = {
  whenReady(port = 7000) {
    return new Promise(resolveReady => {
      const instance = new Emitter(port);

      instance.on('ready', () => {
        const fetch = (url, options = {}) => {
          return new Promise(resolveFetch => {
            const requestId = url + id();

            instance.request(url, options, requestId);
            instance.once(requestId, data => {
              if (data.requestId === requestId) {
                resolveFetch(data.result);
              }
            });
          });
        };

        resolveReady(fetch);
      });
    });
  },
};
