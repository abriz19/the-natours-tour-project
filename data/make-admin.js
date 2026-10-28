// Gives an existing user the admin role, so they can use the admin pages.
// Usage: npm run make-admin -- you@example.com
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const User = require('../model/userModel');

const email = (process.argv[2] || '').trim().toLowerCase();

const run = async () => {
    if (!email) {
        console.log('Usage: npm run make-admin -- you@example.com');
        process.exitCode = 1;
        return;
    }

    try {
        await mongoose.connect(process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD));
        const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
        if (user) {
            console.log(`${user.name} <${user.email}> is now an admin.`);
        } else {
            console.log(`No active user with the email ${email}. Sign up on the website first.`);
            process.exitCode = 1;
        }
    } catch (err) {
        console.error('error occured:', err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

run();
