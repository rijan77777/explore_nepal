
const API = 'https://explorenepal-backend.onrender.com/api';

/* Skeleton loading shimmer — shows placeholder cards immediately while
   initApp() fetches live data from the backend. Purely additive/cosmetic;
   buildDestCards/buildHotelCards/buildRestoCards safely overwrite these
   via grid.innerHTML = '' once real data arrives. */
function showSkeletonCards(gridId, count) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="card skeleton-card">
        <div class="card-img skeleton-block skeleton-img"></div>
        <div class="card-body">
          <div class="skeleton-block skeleton-line title"></div>
          <div class="skeleton-block skeleton-line"></div>
          <div class="skeleton-block skeleton-line short"></div>
        </div>
      </div>`;
  }
  grid.innerHTML = html;
}
showSkeletonCards('dest-grid', 6);
showSkeletonCards('hotel-grid', 6);
showSkeletonCards('resto-grid', 6);

async function loadAllData() {
  const [destData, hotelData, restoData] = await Promise.all([
    fetch(`${API}/destinations`).then(r => r.json()),
    fetch(`${API}/hotels`).then(r => r.json()),
    fetch(`${API}/restaurants`).then(r => r.json()),
  ]);
  return { destinations: destData, hotels: hotelData, restaurants: restoData };
}

async function initApp() {
  try {
    const data = await loadAllData();
    destinations = data.destinations;
    hotels       = data.hotels;
    restaurants  = data.restaurants;
    buildDestCards(destinations);
    buildHotelCards(hotels);
    buildRestoCards(restaurants);
  } catch (err) {
    console.error('❌ Error:', err);
    buildDestCards(destinations);
    buildHotelCards(hotels);
    buildRestoCards(restaurants);
  }
}
initApp();
updateFavCount();

// ── FIREBASE SETUP ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDvkE_6AnySooCrywwNzh_OLVPkhjF7t2M",
  authDomain: "explorenepal-8f527.firebaseapp.com",
  projectId: "explorenepal-8f527",
  storageBucket: "explorenepal-8f527.firebasestorage.app",
  messagingSenderId: "1002440149097",
  appId: "1:1002440149097:web:01e53a212bd7fe1f82faf8"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log("Firebase connected!");
/* ============================================================
   script.js  –  ExploreNepal  (Final Defence Version)
   Reviews use localStorage — works perfectly offline/online
   ============================================================ */

/* ── 1. NAVBAR ── */
window.addEventListener('scroll', function () {
  document.getElementById('navbar').classList.toggle('solid', window.scrollY > 60);

  // Scroll progress bar — purely additive
  var bar = document.getElementById('scroll-progress');
  if (bar) {
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }

  // Floating parallax mountains — purely additive, only while hero is in view
  var heroSection = document.querySelector('.hero');
  if (heroSection && window.scrollY < window.innerHeight) {
    var parallaxOffset = window.scrollY * 0.25;
    heroSection.style.setProperty('--parallax-y', parallaxOffset + 'px');
  }
});

/* Cursor spotlight in hero — purely additive, follows mouse via CSS variables */
(function () {
  var heroEl = document.querySelector('.hero');
  if (!heroEl) return;
  heroEl.addEventListener('mousemove', function (e) {
    var rect = heroEl.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width) * 100;
    var y = ((e.clientY - rect.top) / rect.height) * 100;
    heroEl.style.setProperty('--mx', x + '%');
    heroEl.style.setProperty('--my', y + '%');
  });
})();

/* ── 2. HAMBURGER ── */
document.getElementById('hamburger').addEventListener('click', function () {
  document.getElementById('mob-menu').classList.toggle('open');
});
function closeMob() { document.getElementById('mob-menu').classList.remove('open'); }

/* ── HELPERS ── */
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function starsHTML(n) {
  n = Math.round(n * 2) / 2;
  let h = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(n))  h += '★';
    else if (i - 0.5 === n)  h += '½';
    else                     h += '☆';
  }
  return '<span style="color:#e67e22;">' + h + '</span>';
}

function imgErr(el) {
  el.onerror = null;
  el.style.background = '#2d6a4f';
  el.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='520'%3E%3Crect width='800' height='520' fill='%232d6a4f'/%3E%3Ctext x='400' y='260' text-anchor='middle' dominant-baseline='middle' fill='rgba(255,255,255,0.4)' font-family='Arial' font-size='20'%3EImage loading...%3C/text%3E%3C/svg%3E";
}

/* ── 3. REVIEWS  (localStorage) ──
   Saves reviews in the browser so they persist between visits.
   localStorage is like a small notebook saved on the user's computer. */

function getReviews(id) {
  try { return JSON.parse(localStorage.getItem('enr-' + id)) || []; }
  catch (e) { return []; }
}

function saveReview(id, name, rating, text) {
  // Save to localStorage (works offline)
  const list = getReviews(id);
  list.unshift({ name, rating, text, date: new Date().toLocaleDateString('en-GB') });
  localStorage.setItem('enr-' + id, JSON.stringify(list));

  // Save to Firebase (visible to everyone, stored in cloud)
  db.collection('reviews').add({
    destinationId: id,
    reviewerName:  name,
    rating:        rating,
    reviewText:    text,
    date:          new Date().toLocaleDateString('en-GB'),
    createdAt:     new Date().toISOString()
  }).then(function() {
    console.log('Review saved to Firebase!');
  }).catch(function(err) {
    console.warn('Firebase review error:', err);
  });
}

function getAvgRating(id) {
  const list = getReviews(id);
  if (!list.length) return 0;
  return Math.round((list.reduce((a, r) => a + r.rating, 0) / list.length) * 10) / 10;
}

/* ── COMPARE DESTINATIONS (in-memory, session-based) ── */
let compareList = [];

function toggleCompare(id, checkboxEl) {
  const idx = compareList.indexOf(id);
  if (idx > -1) {
    compareList.splice(idx, 1);
  } else {
    if (compareList.length >= 3) {
      showToast('You can compare up to 3 destinations at a time', 'error');
      if (checkboxEl) checkboxEl.checked = false;
      return;
    }
    compareList.push(id);
  }
  updateCompareBar();
}

function updateCompareBar() {
  let bar = document.getElementById('compare-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'compare-bar';
    bar.className = 'compare-bar';
    document.body.appendChild(bar);
  }
  if (compareList.length === 0) {
    bar.classList.remove('show');
    return;
  }
  const names = compareList.map(id => {
    const d = destinations.find(x => x.id === id);
    return d ? d.name : id;
  });
  bar.innerHTML = `
    <span class="compare-bar-text">Comparing: ${names.join(' vs ')}</span>
    <button class="compare-bar-btn" onclick="showCompareModal()">Compare Now →</button>
    <button class="compare-bar-clear" onclick="clearCompare()">Clear</button>`;
  bar.classList.add('show');
}

function clearCompare() {
  compareList = [];
  updateCompareBar();
  document.querySelectorAll('.compare-check input').forEach(cb => cb.checked = false);
}

function showCompareModal() {
  if (compareList.length < 2) {
    showToast('Select at least 2 destinations to compare', 'error');
    return;
  }
  const picks = compareList.map(id => destinations.find(x => x.id === id)).filter(Boolean);
  let overlay = document.getElementById('compare-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'compare-overlay';
    overlay.className = 'compare-overlay';
    overlay.onclick = function (e) { if (e.target === overlay) closeCompareModal(); };
    document.body.appendChild(overlay);
  }
  const cols = picks.map(d => `
    <div class="compare-col">
      <div class="compare-col-img" style="background-image:url('${d.image}')"></div>
      <h3>${d.name}</h3>
      <div class="compare-row"><strong>Province</strong><span>${d.province}</span></div>
      <div class="compare-row"><strong>Category</strong><span>${cap(d.category)}</span></div>
      <div class="compare-row"><strong>Best Season</strong><span>${d.bestSeason}</span></div>
      <div class="compare-row"><strong>Entry Fee</strong><span>${d.entryFee}</span></div>
      <div class="compare-row"><strong>Rating</strong><span>${getAvgRating(d.id) > 0 ? getAvgRating(d.id) + ' ★' : 'No reviews yet'}</span></div>
      <div class="compare-row"><strong>Activities</strong><span>${d.activities.join(', ')}</span></div>
      <button class="btn btn-green" style="margin-top:14px;width:100%;" onclick="closeCompareModal(); openDestDetail('${d.id}')">View Full Details</button>
    </div>`).join('');
  overlay.innerHTML = `
    <div class="compare-modal">
      <button class="compare-modal-close" onclick="closeCompareModal()">✕</button>
      <h2 class="compare-modal-title">Comparing Destinations</h2>
      <div class="compare-grid">${cols}</div>
    </div>`;
  overlay.classList.add('open');
}

function closeCompareModal() {
  const overlay = document.getElementById('compare-overlay');
  if (overlay) overlay.classList.remove('open');
}

/* ── FAVORITES / WISHLIST (localStorage) ── */
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('enr-favorites')) || []; }
  catch (e) { return []; }
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id, btnEl) {
  let favs = getFavorites();
  const wasFav = favs.includes(id);
  if (wasFav) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem('enr-favorites', JSON.stringify(favs));
  if (btnEl) {
    btnEl.classList.toggle('is-fav', !wasFav);
    btnEl.textContent = !wasFav ? '♥' : '♡';
  }
  updateFavCount();
  if (!wasFav) {
    showToast('Added to favorites ♥', 'success');
  }
}

function updateFavCount() {
  const el = document.getElementById('fav-count');
  if (el) {
    const n = getFavorites().length;
    el.textContent = n;
    el.style.display = n > 0 ? 'inline-flex' : 'none';
  }
}

function openFavorites() {
  const favs = getFavorites();
  const favDestinations = destinations.filter(d => favs.includes(d.id));
  document.getElementById('dest-detail-panel').innerHTML = '';
  buildDestCards(favDestinations.length ? favDestinations : []);
  if (!favDestinations.length) {
    document.getElementById('dest-grid').innerHTML =
      '<p style="grid-column:1/-1;text-align:center;color:#888;padding:40px;">No favorites yet — click the ♡ on any destination card to save it here.</p>';
  }
  document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
  document.getElementById('destinations').scrollIntoView({ behavior: 'smooth' });
}

function reviewsHTML(id) {
  const list = getReviews(id);
  const items = list.length
    ? list.map(r => `
        <div class="review-item">
          <div class="ri-top">
            <span class="ri-name">${r.name}</span>
            <span class="ri-stars">${starsHTML(r.rating)} ${r.rating}/5</span>
            <span class="ri-date">${r.date}</span>
          </div>
          <p>${r.text}</p>
        </div>`).join('')
    : '<p class="no-reviews">No reviews yet. Be the first to review!</p>';

  return `
    <div class="review-section">
      <h4>⭐ Reviews &amp; Ratings</h4>
      <div class="review-form">
        <input type="text" id="rname-${id}" placeholder="Your name" maxlength="50" />
        <div class="star-picker" id="spick-${id}">
          <span onclick="pickStar('${id}',1)">★</span>
          <span onclick="pickStar('${id}',2)">★</span>
          <span onclick="pickStar('${id}',3)">★</span>
          <span onclick="pickStar('${id}',4)">★</span>
          <span onclick="pickStar('${id}',5)">★</span>
        </div>
        <textarea id="rtxt-${id}" rows="3" placeholder="Write your review…" maxlength="400"></textarea>
        <button onclick="submitReview('${id}')">Submit Review</button>
      </div>
      <div class="reviews-list">${items}</div>
    </div>`;
}

let pickedStars = {};
function pickStar(id, n) {
  pickedStars[id] = n;
  document.querySelectorAll('#spick-' + id + ' span').forEach(function (s, i) {
    s.classList.toggle('on', i < n);
  });
}

function submitReview(id) {
  const name   = (document.getElementById('rname-' + id).value || '').trim();
  const rating = pickedStars[id] || 0;
  const text   = (document.getElementById('rtxt-'  + id).value || '').trim();
  if (!name)   { alert('Please enter your name.');       return; }
  if (!rating) { alert('Please select a star rating.'); return; }
  if (!text)   { alert('Please write a review.');        return; }

  saveReview(id, name, rating, text);
  celebrateSuccess('Review submitted — thank you!');

  /* Refresh the reviews list immediately */
  const list = getReviews(id);
  document.querySelector('#spick-' + id).closest('.review-section')
    .querySelector('.reviews-list').innerHTML = list.map(r => `
      <div class="review-item">
        <div class="ri-top">
          <span class="ri-name">${r.name}</span>
          <span class="ri-stars">${starsHTML(r.rating)} ${r.rating}/5</span>
          <span class="ri-date">${r.date}</span>
        </div>
        <p>${r.text}</p>
      </div>`).join('');

  document.getElementById('rname-' + id).value = '';
  document.getElementById('rtxt-'  + id).value = '';
  pickedStars[id] = 0;
  document.querySelectorAll('#spick-' + id + ' span').forEach(s => s.classList.remove('on'));
  alert('✅ Thank you for your review!');
}

/* ── 4. DESTINATION CARDS ── */
function buildDestCards(list) {
  const grid = document.getElementById('dest-grid');
  grid.innerHTML = '';
  if (!list.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:40px;">No destinations found.</p>';
    return;
  }
  list.forEach(function (d) {
    const avg  = getAvgRating(d.id);
    const fav  = isFavorite(d.id);
    const inCompare = compareList.includes(d.id);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img" id="img-${d.id}"
           style="background-image:url('${d.image}'); background-color:#2d6a4f;">
        <span class="card-badge b-${d.category}">${cap(d.category)}</span>
        <button class="fav-btn ${fav ? 'is-fav' : ''}" onclick="event.stopPropagation(); toggleFavorite('${d.id}', this)" title="Save to favorites">${fav ? '♥' : '♡'}</button>
      </div>
      <div class="card-body">
        <h3>${d.name}</h3>
        <p class="card-desc">${d.description}</p>
        <div class="card-meta">
          <span>📍 ${d.province}</span>
          <span>🗓 ${d.bestSeason}</span>
        </div>
        <div class="card-rating">${starsHTML(avg)} ${avg > 0 ? avg + ' (' + getReviews(d.id).length + ' reviews)' : 'No reviews yet'}</div>
        <button class="card-btn" onclick="openDestDetail('${d.id}')">Read More + Reviews →</button>
        <label class="compare-check">
          <input type="checkbox" ${inCompare ? 'checked' : ''} onchange="toggleCompare('${d.id}', this)">
          Add to Compare
        </label>
      </div>`;
    grid.appendChild(card);
  });
  revealCards();
  // Wikipedia auto-photo-swap disabled — was overwriting correct curated photos with mismatched ones.
  // setTimeout(upgradeWikiImages, 600);
}

/* ── 5. DESTINATION FILTERS ── */
document.querySelectorAll('.fbtn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.f;
    closeDetail('dest-detail-panel');
    buildDestCards(f === 'all' ? destinations : destinations.filter(d => d.category === f));
  });
});

/* ── 6. DESTINATION DETAIL PANEL ── */
function openDestDetail(id) {
  const d = destinations.find(x => x.id === id);
  if (!d) return;
  const panel = document.getElementById('dest-detail-panel');
  panel.innerHTML = `
    <div class="detail-card">
      <img id="dp-${d.id}" class="detail-img" src="${d.image}"
           alt="${d.name}" loading="lazy" onerror="imgErr(this)" />
      <div class="detail-body">
        <span class="detail-badge">${cap(d.category)}</span>
        <h2>${d.name}</h2>
        <p>${d.description}</p>
        <div class="detail-meta">
          <span>📍 <strong>Province:</strong> ${d.province}</span>
          <span>🗓 <strong>Best Season:</strong> ${d.bestSeason}</span>
          <span>💰 <strong>Entry Fee:</strong> ${d.entryFee}</span>
        </div>
        <div id="weather-${d.id}" class="weather-widget">Loading weather…</div>
        <div class="detail-acts">${d.activities.map(a => `<span class="act-pill">${a}</span>`).join('')}</div>
        <div class="share-row">
          <span class="share-label">Share:</span>
          <button class="share-btn share-wa" onclick="shareDestination('${d.id}','whatsapp')" title="Share on WhatsApp">💬</button>
          <button class="share-btn share-fb" onclick="shareDestination('${d.id}','facebook')" title="Share on Facebook">📘</button>
          <button class="share-btn share-copy" onclick="shareDestination('${d.id}','copy')" title="Copy link">🔗</button>
        </div>
        ${reviewsHTML(d.id)}
        <button class="detail-close" onclick="closeDetail('dest-detail-panel')">✕ Close</button>
      </div>
    </div>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  loadWeather(d.latitude, d.longitude, `weather-${d.id}`);
}

/* ── Weather widget (OpenWeatherMap via backend) ── */
async function loadWeather(lat, lon, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !lat || !lon) return;
  container.innerHTML = 'Loading weather…';

  try {
    const res = await fetch(`${API}/weather?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    container.innerHTML = `
      <img src="https://openweathermap.org/img/wn/${data.icon}@2x.png" alt="${data.description}">
      <div>
        <div class="w-temp">${data.temp}°C</div>
        <div class="w-desc">${cap(data.description)}</div>
      </div>`;
  } catch (err) {
    container.innerHTML = '';
  }
}

function shareDestination(id, platform) {
  const d = destinations.find(x => x.id === id);
  if (!d) return;
  const shareText = `Check out ${d.name} on ExploreNepal! ${d.description.slice(0, 100)}...`;
  const shareUrl = window.location.origin + window.location.pathname + '#' + id;

  if (platform === 'whatsapp') {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + shareUrl), '_blank');
  } else if (platform === 'facebook') {
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl), '_blank', 'width=600,height=400');
  } else if (platform === 'copy') {
    navigator.clipboard.writeText(shareUrl).then(function () {
      showToast('Link copied to clipboard!', 'success');
    }).catch(function () {
      showToast('Could not copy link', 'error');
    });
  }
}

function closeDetail(pid) {
  const p = document.getElementById(pid);
  if (p) p.innerHTML = '';
}

/* ── 7. HOTEL CARDS ── */
function buildHotelCards(list) {
  const grid = document.getElementById('hotel-grid');
  grid.innerHTML = '';
  list.forEach(function (h) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img"
           style="background-image:url('${h.image}'); background-color:#4a0082;">
        <span class="card-badge b-hotel">${h.type}</span>
      </div>
      <div class="card-body">
        <h3>${h.name}</h3>
        <p class="card-desc">${h.description}</p>
        <div class="card-meta">
          <span>📍 ${h.location}</span>
          <span>💰 ${h.priceRange}</span>
        </div>
        <div class="card-rating">${starsHTML(h.rating)} ${h.rating} (${h.reviews} reviews)</div>
       <button class="card-btn" onclick="openHotelDetail('${h.id}')">View Details →</button>
<button class="card-btn" style="background:#d4a017;margin-left:8px" onclick="openBooking('${h.id}','${h.name}','hotel')">Book Now 🏨</button>
      </div>`;
    grid.appendChild(card);
  });
  revealCards();
}

document.querySelectorAll('.hbtn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.hbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.fh;
    closeDetail('hotel-detail-panel');
    buildHotelCards(f === 'all' ? hotels : hotels.filter(h => h.type === f));
  });
});

function openHotelDetail(id) {
  const h = hotels.find(x => x.id === id);
  if (!h) return;
  const panel = document.getElementById('hotel-detail-panel');
  panel.innerHTML = `
    <div class="detail-card">
      <img class="detail-img" src="${h.image}" alt="${h.name}"
           loading="lazy" onerror="imgErr(this)" />
      <div class="detail-body">
        <span class="detail-badge" style="background:#4a0082;">${h.type}</span>
        <h2>${h.name}</h2>
        <p>${h.description}</p>
        <div class="detail-meta">
          <span>📍 <strong>Location:</strong> ${h.location}</span>
          <span>💰 <strong>Price:</strong> ${h.priceRange}</span>
          <span>📞 <strong>Phone:</strong> ${h.phone}</span>
        </div>
        <div class="detail-acts">${h.amenities.map(a => `<span class="act-pill">${a}</span>`).join('')}</div>
        ${reviewsHTML(h.id)}
        <button class="detail-close" onclick="closeDetail('hotel-detail-panel')">✕ Close</button>
      </div>
    </div>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── 8. RESTAURANT CARDS ── */
function buildRestoCards(list) {
  const grid = document.getElementById('resto-grid');
  grid.innerHTML = '';
  list.forEach(function (r) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img"
           style="background-image:url('${r.image}'); background-color:#7b3f00;">
        <span class="card-badge b-resto">${r.cuisine}</span>
      </div>
      <div class="card-body">
        <h3>${r.name}</h3>
        <p class="card-desc">${r.description}</p>
        <div class="card-meta">
          <span>📍 ${r.location}</span>
          <span>💰 ${r.priceRange}</span>
        </div>
        <div class="card-rating">${starsHTML(r.rating)} ${r.rating} (${r.reviews} reviews)</div>
       <button class="card-btn" onclick="openRestoDetail('${r.id}')">View Details →</button>
<button class="card-btn" style="background:#d4a017;margin-left:8px" onclick="openBooking('${r.id}','${r.name}','restaurant')">Book Now 🍜</button>
      </div>`;
    grid.appendChild(card);
  });
  revealCards();
}

document.querySelectorAll('.rbtn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.rbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.fr;
    closeDetail('resto-detail-panel');
    buildRestoCards(f === 'all' ? restaurants : restaurants.filter(r => r.priceRange === f));
  });
});

function openRestoDetail(id) {
  const r = restaurants.find(x => x.id === id);
  if (!r) return;
  const panel = document.getElementById('resto-detail-panel');
  panel.innerHTML = `
    <div class="detail-card">
      <img class="detail-img" src="${r.image}" alt="${r.name}"
           loading="lazy" onerror="imgErr(this)" />
      <div class="detail-body">
        <span class="detail-badge" style="background:#7b3f00;">${r.cuisine}</span>
        <h2>${r.name}</h2>
        <p>${r.description}</p>
        <div class="detail-meta">
          <span>📍 <strong>Location:</strong> ${r.location}</span>
          <span>💰 <strong>Price Range:</strong> ${r.priceRange}</span>
          <span>📞 <strong>Phone:</strong> ${r.phone}</span>
        </div>
        <div class="detail-acts">${r.specialties.map(s => `<span class="act-pill">🍽 ${s}</span>`).join('')}</div>
        ${reviewsHTML(r.id)}
        <button class="detail-close" onclick="closeDetail('resto-detail-panel')">✕ Close</button>
      </div>
    </div>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── 9. SEARCH ── */
function liveSearch(q) {
  q = (q || '').trim().toLowerCase();
  closeDetail('detail-panel');
  const grid = document.getElementById('search-grid');
  if (!q) { grid.innerHTML = ''; return; }

  const results = destinations.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.province.toLowerCase().includes(q) ||
    d.category.toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q) ||
    d.activities.some(a => a.toLowerCase().includes(q))
  );

  grid.innerHTML = '';
  if (!results.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:30px;">No results for "' + q + '". Try a different keyword.</p>';
  } else {
    results.forEach(function (d) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-img" style="background-image:url('${d.image}'); background-color:#2d6a4f;">
          <span class="card-badge b-${d.category}">${cap(d.category)}</span>
        </div>
        <div class="card-body">
          <h3>${d.name}</h3>
          <p class="card-desc">${d.description}</p>
          <div class="card-meta"><span>📍 ${d.province}</span><span>🗓 ${d.bestSeason}</span></div>
          <button class="card-btn" onclick="openSearchDetail('${d.id}')">Read More + Reviews →</button>
        </div>`;
      grid.appendChild(card);
    });
  }
  document.getElementById('search-section').scrollIntoView({ behavior: 'smooth' });
  revealCards();
  // Wikipedia auto-photo-swap disabled — was overwriting correct curated photos with mismatched ones.
  // setTimeout(upgradeWikiImages, 400);
}

function openSearchDetail(id) {
  const d = destinations.find(x => x.id === id);
  if (!d) return;
  const panel = document.getElementById('detail-panel');
  panel.innerHTML = `
    <div class="detail-card">
      <img class="detail-img" src="${d.image}" alt="${d.name}"
           loading="lazy" onerror="imgErr(this)" />
      <div class="detail-body">
        <span class="detail-badge">${cap(d.category)}</span>
        <h2>${d.name}</h2>
        <p>${d.description}</p>
        <div class="detail-meta">
          <span>📍 <strong>Province:</strong> ${d.province}</span>
          <span>🗓 <strong>Best Season:</strong> ${d.bestSeason}</span>
          <span>💰 <strong>Entry Fee:</strong> ${d.entryFee}</span>
        </div>
        <div class="detail-acts">${d.activities.map(a => `<span class="act-pill">${a}</span>`).join('')}</div>
        ${reviewsHTML(d.id)}
        <button class="detail-close" onclick="closeDetail('detail-panel')">✕ Close</button>
      </div>
    </div>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function heroSearch() {
  const q = document.getElementById('hero-q').value;
  document.getElementById('main-q').value = q;
  liveSearch(q);
}
document.getElementById('hero-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') heroSearch(); });
document.getElementById('main-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') liveSearch(this.value); });

/* ── 10. MAP ── */
const map = L.map('the-map').setView([28.3, 84.1], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors', maxZoom: 18
}).addTo(map);

function dot(color) {
  return L.divIcon({
    html: `<div style="width:13px;height:13px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.4);"></div>`,
    className: '', iconSize: [13, 13], iconAnchor: [6, 6]
  });
}
const catColor = { mountain:'#1b4332', heritage:'#7b2d00', lake:'#0066bb', nature:'#2d6a1f' };
destinations.forEach(function (d) {
  L.marker([d.latitude, d.longitude], { icon: dot(catColor[d.category] || '#27ae60') })
    .addTo(map)
    .bindPopup(`<strong>${d.name}</strong><br><em style="color:#666;font-size:0.85rem;">${cap(d.category)} · ${d.province}</em><br><span style="font-size:0.82rem;">${d.bestSeason}</span>`);
});

/* ── 11. TRIP PLANNER ── */
let itinerary = {};

function addToPlanner() {
  const id  = document.getElementById('pick-dest').value;
  const day = parseInt(document.getElementById('pick-day').value, 10);
  if (!id)          { alert('Please choose a destination.'); return; }
  if (!day || day < 1) { alert('Enter a valid day number (1 or more).'); return; }
  const dest = destinations.find(d => d.id === id);
  if (!itinerary[day]) itinerary[day] = [];
  if (itinerary[day].includes(dest.name)) { alert(dest.name + ' is already on Day ' + day); return; }
  itinerary[day].push(dest.name);
  renderPlanner();
}

function removeItem(day, idx) {
  itinerary[day].splice(idx, 1);
  if (!itinerary[day].length) delete itinerary[day];
  renderPlanner();
}

function clearPlanner() {
  if (!Object.keys(itinerary).length) return;
  if (confirm('Clear your full itinerary?')) { itinerary = {}; renderPlanner(); }
}

function renderPlanner() {
  const board = document.getElementById('planner-board');
  if (!Object.keys(itinerary).length) {
    board.innerHTML = '<p class="plan-empty">Your itinerary is empty. Add destinations on the left!</p>';
    return;
  }
  let html = '';
  Object.keys(itinerary).map(Number).sort((a, b) => a - b).forEach(function (day) {
    html += `<div class="plan-day">📅 Day ${day}</div>`;
    itinerary[day].forEach(function (name, idx) {
      html += `<div class="plan-item"><span>📍 ${name}</span><button onclick="removeItem(${day},${idx})" title="Remove">✕</button></div>`;
    });
  });
  board.innerHTML = html;
}

/* ── DOWNLOAD ITINERARY AS PDF ── */
function downloadItineraryPDF() {
  if (!Object.keys(itinerary).length) {
    showToast('Add some destinations to your itinerary first', 'error');
    return;
  }
  if (typeof window.jspdf === 'undefined') {
    showToast('PDF library still loading — try again in a moment', 'error');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 24;

  // Header
  doc.setFillColor(20, 22, 31);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setTextColor(255, 77, 61);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ExploreNepal', 16, 22);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Nepal Trip Itinerary', 16, 29);
  y = 46;

  doc.setTextColor(35, 37, 43);
  const days = Object.keys(itinerary).map(Number).sort((a, b) => a - b);

  days.forEach(function (day) {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFillColor(45, 157, 111);
    doc.roundedRect(14, y - 6, pageWidth - 28, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Day ' + day, 18, y + 1);
    y += 12;

    doc.setTextColor(35, 37, 43);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    itinerary[day].forEach(function (name) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text('•  ' + name, 20, y);
      y += 8;
    });
    y += 4;
  });

  y += 6;
  if (y > 275) { doc.addPage(); y = 20; }
  doc.setDrawColor(230, 224, 214);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(107, 111, 118);
  doc.text('Generated by ExploreNepal — explorenepal.com', 14, y);

  doc.save('ExploreNepal-Itinerary.pdf');
  celebrateSuccess('Itinerary downloaded!');
}

/* ── QR CODE FOR ITINERARY ── */
function showItineraryQR() {
  if (!Object.keys(itinerary).length) {
    showToast('Add some destinations to your itinerary first', 'error');
    return;
  }
  const days = Object.keys(itinerary).map(Number).sort((a, b) => a - b);
  let summary = 'My ExploreNepal Trip:\n';
  days.forEach(function (day) {
    summary += 'Day ' + day + ': ' + itinerary[day].join(', ') + '\n';
  });
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(summary);

  let overlay = document.getElementById('qr-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'qr-overlay';
    overlay.className = 'compare-overlay';
    overlay.onclick = function (e) { if (e.target === overlay) overlay.classList.remove('open'); };
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="qr-modal">
      <button class="compare-modal-close" onclick="document.getElementById('qr-overlay').classList.remove('open')">✕</button>
      <h3 class="qr-modal-title">Scan to Save Your Itinerary</h3>
      <img src="${qrUrl}" alt="Itinerary QR Code" class="qr-img" />
      <p class="qr-hint">Scan with your phone camera to view a text summary of your ${days.length}-day trip, no app needed.</p>
    </div>`;
  overlay.classList.add('open');
}

/* ── 12. CONTACT FORM ── */
function submitForm() {
  const name  = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const msg   = document.getElementById('c-msg').value.trim();
  if (!name || !email || !msg) { alert('Please fill in your name, email and message.'); return; }
  const ok = document.getElementById('form-ok');
  ok.style.display = 'block';
  celebrateSuccess('Message sent! We\'ll get back to you soon.');
  document.getElementById('c-name').value  = '';
  document.getElementById('c-email').value = '';
  document.getElementById('c-msg').value   = '';
  setTimeout(function () { ok.style.display = 'none'; }, 5000);
}

/* ── 13. DROPDOWNS ── */
const pickSel = document.getElementById('pick-dest');
destinations.forEach(function (d) {
  const o = document.createElement('option');
  o.value = d.id; o.textContent = d.name; pickSel.appendChild(o);
});

/* ── 14. WIKIPEDIA IMAGE UPGRADE ──
   Calls Wikipedia's free API to get the latest real photo
   for each destination and swaps it into the card. */
const wikiMap = {
  everest:'Everest_Base_Camp_trek', annapurna:'Annapurna_Circuit',
  boudhanath:'Boudhanath', pashupatinath:'Pashupatinath_Temple',
  pokhara:'Phewa_Lake', chitwan:'Chitwan_National_Park',
  lumbini:'Lumbini', rara:'Rara_Lake', poonhill:'Poon_Hill',
  bhaktapur:'Bhaktapur_Durbar_Square', nagarkot:'Nagarkot',
  mustang:'Upper_Mustang', swayambhunath:'Swayambhunath',
  sarangkot:'Sarangkot', gokyo:'Gokyo_Lakes',
  bardiya:'Bardia_National_Park', patan:'Patan_Durbar_Square',
  bandipur:'Bandipur,_Nepal', ilam:'Ilam_District',
  janakpur:'Janaki_Mandir', gosainkunda:'Gosainkunda',
  chandragiri:'Chandragiri', gorkha:'Gorkha_Durbar',
  tansen:'Tansen,_Nepal', langtang:'Langtang_Valley',
  muktinath:'Muktinath', manaslu:'Manaslu',
  tilicho:'Tilicho_Lake', hadiya:'Udayapur_District'
};

function upgradeWikiImages() {
  const ids = Object.keys(wikiMap);
  for (let i = 0; i < ids.length; i += 10) {
    const batch  = ids.slice(i, i + 10);
    const titles = batch.map(id => encodeURIComponent(wikiMap[id])).join('|');
    const url    = 'https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=800&pilimit=50&format=json&origin=*&titles=' + titles;
    fetch(url).then(r => r.json()).then(function (data) {
      if (!data.query) return;
      Object.values(data.query.pages).forEach(function (page) {
        if (!page.thumbnail) return;
        const src = page.thumbnail.source;
        const key = Object.keys(wikiMap).find(id =>
          wikiMap[id].toLowerCase() === page.title.toLowerCase().replace(/ /g, '_')
        );
        if (!key) return;
        const el = document.getElementById('img-' + key);
        if (el) el.style.backgroundImage = "url('" + src + "')";
        const dp = document.getElementById('dp-' + key);
        if (dp) dp.src = src;
      });
    }).catch(function () {});
  }
}
// Wikipedia auto-photo-swap disabled — was overwriting correct curated photos with mismatched ones.
// setTimeout(upgradeWikiImages, 800);

/* ── 15. SCROLL REVEAL ── */
function revealCards() {
  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.style.opacity   = '1';
        en.target.style.transform = 'translateY(0)';
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.07 });
  document.querySelectorAll('.card, .ibox, .gal-item, .af-item').forEach(function (el) {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(20px)';
    el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    obs.observe(el);
  });
}
setTimeout(revealCards, 200);

/* ── 16. AUTH SYSTEM (localStorage) ─────────────────────── */
/* Users are stored as: { name, email, password } in localStorage */

function getUsers() {
  try { return JSON.parse(localStorage.getItem('en-users')) || []; }
  catch(e) { return []; }
}
function saveUsers(users) {
  localStorage.setItem('en-users', JSON.stringify(users));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem('en-session')) || null; }
  catch(e) { return null; }
}
function saveSession(user) {
  localStorage.setItem('en-session', user ? JSON.stringify(user) : 'null');
}

/* Show toast notification */
function showToast(msg, type) {
  let t = document.getElementById('auth-toast-el');
  if (!t) {
    t = document.createElement('div');
    t.id = 'auth-toast-el';
    t.className = 'auth-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'auth-toast ' + (type || '');
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { t.classList.add('show'); });
  });
  setTimeout(function() {
    t.classList.remove('show');
  }, 3000);
}

/* Success celebration: animated checkmark + confetti burst.
   Purely visual, self-contained — safe to call from anywhere. */
function celebrateSuccess(msg) {
  showToast(msg, 'success');

  // Checkmark badge
  var badge = document.createElement('div');
  badge.className = 'success-badge';
  badge.innerHTML = '<svg viewBox="0 0 52 52" class="success-check"><circle class="success-check-circle" cx="26" cy="26" r="23" fill="none"/><path class="success-check-mark" fill="none" d="M14 27l7 7 16-16"/></svg>';
  document.body.appendChild(badge);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { badge.classList.add('show'); });
  });

  // Confetti burst
  var colors = ['#ff4d3d', '#2d9d6f', '#ffd166', '#4f7a5c', '#fff'];
  var confettiWrap = document.createElement('div');
  confettiWrap.className = 'confetti-wrap';
  for (var i = 0; i < 24; i++) {
    var piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = (45 + Math.random() * 10) + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty('--dx', (Math.random() * 2 - 1) * 220 + 'px');
    piece.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    piece.style.animationDelay = (Math.random() * 0.15) + 's';
    confettiWrap.appendChild(piece);
  }
  document.body.appendChild(confettiWrap);

  setTimeout(function() {
    badge.classList.remove('show');
    setTimeout(function() {
      badge.remove();
      confettiWrap.remove();
    }, 400);
  }, 1600);
}

/* Open/close modal */
function openAuthModal(panel) {
  document.getElementById('auth-overlay').classList.add('open');
  document.getElementById('auth-modal').classList.add('open');
  if (panel === 'register') {
    document.getElementById('auth-login-panel').style.display = 'none';
    document.getElementById('auth-register-panel').style.display = 'block';
  } else {
    document.getElementById('auth-login-panel').style.display = 'block';
    document.getElementById('auth-register-panel').style.display = 'none';
  }
  clearAuthErrors();
}

function closeAuthModal() {
  document.getElementById('auth-overlay').classList.remove('open');
  document.getElementById('auth-modal').classList.remove('open');
  clearAuthErrors();
}

function clearAuthErrors() {
  var le = document.getElementById('login-err');
  var re = document.getElementById('reg-err');
  if (le) le.textContent = '';
  if (re) re.textContent = '';
}

function switchToRegister() { openAuthModal('register'); return false; }
function switchToLogin()    { openAuthModal('login');    return false; }

/* Login — checks Firebase first, falls back to localStorage */
function doLogin() {
  var email  = (document.getElementById('login-email').value || '').trim().toLowerCase();
  var pass   = (document.getElementById('login-pass').value  || '');
  var errEl  = document.getElementById('login-err');
  if (!email || !pass) { errEl.textContent = 'Please fill in all fields.'; return; }

  // Try Firebase first
  db.collection('users').doc(email).get()
    .then(function(doc) {
      if (doc.exists) {
        var userData = doc.data();
        if (userData.password === pass) {
          // Firebase login success
          var user = { name: userData.name, email: userData.email };
          saveSession(user);
          closeAuthModal();
          renderNavAuth();
          showToast('✅ Welcome back, ' + user.name + '!', 'success');
        } else {
          errEl.textContent = 'Incorrect email or password.';
        }
      } else {
        // Not in Firebase — try localStorage (old accounts)
        var users = getUsers();
        var user  = users.find(function(u) { return u.email === email && u.password === pass; });
        if (!user) { errEl.textContent = 'Incorrect email or password.'; return; }
        saveSession(user);
        closeAuthModal();
        renderNavAuth();
        showToast('✅ Welcome back, ' + user.name + '!', 'success');
      }
    })
    .catch(function(err) {
      console.warn('Firebase login error, trying localStorage:', err);
      // Offline fallback — use localStorage
      var users = getUsers();
      var user  = users.find(function(u) { return u.email === email && u.password === pass; });
      if (!user) { errEl.textContent = 'Incorrect email or password.'; return; }
      saveSession(user);
      closeAuthModal();
      renderNavAuth();
      showToast('✅ Welcome back, ' + user.name + '!', 'success');
    });
}

/* Register — saves to Firebase AND localStorage */
function doRegister() {
  var name   = (document.getElementById('reg-name').value  || '').trim();
  var email  = (document.getElementById('reg-email').value || '').trim().toLowerCase();
  var pass   = (document.getElementById('reg-pass').value  || '');
  var pass2  = (document.getElementById('reg-pass2').value || '');
  var errEl  = document.getElementById('reg-err');
  if (!name || !email || !pass || !pass2) { errEl.textContent = 'Please fill in all fields.'; return; }
  if (pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  if (pass !== pass2)  { errEl.textContent = 'Passwords do not match.'; return; }

  // Check if email already exists in Firebase
  db.collection('users').doc(email).get()
    .then(function(doc) {
      if (doc.exists) {
        errEl.textContent = 'An account with this email already exists.';
        return;
      }

      // Save to Firebase cloud database
      var newUser = { name: name, email: email, password: pass,
                      createdAt: new Date().toISOString() };

      db.collection('users').doc(email).set(newUser)
        .then(function() {
          console.log('User saved to Firebase!');
        })
        .catch(function(err) {
          console.warn('Firebase save error:', err);
        });

      // Also save to localStorage as backup (works offline)
      var users = getUsers();
      users.push({ name: name, email: email, password: pass });
      saveUsers(users);

      // Log in immediately
      saveSession({ name: name, email: email });
      closeAuthModal();
      renderNavAuth();
      showToast('🎉 Account created! Welcome, ' + name + '!', 'success');
    })
    .catch(function(err) {
      console.warn('Firebase check error, using localStorage:', err);
      // Offline fallback — localStorage only
      var users = getUsers();
      if (users.find(function(u) { return u.email === email; })) {
        errEl.textContent = 'An account with this email already exists.'; return;
      }
      var newUser = { name: name, email: email, password: pass };
      users.push(newUser);
      saveUsers(users);
      saveSession(newUser);
      closeAuthModal();
      renderNavAuth();
      showToast('🎉 Account created! Welcome, ' + name + '!', 'success');
    });
}

/* Logout */
function doLogout() {
  saveSession(null);
  renderNavAuth();
  showToast('👋 You have been signed out.', '');
}

/* Render the nav auth area based on session */
function renderNavAuth() {
  var navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;
  var session = getSession();
  if (session) {
    var initials = session.name.split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
    navAuth.innerHTML =
      '<div class="nav-user-btn" title="' + session.email + '">' +
        '<div class="nav-user-avatar">' + initials + '</div>' +
        '<span>' + session.name.split(' ')[0] + '</span>' +
      '</div>' +
      '<button class="nav-logout-btn" onclick="doLogout()">Sign Out</button>';
  } else {
    navAuth.innerHTML = '<button class="nav-login-btn" onclick="openAuthModal(\'login\')">🔐 Login</button>';
  }
}

/* Close modal on Escape key */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAuthModal();
});

/* Init auth on page load */
renderNavAuth();

/* ── 17. GALLERY — Wikipedia API thumbnails (same API as destination cards) ── */
// Uses en.wikipedia.org/w/api.php — free, CORS-enabled, returns real Nepal photos
// Same proven approach as the existing upgradeWikiImages() function in this project

const galleryItems = [
  // Mountains
  { cat:'mountain', wiki:'Mount_Everest',           cap:'Mount Everest (8,849m)' },
  { cat:'mountain', wiki:'Annapurna_Base_Camp',     cap:'Annapurna Base Camp' },
  { cat:'mountain', wiki:'Manaslu',                 cap:'Manaslu — 8th Highest Peak (8,163m)' },
  { cat:'mountain', wiki:'Machapuchare',            cap:'Machhapuchhre (Fishtail Peak)' },
  { cat:'mountain', wiki:'Namche_Bazaar',           cap:'Namche Bazaar, Everest Region' },
  { cat:'mountain', wiki:'Thorong_La',              cap:'Thorong La Pass — Annapurna Circuit' },
  { cat:'mountain', wiki:'Khumbu_Glacier',          cap:'Khumbu Glacier, Everest Trek' },
  { cat:'mountain', wiki:'Langtang_Valley',         cap:'Langtang Valley, Bagmati Province' },
  { cat:'mountain', wiki:'Poon_Hill',               cap:'Poon Hill Sunrise Panorama (3,210m)' },
  { cat:'mountain', wiki:'Gokyo_Lakes',             cap:'Gokyo Lakes, Everest Region' },
  { cat:'mountain', wiki:'Dhaulagiri',              cap:'Dhaulagiri from Thorong La Pass' },
  { cat:'mountain', wiki:'Tengboche',               cap:'Tengboche Monastery, Everest Region' },
  { cat:'mountain', wiki:'Kala_Patthar',            cap:'Everest from Kala Patthar (5,545m)' },
  { cat:'mountain', wiki:'Annapurna_Circuit',       cap:'Annapurna Circuit Trek' },
  { cat:'mountain', wiki:'Everest_Base_Camp_trek',  cap:'Everest Base Camp Trail' },

  // Heritage
  { cat:'heritage', wiki:'Boudhanath',              cap:'Boudhanath Stupa — UNESCO World Heritage' },
  { cat:'heritage', wiki:'Bhaktapur_Durbar_Square', cap:'Bhaktapur Durbar Square' },
  { cat:'heritage', wiki:'Swayambhunath',           cap:'Swayambhunath — Monkey Temple' },
  { cat:'heritage', wiki:'Pashupatinath_Temple',    cap:'Pashupatinath Temple, Kathmandu' },
  { cat:'heritage', wiki:'Patan_Durbar_Square',     cap:'Patan Durbar Square, Lalitpur' },
  { cat:'heritage', wiki:'Janaki_Mandir',           cap:'Janaki Mandir, Janakpur' },
  { cat:'heritage', wiki:'Lumbini',                 cap:'Lumbini — Birthplace of the Buddha' },
  { cat:'heritage', wiki:'Nyatapola_Temple',        cap:'Nyatapola Temple, Bhaktapur' },
  { cat:'heritage', wiki:'Lo_Manthang',             cap:'Lo Manthang Walled City, Upper Mustang' },
  { cat:'heritage', wiki:'Muktinath',               cap:'Muktinath Temple, Mustang (3,800m)' },
  { cat:'heritage', wiki:'Gorkha_Durbar',           cap:'Gorkha Durbar Palace' },
  { cat:'heritage', wiki:'Kathmandu_Durbar_Square', cap:'Kathmandu Durbar Square' },
  { cat:'heritage', wiki:'Bandipur,_Nepal',         cap:'Bandipur — Medieval Newari Town' },
  { cat:'heritage', wiki:'Tansen,_Nepal',           cap:'Tansen Old Bazaar, Palpa' },
  { cat:'heritage', wiki:'Upper_Mustang',           cap:'Upper Mustang — The Last Forbidden Kingdom' },

  // Lakes
  { cat:'lake', wiki:'Phewa_Lake',         cap:'Phewa Lake, Pokhara' },
  { cat:'lake', wiki:'Rara_Lake',          cap:'Rara Lake — Nepal\'s Largest Lake' },
  { cat:'lake', wiki:'Tilicho_Lake',       cap:'Tilicho Lake (4,919m)' },
  { cat:'lake', wiki:'Gokyo_Lakes',        cap:'Gokyo Glacial Lakes' },
  { cat:'lake', wiki:'Gosainkunda',        cap:'Gosainkunda Sacred Lake (4,380m)' },
  { cat:'lake', wiki:'Shey_Phoksundo_Lake',cap:'Shey Phoksundo Lake, Dolpo' },
  { cat:'lake', wiki:'Begnas_Lake',        cap:'Begnas Lake, Pokhara' },

  // Nature
  { cat:'nature', wiki:'Chitwan_National_Park',     cap:'Chitwan National Park' },
  { cat:'nature', wiki:'Indian_rhinoceros',         cap:'One-Horned Rhino, Chitwan' },
  { cat:'nature', wiki:'Bengal_tiger',              cap:'Bengal Tiger, Bardia National Park' },
  { cat:'nature', wiki:'Ilam_District',             cap:'Ilam Tea Gardens, East Nepal' },
  { cat:'nature', wiki:'Rhododendron_arboreum',     cap:'Rhododendron — Nepal\'s National Flower' },
  { cat:'nature', wiki:'Red_panda',                 cap:'Red Panda, Rara National Park' },
  { cat:'nature', wiki:'Bardia_National_Park',      cap:'Bardia National Park, Western Nepal' },
  { cat:'nature', wiki:'Sarangkot',                 cap:'Paragliding from Sarangkot, Pokhara' },
  { cat:'nature', wiki:'Nagarkot',                  cap:'Himalayan View from Nagarkot' },

  // Culture
  { cat:'culture', wiki:'Indra_Jatra',              cap:'Indra Jatra Festival, Kathmandu' },
  { cat:'culture', wiki:'Kumari_(goddess)',          cap:'Living Goddess Kumari, Kathmandu' },
  { cat:'culture', wiki:'Dal_bhat',                 cap:'Dal Bhat — Nepal\'s National Dish', img:'https://images.unsplash.com/photo-1467879885238-77db697bfad8?w=700&q=80' },
  { cat:'culture', wiki:'Momo_(food)',              cap:'Steamed Momos — Nepali Dumplings' },
  { cat:'culture', wiki:'Prayer_flags',             cap:'Prayer Flags in the Himalayas' },
  { cat:'culture', wiki:'Tharu_people',             cap:'Tharu Cultural Dance, Chitwan' },
  { cat:'culture', wiki:'Tihar_(festival)',         cap:'Tihar Festival of Lights' },
  { cat:'culture', wiki:'Dashain',                  cap:'Dashain — Nepal\'s Biggest Festival' },
  { cat:'culture', wiki:'Mithila_art',              cap:'Mithila Folk Art, Janakpur', img:'https://images.unsplash.com/photo-1719498481882-0ee699635b4e?w=700&q=80' },
  { cat:'culture', wiki:'Sherpa_people',            cap:'Sherpa People, Khumbu Valley' },
];

var currentGalFilter = 'all';
var extraLoaded = false;
var lbItems = [];
var lbIndex = 0;
var INITIAL_COUNT = 35;

/* ── Build empty grid first, then fetch images in batches ── */
function buildGallery(items, append) {
  var grid = document.getElementById('gallery-grid');
  if (!append) grid.innerHTML = '';

  items.forEach(function(item, idx) {
    var div = document.createElement('div');
    div.className = 'gal-item gal-loading';
    div.setAttribute('data-cat', item.cat);
    div.setAttribute('data-wiki', item.wiki);
    div.onclick = function() { openLightbox(div); };

    var img = document.createElement('img');
    img.alt = item.cap;

    if (item.img) {
      // Verified direct photo — bypass Wikipedia lookup entirely for this item.
      img.src = item.img;
      img.onload = function() { img.classList.add('loaded'); div.classList.remove('gal-loading'); };
    } else {
      // placeholder shimmer while loading via Wikipedia
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    }

    var span = document.createElement('span');
    span.textContent = item.cap;

    div.appendChild(img);
    div.appendChild(span);
    grid.appendChild(div);
  });

  applyGalleryFilter(currentGalFilter);
  var needsFetch = items.filter(function(it) { return !it.img; });
  fetchWikiImages(needsFetch, append ? galleryItems.indexOf(items[0]) : 0);
}

/* ── Fetch real Wikipedia thumbnails in batches of 10 ── */
function fetchWikiImages(items, startIdx) {
  var BATCH = 10;
  // Fallbacks grouped by category so a food/culture item never gets a random mountain photo.
  // These are the same photos already used successfully elsewhere in the app (data.js / seed.js).
  var fallbacksByCat = {
    mountain: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=700&q=80',
               'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=700&q=80'],
    heritage: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80',
               'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=700&q=80'],
    lake:     ['https://images.unsplash.com/photo-1706323625285-648bb6825e03?w=700&q=80',
               'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=80'],
    nature:   ['https://images.unsplash.com/photo-1571150825816-3b9c10640445?w=700&q=80',
               'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=700&q=80'],
    culture:  ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80', // Bhojan Griha (traditional Nepali food/decor)
               'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=700&q=80'], // Momos & More (street food)
  };
  function fallbackFor(cat) {
    var pool = fallbacksByCat[cat] || fallbacksByCat.heritage;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function applyImage(cell, imgSrc, cat) {
    var img = cell.querySelector('img');
    if (!img) return;
    img.src = imgSrc;
    img.onload = function() { img.classList.add('loaded'); cell.classList.remove('gal-loading'); };
    img.onerror = function() {
      img.src = fallbackFor(cat);
      img.onload = function() { img.classList.add('loaded'); cell.classList.remove('gal-loading'); };
    };
  }

  for (var i = 0; i < items.length; i += BATCH) {
    (function(batch, offset) {
      var titles = batch.map(function(it) { return encodeURIComponent(it.wiki); }).join('|');
      var url = 'https://en.wikipedia.org/w/api.php?action=query&prop=pageimages'
              + '&piprop=thumbnail&pithumbsize=700&pilimit=50&redirects=1'
              + '&format=json&origin=*&titles=' + titles;

      // Map data-wiki value -> category, so fallbacks can be matched correctly.
      var catByWiki = {};
      batch.forEach(function(it) { catByWiki[it.wiki] = it.cat; });

      fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data.query) throw new Error('no query in response');

          // Map the *final* (post-redirect/normalized) title back to the
          // *originally requested* title, so we can match against data-wiki.
          var finalToOriginal = {};
          batch.forEach(function(it) { finalToOriginal[it.wiki.replace(/ /g, '_').toLowerCase()] = it.wiki; });
          (data.query.normalized || []).forEach(function(n) {
            finalToOriginal[n.to.replace(/ /g, '_').toLowerCase()] = n.from;
          });
          (data.query.redirects || []).forEach(function(r) {
            var origFrom = finalToOriginal[r.from.replace(/ /g, '_').toLowerCase()] || r.from;
            finalToOriginal[r.to.replace(/ /g, '_').toLowerCase()] = origFrom;
          });

          var handledWikis = {};

          Object.values(data.query.pages).forEach(function(page) {
            var finalKey = page.title.replace(/ /g, '_').toLowerCase();
            var originalWiki = finalToOriginal[finalKey] || page.title;
            if (!page.thumbnail) return; // no image on this Wikipedia page — leave unhandled so the fallback pass below catches it

            handledWikis[originalWiki.replace(/ /g, '_').toLowerCase()] = true;
            var imgSrc = page.thumbnail.source;
            var cat = catByWiki[originalWiki] || 'heritage';
            var cells = document.querySelectorAll('.gal-item[data-wiki]');
            cells.forEach(function(cell) {
              var cellWiki = cell.getAttribute('data-wiki').replace(/ /g, '_').toLowerCase();
              if (cellWiki === originalWiki.replace(/ /g, '_').toLowerCase()) {
                applyImage(cell, imgSrc, cat);
              }
            });
          });

          // Any requested title that genuinely has no Wikipedia photo (rare
          // village/topic pages) — don't leave it stuck on the shimmer forever.
          batch.forEach(function(it) {
            var key = it.wiki.replace(/ /g, '_').toLowerCase();
            if (!handledWikis[key]) {
              var cells = document.querySelectorAll('.gal-item[data-wiki="' + it.wiki + '"]');
              cells.forEach(function(cell) {
                applyImage(cell, fallbackFor(it.cat), it.cat);
              });
            }
          });
        })
        .catch(function(err) {
          console.warn('Gallery fetch error:', err);
          // Network/API failure for this whole batch — fall back so items don't hang forever.
          batch.forEach(function(it) {
            var cells = document.querySelectorAll('.gal-item[data-wiki="' + it.wiki + '"]');
            cells.forEach(function(cell) {
              applyImage(cell, fallbackFor(it.cat), it.cat);
            });
          });
        });
    })(items.slice(i, i + BATCH), i);
  }
}

/* ── Load More ── */
function loadMoreGallery() {
  if (extraLoaded) return;
  extraLoaded = true;
  buildGallery(galleryItems.slice(INITIAL_COUNT), true);
  document.getElementById('gal-load-more').style.display = 'none';
}

/* ── Filter ── */
function applyGalleryFilter(cat) {
  currentGalFilter = cat;
  document.querySelectorAll('.gal-item').forEach(function(item) {
    item.classList.toggle('hidden', cat !== 'all' && item.getAttribute('data-cat') !== cat);
  });
}
document.querySelectorAll('.gfbtn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.gfbtn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    applyGalleryFilter(btn.getAttribute('data-gf'));
  });
});

/* ── Lightbox ── */
function openLightbox(el) {
  lbItems = Array.from(document.querySelectorAll('.gal-item:not(.hidden)'));
  lbIndex = lbItems.indexOf(el);
  showLbItem(lbIndex);
  document.getElementById('lightbox-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function showLbItem(idx) {
  var item = lbItems[idx];
  if (!item) return;
  var img = item.querySelector('img');
  var cap = item.querySelector('span');
  document.getElementById('lb-img').src = img.src;
  document.getElementById('lb-caption').textContent = cap ? cap.textContent : '';
  lbIndex = idx;
}
function closeLightbox() {
  document.getElementById('lightbox-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function lbNav(dir) {
  var next = (lbIndex + dir + lbItems.length) % lbItems.length;
  showLbItem(next);
}
document.addEventListener('keydown', function(e) {
  var lb = document.getElementById('lightbox-overlay');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'ArrowRight') lbNav(1);
  if (e.key === 'ArrowLeft')  lbNav(-1);
  if (e.key === 'Escape') closeLightbox();
});

/* ── INIT ── */
buildGallery(galleryItems.slice(0, INITIAL_COUNT));
// ── BOOKING SYSTEM ──
function openBooking(id, name, type) {
  const modal = document.getElementById('booking-modal');
  document.getElementById('booking-title').textContent = 'Book ' + name;
  document.getElementById('booking-item-id').value = id;
  document.getElementById('booking-item-name').value = name;
  document.getElementById('booking-type').value = type;
  modal.style.display = 'flex';
}

function closeBooking() {
  document.getElementById('booking-modal').style.display = 'none';
}

async function submitBooking() {
  const booking = {
    type:     document.getElementById('booking-type').value,
    itemId:   document.getElementById('booking-item-id').value,
    itemName: document.getElementById('booking-item-name').value,
    userName: document.getElementById('booking-name').value,
    email:    document.getElementById('booking-email').value,
    date:     document.getElementById('booking-date').value,
    guests:   document.getElementById('booking-guests').value,
    message:  document.getElementById('booking-message').value,
  };

  if (!booking.userName || !booking.email || !booking.date) {
    alert('Please fill in all required fields!');
    return;
  }

  try {
    const res = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    const data = await res.json();
    alert('✅ Booking confirmed for ' + booking.itemName + '!');
    closeBooking();
  } catch (err) {
    alert('❌ Booking failed. Please try again.');
  }
}