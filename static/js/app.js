'use strict';

// --- Маппинг WMO-кодов погоды ---
// код → { desc, dayIcon, nightIcon, bg }
const WMO_CODES = {
  0:  { desc: 'Ясно',                dayIcon: '☀️', nightIcon: '🌙', bg: 'clear' },
  1:  { desc: 'Преимущественно ясно', dayIcon: '🌤️', nightIcon: '🌙', bg: 'clear' },
  2:  { desc: 'Переменная облачность', dayIcon: '⛅', nightIcon: '☁️', bg: 'clouds' },
  3:  { desc: 'Пасмурно',            dayIcon: '☁️', nightIcon: '☁️', bg: 'clouds' },
  45: { desc: 'Туман',               dayIcon: '🌫️', nightIcon: '🌫️', bg: 'fog' },
  48: { desc: 'Изморозь',            dayIcon: '🌫️', nightIcon: '🌫️', bg: 'fog' },
  51: { desc: 'Лёгкая морось',       dayIcon: '🌦️', nightIcon: '🌧️', bg: 'rain' },
  53: { desc: 'Морось',              dayIcon: '🌦️', nightIcon: '🌧️', bg: 'rain' },
  55: { desc: 'Сильная морось',      dayIcon: '🌧️', nightIcon: '🌧️', bg: 'rain' },
  56: { desc: 'Ледяная морось',      dayIcon: '🌧️', nightIcon: '🌧️', bg: 'rain' },
  57: { desc: 'Сильная ледяная морось', dayIcon: '🌧️', nightIcon: '🌧️', bg: 'rain' },
  61: { desc: 'Небольшой дождь',     dayIcon: '🌦️', nightIcon: '🌧️', bg: 'rain' },
  63: { desc: 'Дождь',               dayIcon: '🌧️', nightIcon: '🌧️', bg: 'rain' },
  65: { desc: 'Сильный дождь',       dayIcon: '🌧️', nightIcon: '🌧️', bg: 'rain' },
  66: { desc: 'Ледяной дождь',       dayIcon: '🌧️', nightIcon: '🌧️', bg: 'rain' },
  67: { desc: 'Сильный ледяной дождь', dayIcon: '🌧️', nightIcon: '🌧️', bg: 'rain' },
  71: { desc: 'Небольшой снег',      dayIcon: '🌨️', nightIcon: '🌨️', bg: 'snow' },
  73: { desc: 'Снег',                dayIcon: '🌨️', nightIcon: '🌨️', bg: 'snow' },
  75: { desc: 'Сильный снег',        dayIcon: '❄️', nightIcon: '❄️', bg: 'snow' },
  77: { desc: 'Снежная крупа',       dayIcon: '🌨️', nightIcon: '🌨️', bg: 'snow' },
  80: { desc: 'Небольшой ливень',    dayIcon: '🌦️', nightIcon: '🌧️', bg: 'rain' },
  81: { desc: 'Ливень',              dayIcon: '🌧️', nightIcon: '🌧️', bg: 'rain' },
  82: { desc: 'Сильный ливень',      dayIcon: '🌧️', nightIcon: '🌧️', bg: 'rain' },
  85: { desc: 'Небольшой снегопад',  dayIcon: '🌨️', nightIcon: '🌨️', bg: 'snow' },
  86: { desc: 'Сильный снегопад',    dayIcon: '❄️', nightIcon: '❄️', bg: 'snow' },
  95: { desc: 'Гроза',               dayIcon: '⛈️', nightIcon: '⛈️', bg: 'storm' },
  96: { desc: 'Гроза с градом',      dayIcon: '⛈️', nightIcon: '⛈️', bg: 'storm' },
  99: { desc: 'Сильная гроза с градом', dayIcon: '⛈️', nightIcon: '⛈️', bg: 'storm' },
};

const BG_CLASSES = [
  'bg-day-clear', 'bg-day-clouds', 'bg-day-fog', 'bg-day-rain', 'bg-day-snow', 'bg-day-storm',
  'bg-night-clear', 'bg-night-clouds', 'bg-night-fog', 'bg-night-rain', 'bg-night-snow', 'bg-night-storm',
];

const DEFAULT_CITY = { name: 'Москва', lat: 55.7558, lon: 37.6173 };

// --- Элементы DOM ---
const el = {
  searchInput: document.getElementById('search-input'),
  suggestions: document.getElementById('suggestions'),
  loader: document.getElementById('loader'),
  errorBlock: document.getElementById('error-block'),
  errorMessage: document.getElementById('error-message'),
  retryBtn: document.getElementById('retry-btn'),
  content: document.getElementById('weather-content'),
  cityName: document.getElementById('city-name'),
  currentDate: document.getElementById('current-date'),
  currentIcon: document.getElementById('current-icon'),
  currentTemp: document.getElementById('current-temp'),
  currentDesc: document.getElementById('current-desc'),
  feelsLike: document.getElementById('feels-like'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
  pressure: document.getElementById('pressure'),
  hourlyList: document.getElementById('hourly-list'),
  dailyList: document.getElementById('daily-list'),
};

let lastCity = DEFAULT_CITY;
let suggestionItems = [];
let activeSuggestion = -1;
let searchAbort = null;
let debounceTimer = null;

// --- Утилиты ---
function wmoInfo(code) {
  return WMO_CODES[code] || { desc: 'Неизвестно', dayIcon: '🌡️', nightIcon: '🌡️', bg: 'clouds' };
}

function iconFor(code, isDay) {
  const info = wmoInfo(code);
  return isDay ? info.dayIcon : info.nightIcon;
}

function show(node) { node.classList.remove('hidden'); }
function hide(node) { node.classList.add('hidden'); }

// --- Геокодинг ---
async function searchCity(query, signal) {
  const url = `/api/search/?name=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Геокодинг: HTTP ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

// --- Автодополнение ---
function renderSuggestions(results) {
  el.suggestions.innerHTML = '';
  suggestionItems = results;
  activeSuggestion = -1;
  if (!results.length) {
    hide(el.suggestions);
    return;
  }
  results.forEach((r, i) => {
    const li = document.createElement('li');
    const sub = [r.admin1, r.country].filter(Boolean).join(', ');
    li.innerHTML = `${r.name}<span class="sub">${sub}</span>`;
    li.addEventListener('click', () => selectSuggestion(i));
    el.suggestions.appendChild(li);
  });
  show(el.suggestions);
}

function selectSuggestion(index) {
  const r = suggestionItems[index];
  if (!r) return;
  closeSuggestions();
  el.searchInput.value = r.name;
  el.searchInput.blur();
  loadWeather(r.latitude, r.longitude, r.name);
}

function closeSuggestions() {
  hide(el.suggestions);
  suggestionItems = [];
  activeSuggestion = -1;
}

function highlightSuggestion(index) {
  const items = el.suggestions.querySelectorAll('li');
  items.forEach((li, i) => li.classList.toggle('active', i === index));
  activeSuggestion = index;
}

el.searchInput.addEventListener('input', () => {
  const query = el.searchInput.value.trim();
  clearTimeout(debounceTimer);
  if (query.length < 2) {
    closeSuggestions();
    return;
  }
  debounceTimer = setTimeout(async () => {
    if (searchAbort) searchAbort.abort();
    searchAbort = new AbortController();
    try {
      const results = await searchCity(query, searchAbort.signal);
      renderSuggestions(results);
    } catch (e) {
      if (e.name !== 'AbortError') closeSuggestions();
    }
  }, 300);
});

el.searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'ArrowDown' && suggestionItems.length) {
    e.preventDefault();
    highlightSuggestion((activeSuggestion + 1) % suggestionItems.length);
  } else if (e.key === 'ArrowUp' && suggestionItems.length) {
    e.preventDefault();
    highlightSuggestion((activeSuggestion - 1 + suggestionItems.length) % suggestionItems.length);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeSuggestion >= 0) {
      selectSuggestion(activeSuggestion);
    } else if (suggestionItems.length) {
      selectSuggestion(0);
    } else {
      const query = el.searchInput.value.trim();
      if (query.length < 2) return;
      try {
        const results = await searchCity(query);
        if (results.length) {
          suggestionItems = results;
          selectSuggestion(0);
        } else {
          showError('Город не найден. Проверьте название и попробуйте снова.');
        }
      } catch {
        showError('Не удалось выполнить поиск. Проверьте подключение к интернету.');
      }
    }
  } else if (e.key === 'Escape') {
    closeSuggestions();
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box')) closeSuggestions();
});

// --- Загрузка погоды ---
async function loadWeather(lat, lon, name) {
  hide(el.errorBlock);
  hide(el.content);
  show(el.loader);
  try {
    const url = `/api/weather/?lat=${lat}&lon=${lon}&city=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Прогноз: HTTP ${res.status}`);
    const data = await res.json();

    lastCity = { name, lat, lon };

    // Сохраняем город в сессии Django
    fetch('/api/save-city/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, lat: lat, lon: lon })
    }).catch(() => {});

    renderCurrent(data, name);
    renderHourly(data);
    renderDaily(data);
    setBackground(data.current.weather_code, data.current.is_day === 1);

    hide(el.loader);
    show(el.content);
  } catch (e) {
    hide(el.loader);
    showError('Не удалось загрузить данные о погоде. Проверьте подключение к интернету.');
  }
}

function showError(message) {
  hide(el.loader);
  hide(el.content);
  el.errorMessage.textContent = message;
  show(el.errorBlock);
}

el.retryBtn.addEventListener('click', () => {
  loadWeather(lastCity.lat, lastCity.lon, lastCity.name);
});

// --- Рендер ---
function renderCurrent(data, name) {
  const c = data.current;
  const isDay = c.is_day === 1;
  const info = wmoInfo(c.weather_code);

  el.cityName.textContent = name;
  el.currentDate.textContent = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  el.currentIcon.textContent = iconFor(c.weather_code, isDay);
  el.currentTemp.textContent = `${Math.round(c.temperature_2m)}°`;
  el.currentDesc.textContent = info.desc;
  el.feelsLike.textContent = `${Math.round(c.apparent_temperature)}°`;
  el.humidity.textContent = `${c.relative_humidity_2m}%`;
  el.wind.textContent = `${Math.round(c.wind_speed_10m)} м/с`;
  el.pressure.textContent = `${Math.round(c.surface_pressure * 0.75006)} мм`;
}

function renderHourly(data) {
  const { time, temperature_2m, weather_code } = data.hourly;
  // ISO-время из API уже в локальной зоне города; текущий час = current.time без минут
  const currentHour = data.current.time.slice(0, 13);
  let start = time.findIndex((t) => t.slice(0, 13) === currentHour);
  if (start < 0) start = 0;

  el.hourlyList.innerHTML = '';
  for (let i = start; i < Math.min(start + 24, time.length); i++) {
    const hour = parseInt(time[i].slice(11, 13), 10);
    const isDay = hour >= 6 && hour < 21;
    const item = document.createElement('div');
    item.className = 'hourly-item';
    item.innerHTML = `
      <span class="hourly-time">${i === start ? 'Сейчас' : time[i].slice(11, 16)}</span>
      <span class="hourly-icon">${iconFor(weather_code[i], isDay)}</span>
      <span class="hourly-temp">${Math.round(temperature_2m[i])}°</span>
    `;
    el.hourlyList.appendChild(item);
  }
}

function renderDaily(data) {
  const { time, temperature_2m_max, temperature_2m_min, weather_code } = data.daily;
  el.dailyList.innerHTML = '';
  time.forEach((day, i) => {
    const label = i === 0
      ? 'Сегодня'
      : new Date(day).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
    const item = document.createElement('div');
    item.className = 'daily-item';
    item.innerHTML = `
      <span class="daily-day">${label}</span>
      <span class="daily-icon">${iconFor(weather_code[i], true)}</span>
      <span class="daily-temps">
        <span class="max">${Math.round(temperature_2m_max[i])}°</span>
        <span class="min">${Math.round(temperature_2m_min[i])}°</span>
      </span>
    `;
    el.dailyList.appendChild(item);
  });
}

function setBackground(code, isDay) {
  const bg = wmoInfo(code).bg;
  document.body.classList.remove(...BG_CLASSES);
  document.body.classList.add(`bg-${isDay ? 'day' : 'night'}-${bg}`);
}

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', () => {
  // Читаем последний город из data-атрибута body
  const body = document.body;
  const lastCityData = body.getAttribute('data-last-city');
  try {
    const saved = JSON.parse(lastCityData || '{}');
    if (saved && saved.name && typeof saved.lat === 'number' && typeof saved.lon === 'number') {
      lastCity = saved;
    }
  } catch { /* повреждённые данные — используем город по умолчанию */ }
  loadWeather(lastCity.lat, lastCity.lon, lastCity.name);
});
