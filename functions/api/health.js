export async function onRequest(context) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  if (context.request.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Método não permitido." }),
      { status: 405, headers: { ...headers, Allow: "GET" } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, service: "noel-roblox-hub" }),
    { status: 200, headers }
  );
}
