const THEME_STORAGE_KEY = 'glass-theme';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SOUND_DIRECTORY = './Sounds/';
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.mp4', '.webm'];

function createCoverSvg(start, end, label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}"/>
          <stop offset="100%" stop-color="${end}"/>
        </linearGradient>
      </defs>
      <rect width="300" height="300" rx="36" fill="url(#g)"/>
      <circle cx="76" cy="82" r="58" fill="rgba(255,255,255,0.12)"/>
      <circle cx="226" cy="220" r="70" fill="rgba(255,255,255,0.08)"/>
      <path d="M58 206c40-42 102-54 166-36" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="10" stroke-linecap="round"/>
      <text x="150" y="162" text-anchor="middle" font-size="32" font-weight="700" font-family="Arial, sans-serif" fill="white" letter-spacing="4">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function makeFallbackPlaylist() {
  return [
    {
      title: 'Glass Horizon',
      artist: 'NOEL',
      cover: createCoverSvg('#7dd3fc', '#2563eb', 'GH'),
      src: './Sounds/track1.mp3',
    },
    {
      title: 'Night Signal',
      artist: 'NOEL',
      cover: createCoverSvg('#f9a8d4', '#8b5cf6', 'NS'),
      src: './Sounds/track2.mp3',
    },
    {
      title: 'Afterglow',
      artist: 'NOEL',
      cover: createCoverSvg('#fbbf24', '#fb7185', 'AG'),
      src: './Sounds/track3.mp3',
    },
  ];
}

const state = {
  theme: 'day',
  currentTrack: 0,
  isPlaying: false,
  shuffle: false,
  repeatMode: 'off',
  volume: 0.7,
  playlistOpen: false,
  playlist: makeFallbackPlaylist(),
};

const audio = new Audio();
audio.volume = state.volume;
audio.preload = 'auto';

const elements = {
  body: document.body,
  themeToggle: document.getElementById('themeToggleButton'),
  themeLabel: document.getElementById('themeLabel'),
  themeIcon: document.getElementById('themeIcon'),
  copyBtn: document.getElementById('copyDiscordBtn'),
  copyToast: document.getElementById('copyToast'),
  musicPlayer: document.getElementById('musicPlayer'),
  trackTitle: document.getElementById('trackTitle'),
  trackArtist: document.getElementById('trackArtist'),
  coverArt: document.getElementById('coverArt'),
  playBtn: document.getElementById('playBtn'),
  playIcon: document.getElementById('playIcon'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  repeatBtn: document.getElementById('repeatBtn'),
  progressRange: document.getElementById('progressRange'),
  volumeRange: document.getElementById('volumeRange'),
  currentTime: document.getElementById('currentTime'),
  totalTime: document.getElementById('totalTime'),
  playlistToggle: document.getElementById('playlistToggle'),
  playlistList: document.getElementById('playlistList'),
  muteBtn: document.getElementById('muteBtn'),
  volumeIcon: document.getElementById('volumeIcon'),
  toast: document.getElementById('toast'),
};

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove('visible'), 2200);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getAudioExtension(path) {
  const normalized = String(path).toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

function normalizeTrackName(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function addSourceSong(filePath) {
  const cleanFileName = filePath.split('/').pop() || 'track';
  const label = normalizeTrackName(cleanFileName);
  return {
    title: label || 'Untitled Track',
    artist: 'NOEL',
    cover: createCoverSvg('#7dd3fc', '#2563eb', label.slice(0, 2).toUpperCase() || 'TR'),
    src: filePath,
  };
}

function parseDirectoryListing(directoryHtml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(directoryHtml, 'text/html');
  const anchors = [...doc.querySelectorAll('a[href]')];
  const items = anchors
    .map((node) => node.getAttribute('href'))
    .filter(Boolean)
    .map((href) => decodeURIComponent(href).replace(/^\//, '').replace(/^\.\//, ''))
    .filter((value) => getAudioExtension(value))
    .map((value) => value.startsWith('Sounds') || value.startsWith('./Sounds') ? value : `./Sounds/${value}`)
    .filter((value, index, arr) => arr.indexOf(value) === index);

  return items;
}

async function loadSoundLibrary() {
  try {
    const response = await fetch(SOUND_DIRECTORY, { cache: 'no-store' });
    if (!response.ok) return null;

    const html = await response.text();
    const files = parseDirectoryListing(html);
    if (!files.length) return null;

    return files.map((path) => addSourceSong(path));
  } catch (error) {
    return null;
  }
}

function setThemeButtonLabel() {
  elements.themeLabel.textContent = state.theme === 'night' ? 'Modo Dia' : 'Modo Noite';
}

function applyTheme(themeName) {
  state.theme = themeName;
  elements.body.setAttribute('data-theme', themeName);
  setThemeButtonLabel();
  localStorage.setItem(THEME_STORAGE_KEY, themeName);

  const skyGoal = themeName === 'night' ? 1 : 0;
  skyState.target = skyGoal;
}

function toggleTheme() {
  const nextTheme = state.theme === 'day' ? 'night' : 'day';
  applyTheme(nextTheme);
}

function updateProgressStyles() {
  const value = Number(elements.progressRange.value || 0);
  const min = Number(elements.progressRange.min || 0);
  const max = Number(elements.progressRange.max || 100);
  const percentage = ((value - min) / (max - min)) * 100;
  elements.progressRange.style.setProperty('--range-progress', `${percentage}%`);
}

function updateVolumeStyles() {
  const value = Number(elements.volumeRange.value || 0.7);
  const percentage = value * 100;
  elements.volumeRange.style.setProperty('--range-progress', `${percentage}%`);
}

function updatePlayButton() {
  const isPaused = audio.paused;
  elements.playIcon.innerHTML = isPaused
    ? '<path d="M8 5v14l11-7-11-7z"></path>'
    : '<path d="M8 5h3v14H8zm5 0h3v14h-3z"></path>';
  elements.playBtn.setAttribute('aria-label', isPaused ? 'Reproduzir' : 'Pausar');
}

function updateVolumeIcon() {
  const isMuted = audio.volume === 0;
  const path = isMuted
    ? '<path d="M11 5L6 9H3v6h3l5 4V5z"></path><path d="M15 9l5 6"></path><path d="M20 9l-5 6"></path>'
    : '<path d="M11 5L6 9H3v6h3l5 4V5z"></path><path d="M16 9a4 4 0 0 1 0 6"></path><path d="M18.5 6.5a7 7 0 0 1 0 11"></path>';
  elements.volumeIcon.innerHTML = path;
}

function setRepeatButtonState() {
  const hasRepeat = state.repeatMode !== 'off';
  elements.repeatBtn.classList.toggle('active', hasRepeat);
  elements.repeatBtn.classList.toggle('repeat-mode-active', hasRepeat);
}

function setShuffleButtonState() {
  elements.shuffleBtn.classList.toggle('active', state.shuffle);
}

function renderPlaylist() {
  elements.playlistList.innerHTML = state.playlist
    .map((track, index) => {
      const activeClass = index === state.currentTrack ? 'active' : '';
      return `
        <button class="playlist-item ${activeClass}" type="button" data-index="${index}" aria-label="Reproduzir ${track.title}">
          <span class="playlist-index">${index + 1}</span>
          <img class="playlist-art" src="${track.cover}" alt="Capa da faixa ${track.title}" />
          <span class="playlist-copy">
            <span class="playlist-title">${track.title}</span>
            <span class="playlist-artist">${track.artist}</span>
          </span>
        </button>
      `;
    })
    .join('');

  elements.playlistList.querySelectorAll('.playlist-item').forEach((item) => {
    item.addEventListener('click', () => {
      const nextIndex = Number(item.dataset.index);
      if (Number.isNaN(nextIndex)) return;
      playTrack(nextIndex);
    });
  });
}

function loadTrack(index) {
  if (!state.playlist.length) return;

  const safeIndex = (index + state.playlist.length) % state.playlist.length;
  state.currentTrack = safeIndex;

  const track = state.playlist[safeIndex];
  elements.trackTitle.textContent = track.title;
  elements.trackArtist.textContent = track.artist;
  elements.coverArt.src = track.cover;
  audio.src = track.src;
  audio.load();

  elements.progressRange.value = 0;
  elements.currentTime.textContent = '0:00';
  elements.totalTime.textContent = '0:00';
  updateProgressStyles();
  renderPlaylist();
}

function playTrack(index) {
  loadTrack(index);

  audio.play().then(() => {
    state.isPlaying = true;
    updatePlayButton();
  }).catch(() => {
    state.isPlaying = false;
    updatePlayButton();
    showToast('Clique novamente para iniciar a reprodução.');
  });
}

function nextTrack() {
  if (state.shuffle) {
    const randomIndex = Math.floor(Math.random() * state.playlist.length);
    playTrack(randomIndex);
    return;
  }

  playTrack(state.currentTrack + 1);
}

function previousTrack() {
  playTrack(state.currentTrack - 1);
}

function togglePlayback() {
  if (!state.playlist.length) {
    showToast('Nenhuma faixa disponível.');
    return;
  }

  if (audio.paused) {
    audio.play().then(() => {
      state.isPlaying = true;
      updatePlayButton();
    }).catch(() => {
      showToast('Não foi possível iniciar a reprodução.');
    });
  } else {
    audio.pause();
    state.isPlaying = false;
    updatePlayButton();
  }
}

function cycleRepeatMode() {
  const modes = ['off', 'track', 'list'];
  const currentIndex = modes.indexOf(state.repeatMode);
  state.repeatMode = modes[(currentIndex + 1) % modes.length];
  setRepeatButtonState();
  showToast(state.repeatMode === 'off' ? 'Repete desligado' : state.repeatMode === 'track' ? 'Repetição de faixa' : 'Repetição da lista');
}

function handleEnded() {
  if (state.repeatMode === 'track') {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  if (state.repeatMode === 'list') {
    nextTrack();
    return;
  }

  if (state.shuffle) {
    const nextIndex = Math.floor(Math.random() * state.playlist.length);
    playTrack(nextIndex);
    return;
  }

  nextTrack();
}

function togglePlaylist() {
  state.playlistOpen = !state.playlistOpen;
  elements.musicPlayer.classList.toggle('open', state.playlistOpen);
  elements.playlistToggle.setAttribute('aria-expanded', String(state.playlistOpen));
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const initialTheme = savedTheme === 'night' || savedTheme === 'day' ? savedTheme : 'day';
  applyTheme(initialTheme);
}

function bindUI() {
  elements.themeToggle.addEventListener('click', toggleTheme);

  elements.copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('noel6956');
      elements.copyToast.classList.add('show');
      setTimeout(() => elements.copyToast.classList.remove('show'), 1800);
    } catch {
      showToast('Não foi possível copiar o Discord.');
    }
  });

  elements.playBtn.addEventListener('click', togglePlayback);
  elements.prevBtn.addEventListener('click', previousTrack);
  elements.nextBtn.addEventListener('click', nextTrack);
  elements.shuffleBtn.addEventListener('click', () => {
    state.shuffle = !state.shuffle;
    setShuffleButtonState();
    showToast(state.shuffle ? 'Aleatório ativado' : 'Aleatório desativado');
  });
  elements.repeatBtn.addEventListener('click', cycleRepeatMode);
  elements.playlistToggle.addEventListener('click', togglePlaylist);

  elements.progressRange.addEventListener('input', (event) => {
    if (!audio.duration) return;
    const value = Number(event.target.value);
    const progress = (value / 100) * audio.duration;
    audio.currentTime = progress;
    elements.currentTime.textContent = formatTime(progress);
    updateProgressStyles();
  });

  elements.volumeRange.addEventListener('input', (event) => {
    state.volume = Number(event.target.value);
    audio.volume = state.volume;
    updateVolumeStyles();
    updateVolumeIcon();
  });

  elements.muteBtn.addEventListener('click', () => {
    if (audio.volume > 0) {
      audio.volume = 0;
      elements.volumeRange.value = '0';
    } else {
      audio.volume = state.volume || 0.7;
      elements.volumeRange.value = String(audio.volume);
    }
    updateVolumeStyles();
    updateVolumeIcon();
  });

  window.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty('--mx', `${x}%`);
    document.documentElement.style.setProperty('--my', `${y}%`);
  });
}

function bindAudio() {
  audio.addEventListener('loadedmetadata', () => {
    elements.totalTime.textContent = formatTime(audio.duration || 0);
    elements.progressRange.value = 0;
    updateProgressStyles();
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    elements.progressRange.value = percent;
    elements.currentTime.textContent = formatTime(audio.currentTime);
    updateProgressStyles();
  });

  audio.addEventListener('ended', handleEnded);
  audio.addEventListener('play', () => {
    state.isPlaying = true;
    updatePlayButton();
  });

  audio.addEventListener('pause', () => {
    state.isPlaying = false;
    updatePlayButton();
  });

  audio.addEventListener('volumechange', updateVolumeIcon);
}

const skyState = {
  target: 0,
  progress: 0,
  stars: [],
  clouds: [],
  pointerX: 0,
  pointerY: 0,
  width: 0,
  height: 0,
};

function createStars(count) {
  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const safeCount = isMobile ? 90 : count;

  skyState.stars = Array.from({ length: safeCount }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 2.1 + 0.8,
    alpha: Math.random() * 0.75 + 0.15,
    twinkle: Math.random() * Math.PI * 2,
    drift: Math.random() * 0.5 + 0.25,
  }));
}

function createClouds() {
  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const count = isMobile ? 4 : 6;
  skyState.clouds = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random() * 0.6 + 0.08,
    scale: Math.random() * 1.2 + 0.7,
    speed: Math.random() * 0.1 + 0.03,
    opacity: Math.random() * 0.12 + 0.08,
  }));
}

function resizeSky() {
  const canvas = document.getElementById('skyCanvas');
  const ratio = window.devicePixelRatio || 1;
  skyState.width = window.innerWidth;
  skyState.height = window.innerHeight;
  canvas.width = skyState.width * ratio;
  canvas.height = skyState.height * ratio;
  canvas.style.width = `${skyState.width}px`;
  canvas.style.height = `${skyState.height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  createStars(220);
  createClouds();
}

function drawCloud(x, y, scale, opacity, ctx) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(0, 0, 22, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(18, -10, 18, Math.PI, Math.PI * 2);
  ctx.arc(44, -8, 22, Math.PI, Math.PI * 2);
  ctx.arc(68, 0, 22, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fillStyle = `rgba(255,255,255,${opacity})`;
  ctx.fill();
  ctx.restore();
}

function drawSky() {
  const canvas = document.getElementById('skyCanvas');
  const ctx = canvas.getContext('2d');

  skyState.progress += (skyState.target - skyState.progress) * 0.04;

  const dayTop = [126, 196, 255];
  const dayBottom = [240, 248, 255];
  const nightTop = [5, 10, 30];
  const nightBottom = [22, 32, 70];

  const mix = skyState.progress;
  const rTop = Math.round(dayTop[0] + (nightTop[0] - dayTop[0]) * mix);
  const gTop = Math.round(dayTop[1] + (nightTop[1] - dayTop[1]) * mix);
  const bTop = Math.round(dayTop[2] + (nightTop[2] - dayTop[2]) * mix);

  const rBot = Math.round(dayBottom[0] + (nightBottom[0] - dayBottom[0]) * mix);
  const gBot = Math.round(dayBottom[1] + (nightBottom[1] - dayBottom[1]) * mix);
  const bBot = Math.round(dayBottom[2] + (nightBottom[2] - dayBottom[2]) * mix);

  const gradient = ctx.createLinearGradient(0, 0, 0, skyState.height);
  gradient.addColorStop(0, `rgb(${rTop}, ${gTop}, ${bTop})`);
  gradient.addColorStop(1, `rgb(${rBot}, ${gBot}, ${bBot})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, skyState.width, skyState.height);

  const sunX = skyState.width * (0.18 + 0.6 * (1 - mix));
  const sunY = skyState.height * (0.24 + 0.42 * (1 - mix));
  const moonX = skyState.width * (0.76 - 0.52 * mix);
  const moonY = skyState.height * (0.22 + 0.36 * mix);
  const sunRadius = 52;
  const moonRadius = 36;

  ctx.beginPath();
  ctx.fillStyle = `rgba(255, 210, 94, ${0.8 + (1 - mix) * 0.2})`;
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140);
  glow.addColorStop(0, 'rgba(255,255,255,0.52)');
  glow.addColorStop(0.2, 'rgba(255,207,92,0.35)');
  glow.addColorStop(1, 'rgba(255,207,92,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 150, sunY - 150, 300, 300);

  const moonAlpha = Math.max(0, mix * 1.2);
  ctx.beginPath();
  ctx.fillStyle = `rgba(255,255,255,${moonAlpha})`;
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = `rgba(255,255,255,${moonAlpha * 0.2})`;
  ctx.arc(moonX + 15, moonY - 8, moonRadius * 0.82, 0, Math.PI * 2);
  ctx.fill();

  const starAlphaBase = mix * 1.2;
  skyState.stars.forEach((star, index) => {
    const offsetX = (skyState.pointerX || 0) * 18 * star.drift;
    const offsetY = (skyState.pointerY || 0) * 18 * star.drift;
    const px = star.x * skyState.width + offsetX;
    const py = star.y * skyState.height * 0.82 + offsetY;
    const twinkle = 0.4 + 0.6 * Math.sin((performance.now() / 700) + star.twinkle + index);
    const alpha = Math.min(1, star.alpha * twinkle * starAlphaBase);

    if (alpha <= 0.03) return;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.arc(px, py, star.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const meteorChance = Math.random() < (0.0025 + mix * 0.006);
  if (meteorChance && mix > 0.6) {
    const x = Math.random() * skyState.width * 0.7 + 30;
    const y = Math.random() * skyState.height * 0.28 + 15;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 60, y + 35);
    ctx.stroke();
  }

  skyState.clouds.forEach((cloud, index) => {
    const drift = ((performance.now() * 0.01 * cloud.speed) + index * 40) % (skyState.width + 250);
    const x = ((cloud.x * skyState.width) + drift) % (skyState.width + 220) - 120;
    const y = cloud.y * skyState.height + Math.sin((performance.now() / 1600) + index) * 10;
    drawCloud(x, y, cloud.scale * (1 + mix * 0.1), cloud.opacity + mix * 0.2, ctx);
  });

  requestAnimationFrame(drawSky);
}

function bindSky() {
  createStars(220);
  createClouds();
  resizeSky();
  window.addEventListener('resize', resizeSky);
  window.addEventListener('pointermove', (event) => {
    skyState.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    skyState.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  });
  requestAnimationFrame(drawSky);
}

async function initializePlaylist() {
  const filesFromFolder = await loadSoundLibrary();

  if (filesFromFolder && filesFromFolder.length) {
    state.playlist = filesFromFolder;
  } else {
    state.playlist = makeFallbackPlaylist();
    showToast('Pasta Sounds vazia. Coloque seus arquivos MP3/WAV/MP4 aqui.');
  }

  renderPlaylist();
  loadTrack(0);
}

function init() {
  initTheme();
  bindUI();
  bindAudio();
  updateVolumeStyles();
  setRepeatButtonState();
  setShuffleButtonState();
  updatePlayButton();
  updateVolumeIcon();
  initializePlaylist();
  bindSky();

  if (prefersReducedMotion) {
    skyState.target = state.theme === 'night' ? 1 : 0;
    skyState.progress = skyState.target;
  }
}

init();
