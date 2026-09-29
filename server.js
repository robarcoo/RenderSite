// server.js
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_EVENTS = 500;
const events = [];

// Панель и API доступны отдельно от URL приёма постбэков
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Принимает GET-постбэки с любым количеством параметров в URL
app.get("/postback", (req, res) => {
  const event = {
    time: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    query: req.query,
  };

  events.unshift(event);
  if (events.length > MAX_EVENTS) events.pop();

  console.log(`[${event.time}] ${JSON.stringify(event.query)}`);
  res.status(200).send("OK");
});

// Принимает POST-постбэки: параметры из URL и тела запроса
app.post("/postback", (req, res) => {
  const event = {
    time: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    query: req.query,
    body: req.body,
  };

  events.unshift(event);
  if (events.length > MAX_EVENTS) events.pop();

  console.log(`[${event.time}] ${JSON.stringify({
    query: event.query,
    body: event.body,
  })}`);
  res.status(200).send("OK");
});

// Данные для панели
app.get("/events", (_req, res) => {
  res.json(events);
});

// Визуальная панель
app.get("/dashboard", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Лог постбэков</title>
  <style>
    body {
      margin: 24px;
      font: 15px system-ui, sans-serif;
      color: #17202a;
      background: #f3f5f7;
    }
    h1 { font-size: 24px; }
    #status { color: #52606d; margin-bottom: 16px; }
    .event {
      margin: 12px 0;
      padding: 16px;
      background: white;
      border: 1px solid #dce2e8;
      border-radius: 8px;
    }
    .meta { color: #52606d; margin-bottom: 8px; }
    pre {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font: 13px ui-monospace, monospace;
    }
  </style>
</head>
<body>
  <h1>Полученные постбэки</h1>
  <div id="status">Загрузка…</div>
  <div id="events"></div>

  <script>
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);
    }

    async function refresh() {
      try {
        const response = await fetch("/events");
        const items = await response.json();

        document.getElementById("status").textContent =
          "Показаны последние " + items.length + " запросов. Обновление каждые 2 секунды.";

        document.getElementById("events").innerHTML = items.length
          ? items.map(event => {
              const details = {
                query: event.query,
                ...(event.body !== undefined ? { body: event.body } : {})
              };
              return \`
                <section class="event">
                  <div class="meta">\${escapeHtml(event.time)} ·
                    \${escapeHtml(event.method)} \${escapeHtml(event.path)} ·
                    IP: \${escapeHtml(event.ip)}
                  </div>
                  <pre>\${escapeHtml(JSON.stringify(details, null, 2))}</pre>
                </section>
              \`;
            }).join("")
          : "<p>Запросов пока нет.</p>";
      } catch {
        document.getElementById("status").textContent =
          "Не удалось загрузить события.";
      }
    }

    refresh();
    setInterval(refresh, 2000);
  </script>
</body>
</html>`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Сервер запущен на порту " + PORT);
});
