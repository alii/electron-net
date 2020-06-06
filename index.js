const { whenReady } = require('./lib');

whenReady().then(fetch => {
  fetch('https://www.sneakersnstuff.com').then(response => console.log(response.status));
});
