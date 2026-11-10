const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

process.on('uncaughtException', err => {
  console.error('ERROR:', err.name, err.message);
  process.exit(1);
})

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(DB).then(() => console.log("Database connected!"))


const port = 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.error('ERROR:', err.name, err.message);
  server.close(() => {
    process.exit(1)
  });
});
