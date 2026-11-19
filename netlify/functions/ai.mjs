// RutaMaterial · función de IA para la versión web (Netlify Functions)
// La clave de la API vive solo en Netlify (variable ANTHROPIC_API_KEY), nunca en el navegador ni en GitHub.

const MAX_PROMPT = 80000;      // caracteres por consulta
const MAX_TOKENS = 3000;       // largo máximo de la respuesta
const PER_MINUTE = 8;          // consultas por minuto por visitante (límite simple)
const hits = new Map();

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  // Solo se acepta desde el propio sitio
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return json({ error: "Origen no permitido" }, 403);

  let key = Netlify.env.get("ANTHROPIC_API_KEY"); let gkey = Netlify.env.get("GEMINI_API_KEY"); if (key && key.trim().startsWith("AIza")) { gkey = gkey || key; key = null; } if (gkey) key = null;
  if (!key && !gkey) return json({ error: "Falta configurar la clave de IA en Netlify" }, 500);

  // Límite simple por visitante
  const ip = context.ip || "anon";
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (list.length >= PER_MINUTE) return json({ error: "Demasiadas consultas seguidas. Espera un minuto." }, 429);
  list.push(now);
  hits.set(ip, list);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Solicitud inválida" }, 400); }
  const prompt = String((body && body.prompt) || "");
  if (!prompt) return json({ error: "Falta el texto de la consulta" }, 400);
  if (prompt.length > MAX_PROMPT) return json({ error: "La consulta es demasiado larga" }, 413);

  if (!key) {
    try {
      let r, j; for (const model of [Netlify.env.get("GEMINI_MODEL"), "gemini-3.8-flash", "gemini-3.8-flash-lite", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.0-flash"].filter(Boolean)) {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": gkey },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8000 } }),
      });
      j = await r.json(); if (r.ok || ![404, 429, 500, 503].includes(r.status)) break; }
      if (!r.ok) return json({ error: (j && j.error && j.error.message) || "La IA no respondió" }, r.status === 429 ? 429 : 502);
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      return json({ text: parts.map((p) => p.text || "").join("") });
    } catch (e) {
      return json({ error: "No se pudo conectar con la IA" }, 502);
    }
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: Netlify.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5",
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const j = await r.json();
    if (!r.ok) return json({ error: (j && j.error && j.error.message) || "La IA no respondió" }, r.status === 429 ? 429 : 502);
    const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    return json({ text });
  } catch (e) {
    return json({ error: "No se pudo conectar con la IA" }, 502);
  }
};

export const config = { path: "/api/ai" };
