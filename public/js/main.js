/* Natours front-end: wires the server-rendered pages to the REST API. */
'use strict';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const showAlert = (type, message, seconds = 5) => {
  const container = $('#alerts');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `alert alert--${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), seconds * 1000);
};

// A message that survives the next page load (used before redirects/reloads)
const flash = (type, message) => {
  sessionStorage.setItem('flash', JSON.stringify({ type, message }));
};

const showFlash = () => {
  const raw = sessionStorage.getItem('flash');
  if (!raw) return;
  sessionStorage.removeItem('flash');
  try {
    const { type, message } = JSON.parse(raw);
    showAlert(type, message);
  } catch (err) {
    // ignore malformed flash messages
  }
};

// Calls the API and throws an Error with the server's message when it fails
const api = async (method, url, data) => {
  const options = { method, headers: { Accept: 'application/json' }, credentials: 'same-origin' };
  if (data !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return null;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((body && body.message) || `Request failed (${res.status})`);
  }
  return body;
};

// Runs `handler` on submit, disables the submit button meanwhile and shows errors
const handleSubmit = (form, handler) => {
  if (!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const label = button ? button.innerHTML : '';
    if (button) {
      button.disabled = true;
      button.classList.add('is-busy');
      button.textContent = 'Please wait…';
    }
    try {
      await handler(new FormData(form), form);
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      if (button) {
        button.disabled = false;
        button.classList.remove('is-busy');
        button.innerHTML = label;
      }
    }
  });
};

const text = (formData, key) => String(formData.get(key) || '').trim();

const numberOrNull = (formData, key) => {
  const value = text(formData, key);
  return value === '' ? null : Number(value);
};

const lines = (formData, key) =>
  String(formData.get(key) || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

// Only follow ?next= links that stay on this site
const nextUrl = () => {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !/^\/[/\\]/.test(next) ? next : '/';
};

const el = (tag, className, content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
};

const capitalize = str => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

handleSubmit($('#login-form'), async formData => {
  await api('POST', '/api/v1/users/login', {
    email: text(formData, 'email'),
    password: formData.get('password')
  });
  flash('success', 'Logged in successfully. Welcome back!');
  window.location.assign(nextUrl());
});

handleSubmit($('#signup-form'), async formData => {
  if (formData.get('password') !== formData.get('passwordConfirmation')) {
    throw new Error('The passwords do not match.');
  }
  await api('POST', '/api/v1/users/signup', {
    name: text(formData, 'name'),
    email: text(formData, 'email'),
    password: formData.get('password'),
    passwordConfirmation: formData.get('passwordConfirmation')
  });
  flash('success', 'Welcome to Natours! Your account is ready.');
  window.location.assign('/');
});

const logoutButton = $('#logout');
if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    try {
      await api('GET', '/api/v1/users/logout');
      flash('success', 'You are logged out.');
      window.location.assign('/');
    } catch (err) {
      showAlert('error', err.message);
    }
  });
}

handleSubmit($('#forgot-form'), async (formData, form) => {
  await api('POST', '/api/v1/users/forgotPassword', { email: text(formData, 'email') });
  form.reset();
  showAlert('success', 'Check your inbox: we sent you a link to reset your password.', 8);
});

handleSubmit($('#reset-form'), async (formData, form) => {
  if (formData.get('password') !== formData.get('passwordConfirmation')) {
    throw new Error('The passwords do not match.');
  }
  await api('PATCH', `/api/v1/users/resetPassword/${encodeURIComponent(form.dataset.token)}`, {
    password: formData.get('password'),
    passwordConfirmation: formData.get('passwordConfirmation')
  });
  flash('success', 'Your password was changed and you are now logged in.');
  window.location.assign('/');
});

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

handleSubmit($('#account-form'), async formData => {
  await api('PATCH', '/api/v1/users/updateMe', {
    name: text(formData, 'name'),
    email: text(formData, 'email')
  });
  flash('success', 'Your profile was updated.');
  window.location.reload();
});

handleSubmit($('#password-form'), async (formData, form) => {
  if (formData.get('newPassword') !== formData.get('confirmPassword')) {
    throw new Error('The new passwords do not match.');
  }
  await api('PATCH', '/api/v1/users/updatePassword', {
    oldPassword: formData.get('oldPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword')
  });
  form.reset();
  showAlert('success', 'Your password was updated.');
});

const deactivateButton = $('#deactivate-btn');
if (deactivateButton) {
  deactivateButton.addEventListener('click', async () => {
    if (!window.confirm('Deactivate your account? You will be logged out and cannot log in again.')) return;
    try {
      await api('DELETE', '/api/v1/users/deleteMe');
      flash('info', 'Your account has been deactivated.');
      window.location.assign('/');
    } catch (err) {
      showAlert('error', err.message);
    }
  });
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

handleSubmit($('#review-form'), async (formData, form) => {
  if (!formData.get('rating')) throw new Error('Please choose a star rating.');
  await api('POST', `/api/v1/tours/${form.dataset.tourId}/reviews`, {
    rating: Number(formData.get('rating')),
    review: text(formData, 'review')
  });
  flash('success', 'Thanks! Your review was posted.');
  window.location.reload();
});

$$('form.review-edit').forEach(form =>
  handleSubmit(form, async formData => {
    await api('PATCH', `/api/v1/reviews/${form.dataset.reviewId}`, {
      rating: Number(formData.get('rating')),
      review: text(formData, 'review')
    });
    flash('success', 'Your review was updated.');
    window.location.reload();
  })
);

// ---------------------------------------------------------------------------
// Admin: tours
// ---------------------------------------------------------------------------

handleSubmit($('#tour-form'), async (formData, form) => {
  const startDates = lines(formData, 'startDates');
  const badDate = startDates.find(d => !/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d)));
  if (badDate) throw new Error(`"${badDate}" is not a valid date. Use the YYYY-MM-DD format.`);

  const lat = numberOrNull(formData, 'slLat');
  const lng = numberOrNull(formData, 'slLng');
  const address = text(formData, 'slAddress');
  const locationDescription = text(formData, 'slDescription');
  let startLocation = null;
  if (lat !== null || lng !== null) {
    if (lat === null || lng === null) {
      throw new Error('Enter both a latitude and a longitude for the start location.');
    }
    startLocation = { type: 'Point', coordinates: [lng, lat], address, description: locationDescription };
  } else if (address || locationDescription) {
    throw new Error('Add a latitude and longitude for the start location, or clear its address.');
  }

  const payload = {
    name: text(formData, 'name'),
    duration: numberOrNull(formData, 'duration'),
    maxGroupSize: numberOrNull(formData, 'maxGroupSize'),
    difficulty: formData.get('difficulty'),
    price: numberOrNull(formData, 'price'),
    priceDiscount: numberOrNull(formData, 'priceDiscount'),
    summary: text(formData, 'summary'),
    description: text(formData, 'description'),
    imageCover: text(formData, 'imageCover'),
    images: lines(formData, 'images'),
    startDate: startDates,
    startLocation,
    guides: formData.getAll('guides')
  };

  const id = form.dataset.tourId;
  if (id) {
    await api('PATCH', `/api/v1/tours/${id}`, payload);
    flash('success', `"${payload.name}" was updated.`);
  } else {
    await api('POST', '/api/v1/tours', payload);
    flash('success', `"${payload.name}" was created.`);
  }
  window.location.assign('/admin/tours');
});

// ---------------------------------------------------------------------------
// Admin: users
// ---------------------------------------------------------------------------

handleSubmit($('#user-create-form'), async formData => {
  if (formData.get('password') !== formData.get('passwordConfirmation')) {
    throw new Error('The passwords do not match.');
  }
  await api('POST', '/api/v1/users', {
    name: text(formData, 'name'),
    email: text(formData, 'email'),
    role: formData.get('role'),
    password: formData.get('password'),
    passwordConfirmation: formData.get('passwordConfirmation')
  });
  flash('success', 'User created.');
  window.location.reload();
});

$$('select[data-user-role]').forEach(select => {
  let previous = select.value;
  select.addEventListener('change', async () => {
    select.disabled = true;
    try {
      await api('PATCH', `/api/v1/users/${select.dataset.userRole}`, { role: select.value });
      previous = select.value;
      showAlert('success', 'Role updated.');
    } catch (err) {
      select.value = previous;
      showAlert('error', err.message);
    } finally {
      select.disabled = false;
    }
  });
});

// ---------------------------------------------------------------------------
// Click actions (edit / cancel / delete buttons)
// ---------------------------------------------------------------------------

const removeRow = button => {
  const row = button.closest('[data-row]');
  if (row) row.remove();
};

const runDelete = async (button, confirmMessage, url, onDone) => {
  if (!window.confirm(confirmMessage)) return;
  button.disabled = true;
  try {
    await api('DELETE', url);
    onDone();
  } catch (err) {
    button.disabled = false;
    showAlert('error', err.message);
  }
};

document.addEventListener('click', event => {
  const target = event.target;

  const editButton = target.closest('[data-review-edit]');
  if (editButton) {
    const form = $(`form.review-edit[data-review-id="${editButton.dataset.reviewEdit}"]`);
    if (form) {
      form.hidden = !form.hidden;
      if (!form.hidden) form.querySelector('textarea').focus();
    }
    return;
  }

  const cancelButton = target.closest('[data-review-cancel]');
  if (cancelButton) {
    const form = cancelButton.closest('form');
    form.reset();
    form.hidden = true;
    return;
  }

  const reviewDelete = target.closest('[data-review-delete]');
  if (reviewDelete) {
    runDelete(reviewDelete, 'Delete this review?', `/api/v1/reviews/${reviewDelete.dataset.reviewDelete}`, () => {
      flash('success', 'Review deleted.');
      window.location.reload();
    });
    return;
  }

  const tourDelete = target.closest('[data-tour-delete]');
  if (tourDelete) {
    runDelete(
      tourDelete,
      `Delete "${tourDelete.dataset.name}"? Its reviews will be deleted too. This can't be undone.`,
      `/api/v1/tours/${tourDelete.dataset.tourDelete}`,
      () => {
        removeRow(tourDelete);
        showAlert('success', 'Tour deleted.');
      }
    );
    return;
  }

  const userDelete = target.closest('[data-user-delete]');
  if (userDelete) {
    runDelete(
      userDelete,
      `Delete ${userDelete.dataset.name}? Their reviews will be deleted too. This can't be undone.`,
      `/api/v1/users/${userDelete.dataset.userDelete}`,
      () => {
        removeRow(userDelete);
        showAlert('success', 'User deleted.');
      }
    );
  }
});

// ---------------------------------------------------------------------------
// Near me
// ---------------------------------------------------------------------------

const renderNearResults = (tours, distance, unit) => {
  const box = $('#near-results');
  box.textContent = '';

  const count = el('p', 'results-count');
  count.append(el('strong', '', String(tours.length)));
  count.append(` ${tours.length === 1 ? 'tour starts' : 'tours start'} within ${distance} ${unit}`);
  box.append(count);

  if (!tours.length) {
    const empty = el('div', 'empty');
    empty.append(el('h2', '', 'No tours nearby'));
    empty.append(el('p', 'muted', 'Try a larger distance or a different location.'));
    box.append(empty);
    return;
  }

  const list = el('ul', 'near-list');
  tours.forEach(tour => {
    const item = el('li', 'near-item');

    const badge = el('div', 'near-item__distance');
    badge.append(tour.distance === undefined ? '–' : Math.round(tour.distance).toLocaleString('en-US'));
    badge.append(el('small', '', unit));

    const body = el('div', 'near-item__body');
    const title = el('h3');
    const link = el('a', '', tour.name);
    link.href = `/tour/${encodeURIComponent(tour.slug || tour._id)}`;
    title.append(link);
    body.append(title);
    body.append(
      el('p', 'muted', `${capitalize(tour.difficulty)} · ${tour.duration} days · $${Number(tour.price).toLocaleString('en-US')}`)
    );
    if (tour.startLocation && tour.startLocation.address) {
      body.append(el('p', '', `Starts at ${tour.startLocation.address}`));
    }

    item.append(badge, body);
    list.append(item);
  });
  box.append(list);
};

const nearForm = $('#near-form');
if (nearForm) {
  const locationButton = $('#use-location');
  locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showAlert('error', 'Your browser does not support location access.');
      return;
    }
    locationButton.disabled = true;
    navigator.geolocation.getCurrentPosition(
      position => {
        locationButton.disabled = false;
        $('#lat').value = position.coords.latitude.toFixed(4);
        $('#lng').value = position.coords.longitude.toFixed(4);
        nearForm.requestSubmit();
      },
      () => {
        locationButton.disabled = false;
        showAlert('error', 'Could not get your location. Please enter the coordinates yourself.');
      },
      { timeout: 10000 }
    );
  });

  handleSubmit(nearForm, async formData => {
    const latlng = `${Number(formData.get('lat'))},${Number(formData.get('lng'))}`;
    const distance = Number(formData.get('distance'));
    const unit = formData.get('unit') === 'mi' ? 'mi' : 'km';

    const [within, distances] = await Promise.all([
      api('GET', `/api/v1/tours/tours-withIn/${distance}/center/${latlng}/unit/${unit}`),
      api('GET', `/api/v1/tours/distances/${latlng}/unit/${unit}`)
    ]);

    const distanceById = new Map(distances.data.distances.map(d => [d._id, d.distance]));
    const tours = within.data.tours
      .map(tour => ({ ...tour, distance: distanceById.get(tour._id) }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    renderNearResults(tours, distance, unit);
  });
}

// ---------------------------------------------------------------------------
// Page setup
// ---------------------------------------------------------------------------

// Hide cover images that fail to load so the colour gradient behind them shows
$$('img.cover-img').forEach(img => {
  const hide = () => img.classList.add('is-broken');
  if (img.complete && img.naturalWidth === 0) hide();
  else img.addEventListener('error', hide);
});

showFlash();
