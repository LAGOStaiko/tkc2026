import http from "node:http";

const port = 8788;

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");

  if (req.method === "GET" && url.pathname === "/api/site") {
    return sendJson(res, 200, { ok: true, data: { applyOpen: true } });
  }

  if (req.method === "GET" && url.pathname === "/api/song-pools") {
    return sendJson(res, 200, {
      ok: true,
      data: {
        arcadeSwiss: [
          { title: "LOCAL SONG 1", difficulty: "oni", level: 9 },
          { title: "LOCAL SONG 2", difficulty: "ura", level: 10 },
          { title: "LOCAL SONG 3", difficulty: "oni", level: 8 },
          { title: "LOCAL SONG 4", difficulty: "ura", level: 9 },
        ],
      },
    });
  }

  if (req.method === "POST" && url.pathname === "/api/register") {
    const body = await readBody(req);
    if (!body || typeof body !== "object") {
      return sendJson(res, 400, { ok: false, error: "Invalid JSON body" });
    }

    const receiptId = `LOCAL-${Date.now()}`;
    return sendJson(res, 200, { ok: true, data: { receiptId } });
  }

  return sendJson(res, 404, { ok: false, error: "Not found" });
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Mock API listening on http://127.0.0.1:${port}\n`);
});
