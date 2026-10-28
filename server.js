const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
});

dotenv.config();

if (!process.env.DATABASE) {
    console.error('DATABASE is not set. Copy .env.example to .env and fill in your values.');
    process.exit(1);
}

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
mongoose.connect(DB)
.then(() => {
    console.log('db connected successfully');
})
.catch((err) => {
    console.error('db connection error:', err.message);
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
    console.log(`this server is running on port ${port}`);
});

process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => process.exit(1));
});
