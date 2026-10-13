var USER_ID = 2281180949;
var API_URL = "https://presence.roblox.com/v1/presence/users";

function respostaJson(dados, status, cabecalhos) {
  var headers = new Headers(cabecalhos || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(dados), { status: status, headers: headers });
}

export async function onRequestPost({ request }) {
  var origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return respostaJson({ error: "Origem não permitida." }, 403);
  }

  var payload;
  try {
    payload = await request.json();
  } catch (_) {
    return respostaJson({ error: "Corpo JSON inválido." }, 400);
  }

  if (!payload || !Array.isArray(payload.userIds) ||
      payload.userIds.length !== 1 || Number(payload.userIds[0]) !== USER_ID) {
    return respostaJson({ error: "Perfil inválido." }, 400);
  }

  var upstream;
  try {
    upstream = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [USER_ID] })
    });
  } catch (_) {
    return respostaJson({ error: "Não foi possível consultar o Roblox." }, 502);
  }

  if (!upstream.ok) {
    var headers = {};
    var retryAfter = upstream.headers.get("Retry-After");
    if (retryAfter) headers["Retry-After"] = retryAfter;
    return respostaJson({ error: "A API do Roblox retornou HTTP " + upstream.status + "." },
      upstream.status === 429 ? 429 : 502, headers);
  }

  var dados;
  try {
    dados = await upstream.json();
  } catch (_) {
    return respostaJson({ error: "A API do Roblox retornou uma resposta inválida." }, 502);
  }

  if (!dados || !Array.isArray(dados.userPresences)) {
    return respostaJson({ error: "Resposta de presença inválida." }, 502);
  }

  var presenca = dados.userPresences.find(function (item) {
    return item && Number(item.userId) === USER_ID;
  });
  if (!presenca) return respostaJson({ error: "Presença do perfil não encontrada." }, 502);

  return respostaJson({ userPresences: [presenca] }, 200);
}
