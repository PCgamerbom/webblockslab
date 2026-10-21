const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const USER_ID = "2281180949";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8"
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": "Noelzin-Roblox-Hub/1.0",
      "Accept": "application/json",
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    throw new Error(`Serviço externo respondeu HTTP ${response.status}`);
  }
  return response.json();
}

async function getProfile() {
  const user = await fetchJson(`https://users.roblox.com/v1/users/${USER_ID}`);
  let presenceType = 0;
  let status = "Offline";
  let game = null;
  let groups = [];

  try {
    const presence = await fetchJson("https://presence.roblox.com/v1/presence/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [Number(USER_ID)] })
    });
    const p = presence.userPresences?.[0];
    if (p) {
      presenceType = Number(p.userPresenceType || 0);
      status = ({ 0: "Offline", 1: "Online", 2: "Em um jogo", 3: "No Roblox Studio" })[presenceType] || "Status desconhecido";
      if (presenceType === 2 && p.placeId) {
        try {
          const place = await fetchJson(`https://apis.roblox.com/universes/v1/places/${p.placeId}/universe`);
          if (place.universeId) {
            const details = await fetchJson(`https://games.roblox.com/v1/games?universeIds=${place.universeId}`);
            const g = details.data?.[0];
            if (g) {
              game = {
                name: g.name || "Jogo do Roblox",
                creatorName: g.creator?.name || "Desconhecido",
                creatorType: g.creator?.type || "",
                playing: Number.isFinite(g.playing) ? g.playing : null,
                visits: Number.isFinite(g.visits) ? g.visits : null,
                url: `https://www.roblox.com/games/${p.placeId}`,
                image: null
              };
              try {
                const thumbs = await fetchJson(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${place.universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`);
                game.image = thumbs.data?.[0]?.imageUrl || null;
              } catch {}
            }
          }
        } catch {}
      }
    }
  } catch {}

  try {
    const roleData = await fetchJson(`https://groups.roblox.com/v1/users/${USER_ID}/groups/roles`);
    groups = (roleData.data || [])
      .filter(item => item.role?.rank === 255 || /owner|dono/i.test(item.role?.name || ""))
      .map(item => ({
        name: item.group?.name || "Grupo do Roblox",
        description: item.group?.description || "",
        memberCount: Number.isFinite(item.group?.memberCount) ? item.group.memberCount : null,
        url: `https://www.roblox.com/communities/${item.group?.id || ""}`
      }));
  } catch {}

  let avatar = null;
  try {
    const thumb = await fetchJson(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${USER_ID}&size=420x420&format=Png&isCircular=false`);
    avatar = thumb.data?.[0]?.imageUrl || null;
  } catch {}

  return {
    id: USER_ID,
    username: user.name || "PCgamerbom",
    displayName: user.displayName || user.name || "Noelzin",
    profileUrl: `https://www.roblox.com/users/${USER_ID}/profile`,
    created: user.created || null,
    avatar,
    presenceType,
    status,
    game,
    groups,
    updatedAt: new Date().toISOString()
  };
}

function sendJson(res, status, value) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(value));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, service: "noel-roblox-hub" });
  }

  if (url.pathname === "/api/profile") {
    try {
      return sendJson(res, 200, await getProfile());
    } catch (error) {
      return sendJson(res, 502, {
        error: `Não foi possível consultar a API pública do Roblox. ${error.message}`
      });
    }
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end("Caminho inválido.");
  }
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== path.join(ROOT, "index.html")) {
    res.writeHead(403);
    return res.end("Acesso negado.");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end(error.code === "ENOENT" ? "Arquivo não encontrado. Confira o nome e a pasta do arquivo." : "Erro ao ler o arquivo.");
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Noel.dev disponível em http://localhost:${PORT}`);
});
