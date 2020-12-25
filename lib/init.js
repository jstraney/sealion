const os = require('os');

process.env.UV_THREADPOOL_SIZE = os.cpus().length;

process.on('unhandledRejection', (err, promise) => {
  console.error(err);
});

