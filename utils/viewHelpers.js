// Small formatting helpers available in every Pug template as `h`

exports.capitalize = str => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

exports.formatDate = (date, options = { month: 'long', day: 'numeric', year: 'numeric' }) =>
    date ? new Date(date).toLocaleDateString('en-US', options) : '';

exports.monthName = month => new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' });

// YYYY-MM-DD for <input type="date"> style values
exports.toInputDate = date => (date ? new Date(date).toISOString().slice(0, 10) : '');

exports.money = amount =>
    amount === null || amount === undefined ? '' : `$${Number(amount).toLocaleString('en-US')}`;

exports.initial = name => (name || '?').trim().charAt(0).toUpperCase();

exports.tourUrl = tour => `/tour/${tour.slug || tour._id}`;

// Absolute URLs are used as-is, bare file names are looked up in public/img/tours
exports.imageSrc = image => {
    if (!image) return null;
    return /^https?:\/\//.test(image) ? image : `/img/tours/${image}`;
};

// A stable colour gradient per tour, shown behind (or instead of) the cover image
exports.coverStyle = name => {
    let hash = 0;
    for (const char of name || '') hash = (hash * 31 + char.charCodeAt(0)) % 360;
    const hue = (hash + 120) % 360;
    return `background-image: linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 50) % 360} 60% 28%))`;
};

// First start date that is still in the future (or null)
exports.nextStartDate = dates => {
    const now = Date.now();
    const upcoming = (dates || []).map(d => new Date(d)).filter(d => d.getTime() >= now).sort((a, b) => a - b);
    return upcoming[0] || null;
};

exports.roleLabel = role =>
    ({ user: 'User', guide: 'Guide', 'lead-guide': 'Lead guide', admin: 'Admin' }[role] || role);
