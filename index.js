const { whenReady } = require('./lib');

whenReady().then(async fetch => {
  const requests = await Promise.all([fetch('https://www.sneakersnstuff.com'), fetch('https://www.google.com')]);
  requests.forEach(req => console.log(req.status, req.headers));
});
