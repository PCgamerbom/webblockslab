const $ = (id) => document.getElementById(id);

const statusClass = (type) => (Number(type) === 1 || Number(type) === 2 || Number(type) === 3 ? 'online' : 'offline');

function setStatusVisual(type) {
  const online = statusClass(type) === 'online';
  ['heroDot', 'presenceDot', 'avatarStatus'].forEach((id) => {
    const el = $(id);
    if (el) el.style.background = online ? 'var(--green)' : '#888';
  });
}

function escapeHTML(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function formatDate(v) {
  if (!v) return 'Não disponível';
  const d = new Date(v);
  return Number.isNaN(+d) ? 'Não disponível' : d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

function setTextBySelectors(selectors, value) {
  let changed = false;
  const nodes = document.querySelectorAll(selectors);
  nodes.forEach((node) => {
    if (node) {
      node.textContent = value;
      changed = true;
    }
  });
  return changed;
}

function setImageBySelectors(selectors, value) {
  let changed = false;
  const nodes = document.querySelectorAll(selectors);
  nodes.forEach((node) => {
    if (node) {
      node.src = value || '';
      changed = true;
    }
  });
  return changed;
}

function clearApiError() {
  const apiError = $('apiError');
  if (apiError) {
    apiError.textContent = '';
    apiError.classList.add('hidden');
  }
}

function setApiError(message) {
  const apiError = $('apiError');
  if (apiError) {
    apiError.textContent = message || 'Não foi possível carregar os dados do Roblox.';
    apiError.classList.remove('hidden');
  }
}

async function loadProfile() {
  const btn = $('refresh');
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

    if (!contentType.includes('application/json') && !contentType.includes('+json') && text && text.trim().startsWith('<')) {
      throw new Error('A rota /api/profile retornou HTML em vez de JSON.');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Resposta da API inválida.');
    }

    const displayName = data.displayName || data.username || 'Noelzin';
    const username = data.username || 'PCgamerbom';
    const avatar = data.avatar || '';
    const statusText = data.status || 'Offline';
    const presenceType = Number(data.presenceType || 0);
    const game = data.game && typeof data.game === 'object' ? data.game : null;
    const groups = Array.isArray(data.groups) ? data.groups : [];
    const created = data.created || null;

    setStatusVisual(presenceType);

    const nameTargets = '#username, #displayName, #robloxUsername, .profile-name, .username, [data-profile-name], [data-username]';
    setTextBySelectors(nameTargets, displayName);

    const statusTargets = '#presenceStatus, #statusText, .presence-text, [data-presence-status]';
    setTextBySelectors(statusTargets, statusText);

    if (avatar) {
      setImageBySelectors('#profileAvatar, #avatar, .profile-avatar, [data-avatar]', avatar);
    }

    if (game && game.name) {
      setTextBySelectors('#gameName, #currentGame, .game-name, [data-game-name]', game.name);
    }

    if (game && game.image) {
      setImageBySelectors('#gameImage, .game-image, [data-game-image]', game.image);
    }

    if (groups.length > 0) {
      setTextBySelectors('#groupCount, #communityCount, .group-count, [data-group-count]', String(groups.length));
    } else {
      setTextBySelectors('#groupCount, #communityCount, .group-count, [data-group-count]', '0');
    }

    if (created) {
      const dateLabel = new Date(created).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      setTextBySelectors('#createdAt, .created-at, [data-created-at]', dateLabel);
    }

    const profileLink = data.profileUrl || 'https://www.roblox.com/users/2281180949/profile';
    const profileLinkEls = document.querySelectorAll('#profileLink, .profile-link, [data-profile-link]');
    profileLinkEls.forEach((node) => {
      if (node) node.href = profileLink;
    });

    const usernameEls = document.querySelectorAll('#username, #robloxUsername, [data-username]');
    usernameEls.forEach((node) => {
      if (node && username && !node.dataset.originalUsername) {
        node.dataset.originalUsername = username;
      }
    });

    if (typeof window !== 'undefined' && typeof window.toast === 'function') {
      window.toast('Dados do Roblox atualizados.');
    }

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

$('refresh')?.addEventListener('click', loadProfile);

$('contrastToggle')?.addEventListener('click', () => {
  const on = document.body.classList.toggle('high-contrast');
  $('contrastToggle')?.setAttribute('aria-pressed', String(on));
});

$('copyDiscord')?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('noel6956');
    if ($('copyHint')) $('copyHint').textContent = 'Copiado!';
    if (typeof window !== 'undefined' && typeof window.toast === 'function') {
      window.toast('Usuário do Discord copiado: noel6956');
    }
  } catch {
    if ($('copyHint')) $('copyHint').textContent = 'Não foi possível copiar';
  }
});

if ($('year')) $('year').textContent = new Date().getFullYear();
if ($('refresh')) loadProfile();
