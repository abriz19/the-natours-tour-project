// Usage:
//   npm run import-data   -> adds the tours from dev-data/tours-new.json
//   npm run delete-data   -> deletes all tours
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const Tour = require('../model/tourModel');

const tours = JSON.parse(fs.readFileSync(path.join(__dirname, 'dev-data', 'tours-new.json'), 'utf-8'));

const importData = async () => {
    await Tour.create(tours);
    console.log(`${tours.length} tours imported successfully`);
}

const deleteData = async () => {
    await Tour.deleteMany();
    console.log('data deleted successfully');
}

const run = async () => {
    const action = process.argv[2];
    if (action !== '--import' && action !== '--delete') {
        console.log('Usage: node data/import-dev-data.js --import | --delete');
        process.exitCode = 1;
        return;
    }

    try {
        const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
        await mongoose.connect(DB);
        console.log('db connected successfully');
        if (action === '--import') await importData();
        else await deleteData();
    } catch (err) {
        console.error('error occured:', err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

run();
