const electron = require('electron');
const proc = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');
const { Server } = require('ws');

const port = 7000;

class Emitter extends EventEmitter {
  constructor(options) {
    super(options);
    this.server = new Server({ port });

    this.server.on('connection', ws => {
      this.emit('ready');

      ws.on('message', data => {
        const message = JSON.parse(data);
        this.emit('message', message);
      });
    });
  }

  request(url, options = {}) {
    [...this.server.clients][0].send(JSON.stringify({ url, options }));
  }
}

const instance = new Emitter();

const child = proc.spawn(electron, ['--disable-gpu', path.join(__dirname, 'child.js')], {
  env: { WS_PORT: port },
  shell: true,
});

child.stdout.on('data', m => console.log(m.toString()));
child.stderr.on('data', m => console.log(m.toString()));

module.exports = {
  whenReady() {
    return new Promise(r => {
      instance.on('ready', () => {
        const fetch = (url, options = {}) => {
          return new Promise(r => {
            instance.request(url, options);
            instance.once('message', r);
          });
        };

        r(fetch);
      });
    });
  },
};
