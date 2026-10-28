// Creates (or resets) the public demo: two demo logins, guides, travellers,
// sample tours and reviews. Only demo records are touched; everything else stays.
// Usage: npm run seed:demo
const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const User = require('../model/userModel');
const Tour = require('../model/tourModel');
const Review = require('../model/reviewModel');
const demo = require('./dev-data/demo-data');

const DAY = 24 * 60 * 60 * 1000;

const removeOldDemoData = async () => {
    const people = [...demo.accounts, ...demo.guides, ...demo.travellers];
    const tourNames = demo.tours.map(t => t.name);

    // use the raw collections so the "active"/"secretTour" query middleware doesn't hide anything
    const oldUsers = await User.collection
        .find({ $or: [{ demo: true }, { email: { $in: people.map(p => p.email) } }] })
        .project({ _id: 1 })
        .toArray();
    const oldTours = await Tour.collection.find({ name: { $in: tourNames } }).project({ _id: 1 }).toArray();

    const userIds = oldUsers.map(u => u._id);
    const tourIds = oldTours.map(t => t._id);

    // reviews by demo users may sit on non-demo tours, so refresh those ratings afterwards
    const affectedTourIds = await Review.collection.distinct('tour', { user: { $in: userIds } });

    await Review.collection.deleteMany({ $or: [{ user: { $in: userIds } }, { tour: { $in: tourIds } }] });
    await User.collection.deleteMany({ _id: { $in: userIds } });
    await Tour.collection.deleteMany({ _id: { $in: tourIds } });

    const remaining = affectedTourIds.filter(id => !tourIds.some(t => t.equals(id)));
    await Promise.all(remaining.map(id => Review.calcAverageRatings(id)));

    return { users: userIds.length, tours: tourIds.length };
};

const createUsers = async () => {
    const byKey = {};
    const create = async (person, password) => {
        const user = await User.create({
            name: person.name,
            email: person.email,
            role: person.role,
            password,
            passwordConfirmation: password,
            demo: true
        });
        byKey[person.key] = user;
    };

    for (const account of demo.accounts) await create(account, demo.demoPassword);
    for (const person of [...demo.guides, ...demo.travellers]) {
        // nobody needs to log in as these, so they get unguessable passwords
        await create(person, crypto.randomBytes(24).toString('hex'));
    }
    return byKey;
};

const createTours = async usersByKey => {
    const byKey = {};
    for (const { key, guides, ...data } of demo.tours) {
        byKey[key] = await Tour.create({ ...data, guides: guides.map(g => usersByKey[g]._id) });
    }
    return byKey;
};

const createReviews = async (usersByKey, toursByKey) => {
    const now = Date.now();
    await Review.insertMany(
        demo.reviews.map(([tour, author, rating, review, daysAgo]) => ({
            tour: toursByKey[tour]._id,
            user: usersByKey[author]._id,
            rating,
            review,
            createdAt: new Date(now - daysAgo * DAY)
        }))
    );
    // insertMany skips the save hooks, so update the ratings once per tour
    await Promise.all(Object.values(toursByKey).map(tour => Review.calcAverageRatings(tour._id)));
};

const run = async () => {
    try {
        await mongoose.connect(process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD));
        console.log('db connected successfully');

        const removed = await removeOldDemoData();
        console.log(`removed ${removed.users} old demo users and ${removed.tours} old demo tours`);

        const users = await createUsers();
        const tours = await createTours(users);
        await createReviews(users, tours);

        console.log(`created ${Object.keys(users).length} users, ${Object.keys(tours).length} tours and ${demo.reviews.length} reviews`);
        console.log('\nDemo logins (password: ' + demo.demoPassword + '):');
        demo.accounts.forEach(a => console.log(`  ${a.role.padEnd(6)} ${a.email}`));
    } catch (err) {
        console.error('error occured:', err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

run();
