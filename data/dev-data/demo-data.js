// Sample data for the public demo. Loaded by data/seed-demo.js.
// Coordinates are GeoJSON order: [longitude, latitude].

// Logins published in the README
exports.accounts = [
    { key: 'admin', name: 'Demo Admin', email: 'demo.admin@example.com', role: 'admin' },
    { key: 'customer', name: 'Demo Customer', email: 'demo.customer@example.com', role: 'user' }
];
exports.demoPassword = 'demo1234';

// These accounts get random passwords, they only exist to fill the pages
exports.guides = [
    { key: 'leo', name: 'Leo Martins', email: 'leo.guide@example.com', role: 'lead-guide' },
    { key: 'mateo', name: 'Mateo Rojas', email: 'mateo.guide@example.com', role: 'lead-guide' },
    { key: 'aisha', name: 'Aisha Bello', email: 'aisha.guide@example.com', role: 'guide' },
    { key: 'kenji', name: 'Kenji Watanabe', email: 'kenji.guide@example.com', role: 'guide' }
];

exports.travellers = [
    { key: 'sofia', name: 'Sofia Lindqvist', email: 'sofia.traveller@example.com', role: 'user' },
    { key: 'daniel', name: 'Daniel Okafor', email: 'daniel.traveller@example.com', role: 'user' },
    { key: 'priya', name: 'Priya Raman', email: 'priya.traveller@example.com', role: 'user' },
    { key: 'tom', name: 'Tom Becker', email: 'tom.traveller@example.com', role: 'user' },
    { key: 'hannah', name: 'Hannah Kim', email: 'hannah.traveller@example.com', role: 'user' }
];

const point = (lng, lat, extra) => ({ type: 'Point', coordinates: [lng, lat], ...extra });

exports.tours = [
    {
        key: 'lofoten',
        name: 'Lofoten Fjord Explorer',
        duration: 6,
        maxGroupSize: 10,
        difficulty: 'medium',
        price: 1890,
        summary: 'Hike between jagged peaks and fishing villages above the Arctic Circle.',
        description: 'Stay in traditional red fishermen\'s cabins and spend your days on coastal trails with views straight down to turquoise fjords.\nEvenings are for fresh seafood and, depending on the season, the midnight sun or the northern lights.',
        imageCover: 'lofoten.jpg',
        startDate: ['2027-06-12', '2027-07-10', '2027-08-21'],
        startLocation: point(13.0886, 67.9326, { address: 'Reine, Lofoten, Norway', description: 'Meet at the harbour in Reine' }),
        locations: [
            point(13.079, 67.933, { day: 1, description: 'Sunrise climb up Reinebringen', address: 'Reinebringen' }),
            point(13.0035, 68.082, { day: 3, description: 'Hike over the ridge to Kvalvika Beach', address: 'Kvalvika Beach' }),
            point(14.2085, 68.1555, { day: 5, description: 'Explore the fishing village of Henningsvær', address: 'Henningsvær' })
        ],
        guides: ['leo', 'aisha']
    },
    {
        key: 'patagonia',
        name: 'Patagonia Peaks Trek',
        duration: 9,
        maxGroupSize: 8,
        difficulty: 'hard',
        price: 2650,
        summary: 'Trek to the foot of Fitz Roy and Cerro Torre in the wild south of Argentina.',
        description: 'Long days on rugged trails reward you with granite spires, glacier lakes and some of the most dramatic scenery in South America.\nThe trek ends with a guided walk on the Perito Moreno Glacier.',
        imageCover: 'patagonia.jpg',
        startDate: ['2026-12-02', '2027-01-14', '2027-02-18'],
        startLocation: point(-72.8863, -49.3315, { address: 'El Chaltén, Argentina', description: 'Meet at the El Chaltén visitor centre' }),
        locations: [
            point(-73.0006, -49.2717, { day: 2, description: 'Sunrise at Laguna de los Tres', address: 'Laguna de los Tres' }),
            point(-72.9787, -49.3283, { day: 4, description: 'Glacier views at Laguna Torre', address: 'Laguna Torre' }),
            point(-73.049, -50.4967, { day: 7, description: 'Walk on the Perito Moreno Glacier', address: 'Los Glaciares National Park' })
        ],
        guides: ['mateo', 'kenji']
    },
    {
        key: 'kyoto',
        name: 'Kyoto Temple Trails',
        duration: 5,
        maxGroupSize: 14,
        difficulty: 'easy',
        price: 1450,
        summary: 'Wander through temples, bamboo groves and old merchant streets at a gentle pace.',
        description: 'Explore Kyoto on foot with a local guide, from the thousands of red torii gates at Fushimi Inari to the quiet lanes of Gion.\nThe pace is relaxed, with plenty of time for tea houses and street food.',
        imageCover: 'kyoto.jpg',
        startDate: ['2027-03-28', '2027-04-05', '2027-11-15'],
        startLocation: point(135.7588, 34.9858, { address: 'Kyoto Station, Japan', description: 'Meet at the central exit of Kyoto Station' }),
        locations: [
            point(135.7727, 34.9671, { day: 1, description: 'Early walk through the torii gates of Fushimi Inari', address: 'Fushimi Inari Taisha' }),
            point(135.672, 35.017, { day: 2, description: 'Bamboo grove and riverside temples', address: 'Arashiyama' }),
            point(135.775, 35.0037, { day: 4, description: 'Evening stroll through historic Gion', address: 'Gion' })
        ],
        guides: ['kenji', 'aisha']
    },
    {
        key: 'sahara',
        name: 'Sahara Desert Nights',
        duration: 4,
        maxGroupSize: 12,
        difficulty: 'medium',
        price: 890,
        priceDiscount: 100,
        summary: 'Ride camels into the dunes of Erg Chebbi and sleep under a sky full of stars.',
        description: 'Cross the golden dunes at sunset and spend the night in a desert camp with music around the fire.\nOn the way back, hike through the towering walls of the Todgha Gorge.',
        imageCover: 'sahara.jpg',
        startDate: ['2026-11-20', '2027-02-06', '2027-03-13'],
        startLocation: point(-4.0134, 31.0802, { address: 'Merzouga, Morocco', description: 'Meet at the Merzouga village square' }),
        locations: [
            point(-3.978, 31.145, { day: 1, description: 'Camel trek to the desert camp', address: 'Erg Chebbi' }),
            point(-5.59, 31.59, { day: 3, description: 'Hike the Todgha Gorge', address: 'Tinghir' })
        ],
        guides: ['aisha']
    },
    {
        key: 'iceland',
        name: 'Iceland Ring Road Escape',
        duration: 8,
        maxGroupSize: 12,
        difficulty: 'medium',
        price: 2390,
        summary: 'Circle Iceland past waterfalls, black-sand beaches, glaciers and hot springs.',
        description: 'Follow the Ring Road around the island with short hikes every day, from the rift valley at Thingvellir to the icebergs of Jökulsárlón.\nFinish with a soak in the geothermal waters near Lake Mývatn.',
        imageCover: 'iceland.jpg',
        startDate: ['2027-05-16', '2027-06-20', '2027-09-05'],
        startLocation: point(-21.9426, 64.1466, { address: 'Reykjavík, Iceland', description: 'Meet at the Harpa concert hall' }),
        locations: [
            point(-21.13, 64.2559, { day: 1, description: 'Walk between two continents at Thingvellir', address: 'Thingvellir National Park' }),
            point(-19.045, 63.4044, { day: 3, description: 'Black-sand beach at Reynisfjara', address: 'Reynisfjara' }),
            point(-16.179, 64.0784, { day: 4, description: 'Icebergs at the Jökulsárlón glacier lagoon', address: 'Jökulsárlón' }),
            point(-17.0, 65.6, { day: 6, description: 'Hot springs at Lake Mývatn', address: 'Mývatn' })
        ],
        guides: ['leo', 'mateo']
    },
    {
        key: 'banff',
        name: 'Banff Lakes and Glaciers',
        duration: 6,
        maxGroupSize: 10,
        difficulty: 'medium',
        price: 1750,
        summary: 'Paddle glacier-fed lakes and hike alpine trails in the Canadian Rockies.',
        description: 'Canoe on Lake Louise, hike to teahouses with mountain views and drive the Icefields Parkway to stand on the Athabasca Glacier.\nKeep an eye out for elk, bighorn sheep and the occasional bear.',
        imageCover: 'banff.jpg',
        startDate: ['2027-06-28', '2027-07-26', '2027-09-13'],
        startLocation: point(-115.5708, 51.1784, { address: 'Banff, Alberta, Canada', description: 'Meet at the Banff Visitor Centre' }),
        locations: [
            point(-116.1773, 51.4254, { day: 2, description: 'Canoe and teahouse hike at Lake Louise', address: 'Lake Louise' }),
            point(-116.186, 51.3217, { day: 3, description: 'Rockpile trail at Moraine Lake', address: 'Moraine Lake' }),
            point(-117.229, 52.214, { day: 5, description: 'Walk on the Athabasca Glacier', address: 'Columbia Icefield' })
        ],
        guides: ['kenji', 'mateo']
    },
    {
        key: 'amalfi',
        name: 'Amalfi Coast Walks',
        duration: 5,
        maxGroupSize: 12,
        difficulty: 'easy',
        price: 1590,
        priceDiscount: 150,
        summary: 'Follow cliffside paths between lemon groves and pastel villages on the Italian coast.',
        description: 'Walk the famous Path of the Gods high above the sea, visit the gardens of Ravello and take a boat across to Capri.\nEvery day ends with a long Italian dinner.',
        imageCover: 'amalfi.jpg',
        startDate: ['2027-04-24', '2027-05-22', '2027-09-25'],
        startLocation: point(14.485, 40.6281, { address: 'Positano, Italy', description: 'Meet at the Spiaggia Grande beach in Positano' }),
        locations: [
            point(14.531, 40.625, { day: 2, description: 'Path of the Gods from Bomerano', address: 'Path of the Gods' }),
            point(14.6118, 40.6491, { day: 3, description: 'Gardens and villas of Ravello', address: 'Ravello' }),
            point(14.2426, 40.5532, { day: 4, description: 'Boat trip to Capri', address: 'Capri' })
        ],
        guides: ['aisha', 'leo']
    },
    {
        key: 'kilimanjaro',
        name: 'Kilimanjaro Summit Climb',
        duration: 7,
        maxGroupSize: 8,
        difficulty: 'hard',
        price: 2990,
        summary: 'Climb Africa\'s highest peak on the scenic Machame route with an experienced crew.',
        description: 'Walk from rainforest to alpine desert to the glaciers near the summit, with a slow pace that gives your body time to adjust to the altitude.\nThe summit push starts at midnight so you can watch the sunrise from Uhuru Peak.',
        imageCover: 'kilimanjaro.jpg',
        startDate: ['2027-01-08', '2027-07-02', '2027-08-13'],
        startLocation: point(37.3404, -3.3349, { address: 'Moshi, Tanzania', description: 'Meet at our lodge in Moshi' }),
        locations: [
            point(37.24, -3.17, { day: 1, description: 'Start at Machame Gate', address: 'Machame Gate' }),
            point(37.319, -3.079, { day: 3, description: 'Acclimatisation hike to Lava Tower', address: 'Lava Tower' }),
            point(37.3533, -3.0758, { day: 6, description: 'Sunrise at Uhuru Peak', address: 'Uhuru Peak' })
        ],
        guides: ['mateo', 'leo']
    }
];

// [tour, author, rating, text, days ago]
exports.reviews = [
    ['lofoten', 'sofia', 5, 'The views from Reinebringen were unreal. Leo knew every trail and the cabins were so cosy.', 40],
    ['lofoten', 'daniel', 4, 'Beautiful hikes, but bring proper rain gear. The weather changes every hour.', 25],
    ['lofoten', 'hannah', 5, 'Best trip I have ever taken. Kvalvika Beach felt like the end of the world.', 12],
    ['patagonia', 'tom', 5, 'Tough days, but seeing Fitz Roy at sunrise made every step worth it.', 60],
    ['patagonia', 'priya', 4, 'Incredible scenery. The glacier walk was the highlight. Training beforehand is a must.', 33],
    ['kyoto', 'customer', 5, 'Perfect pace and lovely small group. Fushimi Inari at 7am was magical and quiet.', 20],
    ['kyoto', 'sofia', 5, 'Kenji showed us places we would never have found ourselves.', 55],
    ['kyoto', 'daniel', 4, 'Great mix of temples and food. I would have liked one more free afternoon.', 18],
    ['sahara', 'customer', 4, 'Sleeping in the desert under the stars was unforgettable. The drive is long but worth it.', 30],
    ['sahara', 'tom', 5, 'Aisha made the whole group feel at home. The sunset on the dunes is something else.', 15],
    ['sahara', 'hannah', 3, 'Amazing desert night, but the camp was busier than I expected.', 8],
    ['iceland', 'priya', 5, 'Waterfalls every day and the glacier lagoon blew my mind. Very well organised.', 45],
    ['iceland', 'daniel', 4, 'So much to see. Long drives between stops, but the guides kept it fun.', 22],
    ['banff', 'hannah', 5, 'Moraine Lake looks exactly like the postcards. We even saw a bear (from a safe distance).', 35],
    ['banff', 'sofia', 4, 'Gorgeous lakes and good hikes. Book early, the summer dates fill up fast.', 10],
    ['amalfi', 'tom', 5, 'The Path of the Gods is the most beautiful walk I have done. And the food!', 28],
    ['amalfi', 'priya', 5, 'Relaxed, beautiful and delicious. Capri by boat was a perfect last day.', 14],
    ['kilimanjaro', 'daniel', 5, 'Reaching Uhuru Peak at sunrise was the proudest moment of my life. Amazing crew.', 50],
    ['kilimanjaro', 'hannah', 4, 'Very hard summit night, but the guides took great care of everyone.', 19]
];
