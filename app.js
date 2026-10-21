const THEME_STORAGE_KEY = 'noel-theme-v1';

const themePresets = {
  violet: {
    accent: '#8b5cf6',
    accentTwo: '#7dd3fc',
    background: '#0a0c12',
    surface: '#121a2b',
    text: '#f8fafc',
    border: '#2b3648',
  },
  cyber: {
    accent: '#4cc9f0',
    accentTwo: '#7c3aed',
    background: '#060d17',
    surface: '#0e1d2a',
    text: '#ecf6ff',
    border: '#20344a',
  },
  red: {
    accent: '#f43f5e',
    accentTwo: '#fb7185',
    background: '#140b0f',
    surface: '#1d1117',
    text: '#fff1f2',
    border: '#4a2733',
  },
  green: {
    accent: '#34d399',
    accentTwo: '#a7f3d0',
    background: '#071312',
    surface: '#0d1b1b',
    text: '#ecfdf5',
    border: '#1d3b37',
  },
  rose: {
    accent: '#f472b6',
    accentTwo: '#fb7185',
    background: '#160d15',
    surface: '#1d121b',
    text: '#fff1f7',
    border: '#422a3a',
  },
  gold: {
    accent: '#fbbf24',
    accentTwo: '#f59e0b',
    background: '#120d09',
    surface: '#1d170f',
    text: '#fff8e8',
    border: '#3d2f1b',
  },
  mono: {
    accent: '#e5e7eb',
    accentTwo: '#a1a1aa',
    background: '#0a0a0a',
    surface: '#171717',
    text: '#f5f5f5',
    border: '#2a2a2a',
  },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 2200);
}

function setStatusVisual(type) {
  const online = Number(type) === 1 || Number(type) === 2 || Number(type) === 3;
  const indicator = $('#presenceDot');
  const badge = $('#presenceBadge');
  if (indicator) indicator.classList.toggle('online', online);
  if (badge) badge.classList.toggle('offline', !online);
}

function setApiError(message) {
  const node = $('#apiError');
  if (!node) return;
  node.textContent = message || 'Não foi possível carregar os dados do Roblox.';
  node.classList.remove('hidden');
}

function clearApiError() {
  const node = $('#apiError');
  if (!node) return;
  node.textContent = '';
  node.classList.add('hidden');
}

function dataToText(value, fallback = '—') {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
}

function renderGame(game) {
  const nameNode = $('#gameName');
  const creatorNode = $('#gameCreator');
  const playersNode = $('#gamePlayers');
  const visitsNode = $('#gameVisits');
  const imageNode = $('#gameImage');
  const gameLink = $('#gameLink');
  const meta = $('#gameMeta');

  if (!game) {
    if (nameNode) nameNode.textContent = 'Nenhum jogo em andamento';
    if (creatorNode) creatorNode.textContent = 'Aguardando dados do Roblox…';
    if (playersNode) playersNode.textContent = '—';
    if (visitsNode) visitsNode.textContent = '—';
    if (imageNode) imageNode.src = '';
    if (gameLink) gameLink.href = '#';
    if (meta) meta.style.opacity = '0.8';
    return;
  }

  if (nameNode) nameNode.textContent = game.name || 'Jogo do Roblox';
  if (creatorNode) creatorNode.textContent = game.creatorName ? `Criador: ${game.creatorName}` : 'Criador indisponível';
  if (playersNode) playersNode.textContent = Number.isFinite(Number(game.playing)) ? `${Number(game.playing).toLocaleString('pt-BR')} jogadores` : 'Jogadores indisponíveis';
  if (visitsNode) visitsNode.textContent = Number.isFinite(Number(game.visits)) ? `${Number(game.visits).toLocaleString('pt-BR')} visitas` : 'Visitas indisponíveis';
  if (imageNode) imageNode.src = game.image || '';
  if (gameLink) gameLink.href = game.url || '#';
  if (meta) meta.style.opacity = '1';
}

function renderGroups(groups) {
  const list = $('#groupsList');
  const count = $('#groupCount');
  if (count) count.textContent = String(groups.length || 0);

  if (!list) return;

  if (!groups.length) {
    list.innerHTML = '<article class="community-card"><p>Não foi possível localizar comunidades públicas com cargo de dono no momento.</p></article>';
    return;
  }

  list.innerHTML = groups
    .filter((group) => group && typeof group === 'object')
    .map((group) => {
      const name = dataToText(group.name, 'Grupo do Roblox');
      const description = dataToText(group.description, 'Comunidade pública do Roblox.');
      const role = dataToText(group.role, 'Dono');
      const memberCount = Number.isFinite(Number(group.memberCount)) ? Number(group.memberCount) : null;
      const icon = group.icon || 'https://tr.rbxcdn.com/';
      const link = group.url || 'https://www.roblox.com/communities';

      return `
        <article class="community-card reveal">
          <div class="community-card-header">
            <img class="community-icon" src="${icon}" alt="Ícone do grupo ${name}" />
            <div>
              <h3>${name}</h3>
              <div class="community-role">Cargo: ${role}</div>
            </div>
          </div>
          <div class="community-meta">${memberCount ? `${memberCount.toLocaleString('pt-BR')} membros` : 'Membros indisponíveis'}</div>
          <p>${description}</p>
          <a href="${link}" target="_blank" rel="noopener noreferrer">Abrir grupo</a>
        </article>
      `;
    }).join('');
}

function renderProfile(profile) {
  if (!profile || typeof profile !== 'object') return;

  const displayName = profile.displayName || profile.username || 'Noelzin';
  const username = profile.username || 'PCgamerbom';
  const avatar = profile.avatar || 'https://tr.rbxcdn.com/';
  const status = profile.status || 'Offline';
  const presenceType = Number(profile.presenceType || 0);
  const created = profile.created || null;

  const displayNodes = $$('[data-display-name], #displayName, #displayNameLarge');
  displayNodes.forEach((node) => {
    if (node) node.textContent = displayName;
  });

  const usernameNodes = $$('[data-username], #username, #robloxUser');
  usernameNodes.forEach((node) => {
    if (node) node.textContent = `@${username}`;
  });

  $$('[data-avatar], #profileAvatar, #profileAvatarLarge').forEach((node) => {
    if (node) node.src = avatar;
  });

  const statusNodes = $$('[data-status], #presenceStatus, #statusTitle');
  statusNodes.forEach((node) => {
    if (node) node.textContent = status;
  });

  const badge = $('#presenceBadge');
  if (badge) {
    badge.textContent = status;
    badge.classList.toggle('offline', status === 'Offline');
  }

  const presenceValue = $('#presenceValue');
  if (presenceValue) presenceValue.textContent = status;

  setStatusVisual(presenceType);

  const linkNode = $('#profileLink');
  if (linkNode) linkNode.href = profile.profileUrl || 'https://www.roblox.com/users/2281180949/profile';

  const createdNode = $('#profileCreated');
  if (createdNode) {
    if (created) {
      const date = new Date(created);
      const label = Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      createdNode.textContent = `Conta criada em ${label}`;
    } else {
      createdNode.textContent = 'Conta criada em —';
    }
  }

  const lastUpdated = $('#lastUpdated');
  if (lastUpdated) {
    lastUpdated.textContent = profile.updatedAt ? new Date(profile.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  }

  renderGame(profile.game || null);
  renderGroups(Array.isArray(profile.groups) ? profile.groups : []);
}

async function loadProfile() {
  const btn = $('#refresh');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '↻ Atualizando…';
  }

  clearApiError();

  try {
    const response = await fetch('/api/profile', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const text = await response.text();

    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const hint = text && text.length < 500 && !text.includes('<html') ? text : `Erro HTTP ${response.status}`;
      throw new Error(hint || 'Não foi possível carregar os dados do Roblox.');
    }

    if (!contentType.includes('application/json') && text && text.trim().startsWith('<')) {
      throw new Error('A rota /api/profile retornou HTML em vez de JSON.');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Resposta da API inválida.');
    }

    renderProfile(data);
    clearApiError();
  } catch (error) {
    console.error('loadProfile:', error);
    setApiError(error?.message || 'Não foi possível carregar os dados do Roblox.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '↻ Atualizar dados';
    }
  }
}

function applyTheme(theme = {}) {
  const root = document.documentElement;
  root.style.setProperty('--accent', theme.accent || '#8b5cf6');
  root.style.setProperty('--accent-2', theme.accentTwo || '#7dd3fc');
  root.style.setProperty('--background', theme.background || '#0a0c12');
  root.style.setProperty('--surface', theme.surface || '#121a2b');
  root.style.setProperty('--text', theme.text || '#f8fafc');
  root.style.setProperty('--border', theme.border || '#2b3648');

  const accentInput = $('#accentInput');
  const accentTwoInput = $('#accentTwoInput');
  const backgroundInput = $('#backgroundInput');
  const surfaceInput = $('#surfaceInput');
  const textInput = $('#textInput');
  const borderInput = $('#borderInput');

  if (accentInput) accentInput.value = theme.accent || '#8b5cf6';
  if (accentTwoInput) accentTwoInput.value = theme.accentTwo || '#7dd3fc';
  if (backgroundInput) backgroundInput.value = theme.background || '#0a0c12';
  if (surfaceInput) surfaceInput.value = theme.surface || '#121a2b';
  if (textInput) textInput.value = theme.text || '#f8fafc';
  if (borderInput) borderInput.value = theme.border || '#2b3648';

  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (!saved) {
    applyTheme(themePresets.violet);
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    applyTheme({ ...themePresets.violet, ...parsed });
  } catch {
    applyTheme(themePresets.violet);
  }
}

function initThemePanel() {
  const panel = $('#themePanel');
  const toggle = $('#themeToggle');
  const closeButton = $('#closeThemePanel');
  const applyButton = $('#applyThemeButton');
  const resetButton = $('#resetTheme');

  if (!panel || !toggle) return;

  const openPanel = () => {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
  };

  const closePanel = () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.contains('open');
    if (isOpen) closePanel(); else openPanel();
  });

  if (closeButton) closeButton.addEventListener('click', closePanel);

  $$('.preset-button').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.preset-button').forEach((btn) => btn.classList.toggle('active', btn === button));
      const key = button.dataset.theme;
      if (key && themePresets[key]) {
        applyTheme(themePresets[key]);
      }
    });
  });

  const readCustomTheme = () => ({
    accent: $('#accentInput')?.value || '#8b5cf6',
    accentTwo: $('#accentTwoInput')?.value || '#7dd3fc',
    background: $('#backgroundInput')?.value || '#0a0c12',
    surface: $('#surfaceInput')?.value || '#121a2b',
    text: $('#textInput')?.value || '#f8fafc',
    border: $('#borderInput')?.value || '#2b3648',
  });

  if (applyButton) {
    applyButton.addEventListener('click', () => {
      applyTheme(readCustomTheme());
      showToast('Tema aplicado.');
      closePanel();
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      applyTheme(themePresets.violet);
      $$('.preset-button').forEach((button) => button.classList.toggle('active', button.dataset.theme === 'violet'));
      showToast('Tema padrão restaurado.');
      closePanel();
    });
  }
}

function initNav() {
  const toggle = $('#navToggle');
  const nav = $('#siteNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal').forEach((node) => node.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
}

function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursorOuter = document.querySelector('.cursor--outer');
  const cursorInner = document.querySelector('.cursor--inner');
  if (!cursorOuter || !cursorInner) return;

  const move = (event) => {
    cursorOuter.style.left = `${event.clientX}px`;
    cursorOuter.style.top = `${event.clientY}px`;
    cursorInner.style.left = `${event.clientX}px`;
    cursorInner.style.top = `${event.clientY}px`;
  };

  window.addEventListener('pointermove', move);

  const hoverTargets = 'a, button, input, .community-card, .link-card, .profile-card, .game-card';
  document.querySelectorAll(hoverTargets).forEach((node) => {
    node.addEventListener('mouseenter', () => {
      cursorOuter.classList.add('hover');
      cursorInner.classList.add('active');
    });
    node.addEventListener('mouseleave', () => {
      cursorOuter.classList.remove('hover');
      cursorInner.classList.remove('active');
    });
  });

  document.addEventListener('pointerdown', () => cursorOuter.classList.add('active'));
  document.addEventListener('pointerup', () => cursorOuter.classList.remove('active'));
}

function initYear() {
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
}

function initCopyDiscord() {
  const button = $('#copyDiscord');
  if (!button) return;

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('noel6956');
      showToast('Usuário do Discord copiado: noel6956');
    } catch {
      showToast('Não foi possível copiar o Discord.');
    }
  });
}

function init() {
  loadTheme();
  initThemePanel();
  initNav();
  initReveal();
  initCursor();
  initYear();
  initCopyDiscord();

  const refreshButton = $('#refresh');
  if (refreshButton) refreshButton.addEventListener('click', loadProfile);
  if (refreshButton) loadProfile();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('storage', (event) => {
  if (event.key === THEME_STORAGE_KEY && event.newValue) {
    try {
      applyTheme(JSON.parse(event.newValue));
    } catch {
      applyTheme(themePresets.violet);
    }
  }
});

window.addEventListener('load', () => {
  document.body.classList.add('ready');
});
