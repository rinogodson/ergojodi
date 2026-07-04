import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as chokidar from "chokidar";

const PORT = 3030;

// ---------------------------------------------------------
// 1. S-Expression Tokenizer and Parser for KiCad PCB Files
// ---------------------------------------------------------
function tokenize(content: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inString = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inString) {
      current += c;
      if (c === '"' && content[i - 1] !== "\\") {
        tokens.push(current);
        current = "";
        inString = false;
      }
    } else if (c === '"') {
      inString = true;
      current += c;
    } else if (c === "(" || c === ")") {
      if (current) {
        tokens.push(current);
        current = "";
      }
      tokens.push(c);
      // @ts-ignore-next-line
    } else if (/\s/.test(c)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += c;
    }
  }
  return tokens;
}

function parseAst(tokens: string[]): any {
  const root: any[] = [];
  const stack: any[] = [root];
  for (const t of tokens) {
    if (t === "(") {
      const node: any[] = [];
      stack[stack.length - 1].push(node);
      stack.push(node);
    } else if (t === ")") {
      stack.pop();
    } else {
      stack[stack.length - 1].push(t);
    }
  }
  return root[0];
}

function extractPcbData(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const tokens = tokenize(content);
  const ast = parseAst(tokens);

  const footprints: any[] = [];
  const pads: any[] = [];
  const segments: any[] = [];

  if (!ast || !Array.isArray(ast)) return { footprints, pads, segments };

  for (const node of ast) {
    if (!Array.isArray(node)) continue;
    const type = node[0];

    if (type === "footprint" || type === "module") {
      const fpName = typeof node[1] === "string" ? node[1] : "";
      let fpX = 0,
        fpY = 0,
        fpAngle = 0;
      const fpPads: any[] = [];

      for (const child of node) {
        if (Array.isArray(child)) {
          if (child[0] === "at") {
            fpX = parseFloat(child[1] || "0");
            fpY = parseFloat(child[2] || "0");
            fpAngle = parseFloat(child[3] || "0");
          } else if (child[0] === "pad") {
            let px = 0,
              py = 0,
              net = null;
            for (const pchild of child) {
              if (Array.isArray(pchild)) {
                if (pchild[0] === "at") {
                  px = parseFloat(pchild[1] || "0");
                  py = parseFloat(pchild[2] || "0");
                } else if (pchild[0] === "net") {
                  net = parseInt(pchild[1], 10);
                }
              }
            }
            fpPads.push({ x: px, y: py, net });
          }
        }
      }
      footprints.push({ name: fpName, x: fpX, y: fpY, angle: fpAngle });

      // KiCad pad coords are relative to footprint center and rotation
      const rad = (fpAngle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      for (const p of fpPads) {
        const absX = fpX + (p.x * cos - p.y * sin);
        const absY = fpY + (p.x * sin + p.y * cos);
        pads.push({ x: absX, y: absY, net: p.net });
      }
    } else if (type === "segment") {
      let x1 = 0,
        y1 = 0,
        x2 = 0,
        y2 = 0,
        net = null;
      for (const child of node) {
        if (Array.isArray(child)) {
          if (child[0] === "start") {
            x1 = parseFloat(child[1] || "0");
            y1 = parseFloat(child[2] || "0");
          } else if (child[0] === "end") {
            x2 = parseFloat(child[1] || "0");
            y2 = parseFloat(child[2] || "0");
          } else if (child[0] === "net") {
            net = parseInt(child[1], 10);
          }
        }
      }
      segments.push({ x1, y1, x2, y2, net });
    }
  }
  return { footprints, pads, segments };
}

// ---------------------------------------------------------
// 2. Embedded HTML / JS Frontend
// ---------------------------------------------------------
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live KiCad PCB Viewer</title>
    <style>
        body { margin: 0; display: flex; height: 100vh; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1e1e1e; color: #fff; overflow: hidden; }
        #sidebar { width: 300px; background: #252526; border-right: 1px solid #333; transition: transform 0.3s ease, width 0.3s ease; display: flex; flex-direction: column; z-index: 10; }
        #sidebar.collapsed { width: 0; transform: translateX(-100%); }
        #sidebar h2 { margin: 0; padding: 20px 15px 10px; font-size: 16px; color: #ccc; }
        #fileList { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex: 1; }
        #fileList li { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #333; transition: background 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        #fileList li:hover { background: #2a2d2e; }
        #fileList li.active { background: #37373d; border-left: 3px solid #007acc; }
        #main { flex: 1; position: relative; }
        canvas { display: block; width: 100%; height: 100%; cursor: grab; }
        canvas:active { cursor: grabbing; }
        #toggleBtn { position: absolute; top: 15px; left: 15px; background: #333; color: white; border: 1px solid #555; padding: 5px 10px; cursor: pointer; z-index: 20; border-radius: 4px; }
        #toggleBtn:hover { background: #444; }
        #status { position: absolute; bottom: 15px; left: 15px; background: rgba(0,0,0,0.6); padding: 5px 10px; border-radius: 4px; pointer-events: none; font-family: monospace; }
    </style>
</head>
<body>
    <div id="sidebar">
        <h2>PCB Files</h2>
        <ul id="fileList"></ul>
    </div>
    <div id="main">
        <button id="toggleBtn">☰</button>
        <canvas id="canvas"></canvas>
        <div id="status">Waiting for file...</div>
    </div>

    <script>
        const ws = new WebSocket('ws://' + location.host);
        let activeFile = null;
        let pcbData = { footprints: [], pads: [], segments: [] };

        // Canvas state
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let scale = 1, offsetX = 0, offsetY = 0;
        let isDragging = false, lastX = 0, lastY = 0;

        function resize() {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            draw();
        }
        window.addEventListener('resize', resize);
        resize();

        // WebSocket Handlers
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'fileList') {
                const ul = document.getElementById('fileList');
                ul.innerHTML = '';
                msg.files.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = file;
                    if (file === activeFile) li.className = 'active';
                    li.onclick = () => {
                        activeFile = file;
                        document.querySelectorAll('#fileList li').forEach(el => el.classList.remove('active'));
                        li.classList.add('active');
                        ws.send(JSON.stringify({ action: 'select', file }));
                    };
                    ul.appendChild(li);
                });
            } else if (msg.type === 'pcbData') {
                pcbData = msg.data;
                document.getElementById('status').textContent = 'Viewing: ' + activeFile;
                centerBoard();
                draw();
            }
        };

        // UI toggles
        document.getElementById('toggleBtn').onclick = () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        };

        // Pan and Zoom logic
        function transformPoint(x, y) {
            return { x: (x - offsetX) / scale, y: (y - offsetY) / scale };
        }

        canvas.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
        window.addEventListener('mouseup', () => { isDragging = false; });
        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            offsetX += e.clientX - lastX;
            offsetY += e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            draw();
        });

        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
            const mouseX = e.clientX - canvas.offsetLeft;
            const mouseY = e.clientY - canvas.offsetTop;
            
            const beforeZoom = transformPoint(mouseX, mouseY);
            scale *= zoomAmount;
            offsetX = mouseX - beforeZoom.x * scale;
            offsetY = mouseY - beforeZoom.y * scale;
            draw();
        });

        function centerBoard() {
            if (!pcbData.pads.length && !pcbData.segments.length) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const check = (x, y) => {
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
            };
            pcbData.pads.forEach(p => check(p.x, p.y));
            pcbData.segments.forEach(s => { check(s.x1, s.y1); check(s.x2, s.y2); });

            const padding = 20;
            const boardW = maxX - minX;
            const boardH = maxY - minY;
            const scaleX = (canvas.width - padding*2) / (boardW || 1);
            const scaleY = (canvas.height - padding*2) / (boardH || 1);
            
            scale = Math.min(scaleX, scaleY);
            offsetX = (canvas.width - boardW * scale) / 2 - minX * scale;
            offsetY = (canvas.height - boardH * scale) / 2 - minY * scale;
        }

        function draw() {
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            // 1. Draw Segments (Routed Tracks)
            ctx.strokeStyle = '#007ACC'; 
            ctx.lineWidth = Math.max(0.2, 1 / scale);
            ctx.lineCap = 'round';
            ctx.beginPath();
            pcbData.segments.forEach(s => {
                ctx.moveTo(s.x1, s.y1);
                ctx.lineTo(s.x2, s.y2);
            });
            ctx.stroke();

            // 2. Draw Ratlines (Unrouted Nets connection approximation)
            const padsByNet = {};
            pcbData.pads.forEach(p => {
                if (p.net && p.net > 0) {
                    if (!padsByNet[p.net]) padsByNet[p.net] = [];
                    padsByNet[p.net].push(p);
                }
            });

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = Math.max(0.1, 0.5 / scale);
            ctx.beginPath();
            for (const net in padsByNet) {
                const netPads = padsByNet[net];
                if (netPads.length < 2) continue;
                // Draw a simple spanning line for ratlines
                for (let i = 1; i < netPads.length; i++) {
                    ctx.moveTo(netPads[i-1].x, netPads[i-1].y);
                    ctx.lineTo(netPads[i].x, netPads[i].y);
                }
            }
            ctx.stroke();

            // 3. Draw Footprint Anchors (Crosshairs)
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = Math.max(0.1, 0.5 / scale);
            const size = Math.max(0.5, 3 / scale);
            ctx.beginPath();
            pcbData.footprints.forEach(fp => {
                ctx.moveTo(fp.x - size, fp.y); ctx.lineTo(fp.x + size, fp.y);
                ctx.moveTo(fp.x, fp.y - size); ctx.lineTo(fp.x, fp.y + size);
            });
            ctx.stroke();

            // 4. Draw Pads (Dots)
            ctx.fillStyle = '#E53935';
            pcbData.pads.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.2, 1.5 / scale), 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
        }
    </script>
</body>
</html>
`;

// ---------------------------------------------------------
// 3. HTTP and WebSocket Server Setup
// ---------------------------------------------------------
const targetFolder = process.argv[2] || process.cwd();

console.log(`Starting KiCad viewer...`);
console.log(`Watching folder: ${targetFolder}`);

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML_CONTENT);
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });
const availableFiles = new Set<string>();

// Broadcast updated file list to all connected clients
function broadcastFileList() {
  const fileList = Array.from(availableFiles).sort();
  const msg = JSON.stringify({ type: "fileList", files: fileList });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// Parse and send data of a specific file to a specific client
function sendPcbData(client: WebSocket, fileName: string) {
  const fullPath = path.join(targetFolder, fileName);
  try {
    if (fs.existsSync(fullPath)) {
      const data = extractPcbData(fullPath);
      client.send(JSON.stringify({ type: "pcbData", data }));
    }
  } catch (err) {
    console.error(`Error parsing file ${fileName}:`, err);
  }
}

// ---------------------------------------------------------
// 4. File Watcher
// ---------------------------------------------------------
// Watch the directory itself (safer than passing globs in newer chokidar versions)
const watcher = chokidar.watch(targetFolder, {
  depth: 1, // Only look in the immediate folder
  ignored: /(^|[\/\\])\..|node_modules/, // Ignore hidden files and node_modules
  ignoreInitial: false,
});

watcher
  .on("add", (filePath) => {
    if (!filePath.endsWith(".kicad_pcb")) return;
    const file = path.basename(filePath);
    availableFiles.add(file);
    broadcastFileList();
  })
  .on("unlink", (filePath) => {
    if (!filePath.endsWith(".kicad_pcb")) return;
    const file = path.basename(filePath);
    availableFiles.delete(file);
    broadcastFileList();
  })
  .on("change", (filePath) => {
    if (!filePath.endsWith(".kicad_pcb")) return;
    const file = path.basename(filePath);

    console.log(`File changed: ${file}. Pushing updates...`);
    // Push the update to any client currently viewing this file
    wss.clients.forEach((client: any) => {
      if (client.activeFile === file && client.readyState === WebSocket.OPEN) {
        sendPcbData(client, file);
      }
    });
  });

// Handle incoming websocket connections
wss.on("connection", (ws: any) => {
  ws.activeFile = null;

  // Immediately send current files
  ws.send(
    JSON.stringify({
      type: "fileList",
      files: Array.from(availableFiles).sort(),
    }),
  );

  ws.on("message", (message: string) => {
    try {
      const req = JSON.parse(message);
      if (req.action === "select" && req.file) {
        ws.activeFile = req.file;
        sendPcbData(ws, req.file);
      }
    } catch (e) {
      console.error("Invalid WS message:", e);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Server is running!`);
  console.log(`👉 Open http://localhost:${PORT} in your web browser.\n`);
});
