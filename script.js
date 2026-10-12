// Blockslab - script do botão de download.
// Para usar outro repositório, troque OWNER e REPO abaixo.
(function () {
  var OWNER = "PCgamerbom";
  var REPO = "Blockslab";

  var botao = document.getElementById("download");
  var rotulo = document.getElementById("download-label");
  var transp = document.getElementById("transp");
  var versao = document.getElementById("versao");
  if (!botao) return;

  // Por padrão o botão baixa o código-fonte (.zip). Se existir uma release com .exe,
  // o botão passa a baixar o executável. Se a consulta falhar, nada muda.
  fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/releases/latest")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (release) {
      if (!release) return;
      var exe = (release.assets || []).find(function (a) { return /\.exe$/i.test(a.name); });
      if (!exe) return;

      botao.href = exe.browser_download_url;
      if (rotulo) rotulo.textContent = "Baixar para Windows (.exe)";
      if (transp) {
        var texto = transp.querySelector("span");
        if (texto) texto.textContent = "Versão " + release.tag_name + " · requer o .NET 6 Desktop Runtime.";
      }
      if (versao && release.tag_name) versao.textContent = "B / " + release.tag_name.replace(/^v/i, "");
    })
    .catch(function () { /* mantém o padrão */ });
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

  function pedir(url, opcoes) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 8000);
    opcoes = opcoes || {};
    opcoes.signal = ctrl.signal;
    return fetch(url, opcoes).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
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
    el.dot.className = "sdot " + tipo;
    el.status.textContent = texto;
    el.last.textContent = ultimo || "";
  }

  function carregarPerfil() {
    return pedir(API.users + "/v1/users/" + USER_ID).then(function (u) {
      if (u && u.displayName) el.display.textContent = u.displayName;
      if (u && u.name) el.user.textContent = "@" + u.name;
    }).catch(function () { /* mantém os nomes padrão do HTML */ });
  }

  function carregarAvatar() {
    var url = API.thumbs + "/v1/users/avatar?userIds=" + USER_ID + "&size=420x420&format=Png&isCircular=false";
    return pedir(url).then(function (r) {
      var item = r && r.data && r.data[0];
      if (item && item.state === "Completed" && item.imageUrl) el.avatar.src = item.imageUrl;
    }).catch(function () { /* mantém a imagem padrão */ });
  }

  function carregarStatus() {
    return pedir(API.presence + "/v1/presence/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [USER_ID] })
    }).then(function (r) {
      var p = r && r.userPresences && r.userPresences[0];
      if (!p) throw new Error("sem dados");
      var ultimo = p.lastOnline ? "Visto pela última vez " + tempoRelativo(p.lastOnline) : "";
      switch (p.userPresenceType) {
        case 1: mostrarStatus("on", "Online agora", ""); break;
        case 2: mostrarStatus("game", "Jogando agora", ""); break;
        case 3: mostrarStatus("studio", "Criando no Roblox Studio", ""); break;
        default: mostrarStatus("off", "Offline", ultimo);
      }
    }).catch(function () {
      mostrarStatus("off", "Status indisponível no momento", "Abra o perfil no Roblox para ver.");
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
