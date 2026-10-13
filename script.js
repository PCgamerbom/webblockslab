// Blockslab - script do botão de download.
// Para usar outro repositório, troque OWNER e REPO abaixo.
(function () {
  var OWNER = "PCgamerbom";
  var REPO = "Blockslab";
  var TIMEOUT = 8000;

  var botoes = [document.getElementById("download"), document.getElementById("download-release")].filter(Boolean);
  var rotulos = [document.getElementById("download-label"), document.querySelector("#download-release span")].filter(Boolean);
  var detalhes = document.getElementById("download-details");
  var versao = document.getElementById("versao");
  if (!botoes.length) return;

  function pedirReleases() {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
    return fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/releases?per_page=10", {
      headers: { Accept: "application/vnd.github+json" },
      signal: ctrl.signal
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("GitHub API HTTP " + r.status);
      return r.json();
    }, function (e) {
      clearTimeout(timer);
      throw e;
    });
  }

  // Mantém os links diretos do HTML caso a API esteja indisponível ou limitada.
  pedirReleases()
    .then(function (releases) {
      if (!Array.isArray(releases)) throw new Error("Resposta inválida da API de releases");
      var release = releases.find(function (item) {
        return item && !item.draft && Array.isArray(item.assets) && item.assets.some(function (asset) {
          return asset && typeof asset.name === "string" &&
            (/\.exe$/i.test(asset.name) || /^Blockslab-exe\.zip$/i.test(asset.name));
        });
      });
      if (!release) return;

      var assets = release.assets;
      var asset = assets.find(function (item) {
        return item && typeof item.name === "string" && /\.exe$/i.test(item.name);
      }) || assets.find(function (item) {
        return item && typeof item.name === "string" && /^Blockslab-exe\.zip$/i.test(item.name);
      });
      if (!asset || typeof asset.browser_download_url !== "string") return;
      var downloadUrl;
      try {
        downloadUrl = new URL(asset.browser_download_url);
      } catch (_) {
        return;
      }
      if (downloadUrl.protocol !== "https:" || downloadUrl.hostname !== "github.com" ||
          downloadUrl.pathname.indexOf("/" + OWNER + "/" + REPO + "/releases/download/") !== 0) return;

      botoes.forEach(function (botao) { botao.href = downloadUrl.href; });
      var formato = /\.exe$/i.test(asset.name) ? ".exe" : ".zip";
      rotulos.forEach(function (rotulo) { rotulo.textContent = "Baixar para Windows (" + formato + ")"; });
      if (detalhes && typeof release.tag_name === "string") {
        detalhes.textContent = "Versão " + release.tag_name + " · requer o .NET 6 Desktop Runtime.";
      }
      if (versao && typeof release.tag_name === "string") {
        versao.textContent = "B / " + release.tag_name.replace(/^v/i, "");
      }
    })
    .catch(function () { /* os links diretos publicados no HTML continuam disponíveis */ });
})();

// ---------- Aparência personalizável ----------
(function () {
  var CHAVE = "blockslab-appearance-v1";
  var padrao = { mode: "system", accent: "violet", font: "system", textSize: "normal" };
  var permitidos = {
    mode: ["system", "light", "dark"],
    accent: ["violet", "blue", "green", "pink", "orange"],
    font: ["system", "rounded", "serif", "mono"],
    textSize: ["normal", "large", "larger"]
  };
  var raiz = document.documentElement;
  var painel = document.getElementById("appearance-settings");
  var controles = {
    mode: document.getElementById("color-mode"),
    font: document.getElementById("font-family"),
    textSize: document.getElementById("text-size")
  };
  var swatches = Array.prototype.slice.call(document.querySelectorAll("[data-accent-choice]"));
  var feedback = document.getElementById("appearance-feedback");
  var reset = document.getElementById("appearance-reset");
  if (!painel || !controles.mode || !controles.font || !controles.textSize) return;

  var preferencias = {
    mode: raiz.dataset.mode,
    accent: raiz.dataset.accent,
    font: raiz.dataset.font,
    textSize: raiz.dataset.textSize
  };
  Object.keys(permitidos).forEach(function (chave) {
    if (permitidos[chave].indexOf(preferencias[chave]) === -1) preferencias[chave] = padrao[chave];
  });
  controles.mode.value = preferencias.mode;
  controles.font.value = preferencias.font;
  controles.textSize.value = preferencias.textSize;

  function aplicarTema() {
    var escuro = preferencias.mode === "dark" ||
      (preferencias.mode === "system" && window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    raiz.dataset.mode = preferencias.mode;
    raiz.dataset.theme = escuro ? "dark" : "light";
    raiz.dataset.accent = preferencias.accent;
    raiz.dataset.font = preferencias.font;
    raiz.dataset.textSize = preferencias.textSize;
    swatches.forEach(function (botao) {
      botao.setAttribute("aria-pressed", String(botao.dataset.accentChoice === preferencias.accent));
    });
    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = escuro ? "#11121b" : "#f8f9ff";
  }

  function salvar(mensagem) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(preferencias));
      if (feedback) feedback.textContent = mensagem;
    } catch (_) {
      if (feedback) feedback.textContent = mensagem + " A preferência vale apenas nesta sessão.";
    }
  }

  function alterar(chave, valor, mensagem) {
    if (permitidos[chave].indexOf(valor) === -1) return;
    preferencias[chave] = valor;
    aplicarTema();
    salvar(mensagem);
  }

  controles.mode.addEventListener("change", function () {
    alterar("mode", controles.mode.value, "Tema atualizado.");
  });
  controles.font.addEventListener("change", function () {
    alterar("font", controles.font.value, "Fonte atualizada.");
  });
  controles.textSize.addEventListener("change", function () {
    alterar("textSize", controles.textSize.value, "Tamanho do texto atualizado.");
  });
  swatches.forEach(function (botao) {
    botao.addEventListener("click", function () {
      alterar("accent", botao.dataset.accentChoice, "Cor atualizada.");
    });
  });
  if (reset) {
    reset.addEventListener("click", function () {
      preferencias = {
        mode: padrao.mode,
        accent: padrao.accent,
        font: padrao.font,
        textSize: padrao.textSize
      };
      controles.mode.value = preferencias.mode;
      controles.font.value = preferencias.font;
      controles.textSize.value = preferencias.textSize;
      aplicarTema();
      salvar("Aparência restaurada.");
    });
  }
  painel.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
      painel.open = false;
      painel.querySelector("summary").focus();
    }
  });
  if (window.matchMedia) {
    var esquemaSistema = window.matchMedia("(prefers-color-scheme: dark)");
    var atualizarSistema = function () {
      if (preferencias.mode === "system") aplicarTema();
    };
    if (esquemaSistema.addEventListener) esquemaSistema.addEventListener("change", atualizarSistema);
    else if (esquemaSistema.addListener) esquemaSistema.addListener(atualizarSistema);
  }
  aplicarTema();
})();

// ---------- Criador: perfil do Roblox em tempo real ----------
// Troque USER_ID para outro perfil. Os dados vêm do RoProxy (espelho público das APIs do Roblox),
// porque as APIs oficiais do Roblox bloqueiam chamadas diretas de sites (CORS).
(function () {
  var USER_ID = 2281180949;
  var INTERVALO = 30000;          // status: a cada 30 s
  var INTERVALO_AVATAR = 300000;  // avatar: a cada 5 min
  var API = {
    users: "https://users.roproxy.com",
    thumbs: "https://thumbnails.roproxy.com",
    presence: "https://presence.roproxy.com"
  };

  var el = {
    avatar: document.getElementById("cr-avatar"),
    display: document.getElementById("cr-display"),
    user: document.getElementById("cr-user"),
    dot: document.getElementById("cr-dot"),
    status: document.getElementById("cr-status-text"),
    last: document.getElementById("cr-last")
  };
  if (!el.status) return;
  var emAndamento = false;
  var avatarEmAndamento = false;
  var avatarOriginal = el.avatar && el.avatar.getAttribute("src");

  function restaurarAvatar() {
    if (!el.avatar || !avatarOriginal) return;
    el.avatar.onerror = null;
    el.avatar.src = avatarOriginal;
  }

  if (el.avatar) el.avatar.onerror = restaurarAvatar;

  function pedir(url, opcoes) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 8000);
    opcoes = opcoes || {};
    opcoes.signal = ctrl.signal;
    return fetch(url, opcoes).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) {
        var erro = new Error("HTTP " + r.status);
        erro.status = r.status;
        var retryAfter = r.headers && r.headers.get("Retry-After");
        if (retryAfter && !isNaN(Number(retryAfter))) {
          erro.retryAfterMs = Math.min(Number(retryAfter) * 1000, 60000);
        }
        throw erro;
      }
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }

  function tempoRelativo(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return "";
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return "agora há pouco";
    var m = Math.round(s / 60);
    if (m < 60) return "há " + m + (m === 1 ? " minuto" : " minutos");
    var h = Math.round(m / 60);
    if (h < 24) return "há " + h + (h === 1 ? " hora" : " horas");
    var d = Math.round(h / 24);
    return "há " + d + (d === 1 ? " dia" : " dias");
  }

  function mostrarStatus(tipo, texto, ultimo) {
    if (el.dot) el.dot.className = "sdot " + tipo;
    el.status.textContent = texto;
    if (el.status.parentNode) el.status.parentNode.dataset.presence = tipo;
    if (el.last) el.last.textContent = ultimo || "";
  }

  function carregarPerfil() {
    return pedir(API.users + "/v1/users/" + USER_ID).then(function (u) {
      if (u && u.displayName && el.display) el.display.textContent = u.displayName;
      if (u && u.name && el.user) el.user.textContent = "@" + u.name;
    }).catch(function () { /* mantém os nomes padrão do HTML */ });
  }

  function carregarAvatar() {
    if (!el.avatar) return Promise.resolve();
    if (avatarEmAndamento) return Promise.resolve();
    avatarEmAndamento = true;
    var url = API.thumbs + "/v1/users/avatar?userIds=" + USER_ID + "&size=420x420&format=Png&isCircular=false";
    return pedir(url).then(function (r) {
      var item = r && r.data && r.data[0];
      if (item && item.state === "Completed" && item.imageUrl) {
        el.avatar.onerror = restaurarAvatar;
        el.avatar.src = item.imageUrl;
      }
    }).catch(function () {
      /* mantém a imagem padrão */
    }).then(function () {
      avatarEmAndamento = false;
    });
  }

  function consultarStatus(tentativa) {
    return pedir(API.presence + "/v1/presence/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [USER_ID] })
    }).then(function (r) {
      var presencas = r && r.userPresences;
      var p = Array.isArray(presencas) && presencas.find(function (item) {
        return item && Number(item.userId) === USER_ID;
      });
      if (!p) throw new Error("sem dados para o perfil");
      if ([0, 1, 2, 3].indexOf(p.userPresenceType) === -1) throw new Error("status inválido");
      var ultimo = p.lastOnline ? "Visto pela última vez " + tempoRelativo(p.lastOnline) : "";
      switch (p.userPresenceType) {
        case 0: mostrarStatus("off", "Offline no Roblox", ultimo); break;
        case 1: mostrarStatus("on", "Online agora", ""); break;
        case 2: mostrarStatus("game", "Jogando agora", p.lastLocation || "Ativo no Roblox"); break;
        case 3: mostrarStatus("studio", "Criando no Roblox Studio", ""); break;
      }
    }).catch(function (erro) {
      if (!tentativa) {
        var espera = erro.retryAfterMs || (erro.status === 429 ? 10000 : 2000);
        return new Promise(function (resolve) { setTimeout(resolve, espera); })
          .then(function () { return consultarStatus(true); });
      }
      mostrarStatus("unknown", "Status indisponível no momento", "Abra o perfil no Roblox para ver.");
    });
  }

  function carregarStatus() {
    if (emAndamento) return;
    emAndamento = true;
    consultarStatus(false).then(function () {
      emAndamento = false;
    }, function () {
      emAndamento = false;
      mostrarStatus("unknown", "Status indisponível no momento", "Abra o perfil no Roblox para ver.");
    });
  }

  carregarPerfil();
  carregarAvatar();
  carregarStatus();

  var t1 = setInterval(carregarStatus, INTERVALO);
  var t2 = setInterval(carregarAvatar, INTERVALO_AVATAR);

  // Pausa as consultas quando a aba está em segundo plano e retoma ao voltar.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { clearInterval(t1); clearInterval(t2); return; }
    carregarStatus(); carregarAvatar();
    t1 = setInterval(carregarStatus, INTERVALO);
    t2 = setInterval(carregarAvatar, INTERVALO_AVATAR);
  });
})();
