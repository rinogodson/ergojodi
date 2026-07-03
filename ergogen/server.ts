#!/usr/bin/env ts-node

import * as http from "http";
import * as fs from "fs";
import * as path from "path";

// --- Configuration ---
const args = process.argv.slice(2);
const targetFolder = path.resolve(args[0] || process.cwd());
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(targetFolder)) {
  console.error(`Error: Directory "${targetFolder}" does not exist.`);
  process.exit(1);
}

// --- HTML & Frontend Application ---
// (We use standard string concatenation to avoid conflicting with TS template literals)
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Live SVG Preview</title>
    <style>
        body {
            margin: 0;
            display: flex;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #333;
            overflow: hidden;
        }
        /* Sidebar Styling */
        #sidebar {
            width: 280px;
            background: #f8f9fa;
            border-right: 1px solid #dee2e6;
            display: flex;
            flex-direction: column;
            z-index: 10;
        }
        .sidebar-header {
            padding: 15px;
            background: #e9ecef;
            border-bottom: 1px solid #dee2e6;
            font-weight: 600;
            font-size: 14px;
            color: #495057;
        }
        .file-list {
            flex: 1;
            overflow-y: auto;
        }
        .file-item {
            padding: 12px 15px;
            cursor: pointer;
            border-bottom: 1px solid #f1f3f5;
            font-size: 14px;
            display: flex;
            align-items: center;
            transition: background 0.2s;
            word-break: break-all;
        }
        .file-item:hover { background: #e9ecef; }
        .file-item.active {
            background: #007bff;
            color: white;
            font-weight: 500;
        }
        
        /* Workspace (Pan & Zoom) Styling */
        #workspace-wrapper {
            flex: 1;
            position: relative;
            background-color: #f0f0f0;
            /* Checkerboard pattern to see transparency clearly */
            background-image: 
                linear-gradient(45deg, #ddd 25%, transparent 25%), 
                linear-gradient(-45deg, #ddd 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #ddd 75%), 
                linear-gradient(-45deg, transparent 75%, #ddd 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            overflow: hidden;
            cursor: grab;
        }
        #workspace-wrapper:active {
            cursor: grabbing;
        }
        #workspace {
            position: absolute;
            transform-origin: 0 0;
            /* Give it inline-block so it sizes exactly to its inner SVG */
            display: inline-block; 
        }
        /* Ensure SVGs don't capture mouse events to keep panning smooth */
        #workspace svg {
            pointer-events: none;
            display: block;
        }
        
        #empty-state {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            color: #6c757d;
            text-align: center;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div id="sidebar">
        <div class="sidebar-header">SVG Files</div>
        <div id="file-list" class="file-list"></div>
    </div>
    <div id="workspace-wrapper">
        <div id="empty-state">
            <h2>Live SVG Preview</h2>
            <p>Select a file from the sidebar to view it.</p>
        </div>
        <div id="workspace"></div>
    </div>

    <script>
        const fileListEl = document.getElementById('file-list');
        const workspace = document.getElementById('workspace');
        const wrapper = document.getElementById('workspace-wrapper');
        const emptyState = document.getElementById('empty-state');
        
        let currentFile = null;
        
        // Pan & Zoom State
        let scale = 1;
        let panX = 0;
        let panY = 0;
        let isDragging = false;
        let startX = 0; 
        let startY = 0;

        // --- Fetch & Render List ---
        async function loadFiles() {
            try {
                const res = await fetch('/api/files');
                const files = await res.json();
                
                fileListEl.innerHTML = '';
                files.forEach(f => {
                    const div = document.createElement('div');
                    div.className = 'file-item';
                    if (f === currentFile) div.classList.add('active');
                    div.textContent = f;
                    div.onclick = () => selectFile(f);
                    fileListEl.appendChild(div);
                });
            } catch (err) {
                console.error('Failed to load files', err);
            }
        }

        // --- Load & Display an SVG ---
        async function selectFile(filename, keepState = false) {
            currentFile = filename;
            loadFiles(); // Re-render to update the active class
            emptyState.style.display = 'none';
            
            const res = await fetch('/api/svg/' + encodeURIComponent(filename));
            if (res.ok) {
                const svgContent = await res.text();
                workspace.innerHTML = svgContent;
                
                if (!keepState) {
                    // Reset transform to measure true dimensions
                    workspace.style.transform = 'none';
                    
                    // Wait 1 tick for DOM to parse SVG and render bounding box
                    setTimeout(() => {
                        const rect = workspace.getBoundingClientRect();
                        const wrapperRect = wrapper.getBoundingClientRect();
                        
                        // Fit to screen if larger, otherwise scale 1
                        const scaleX = (wrapperRect.width - 40) / (rect.width || 1);
                        const scaleY = (wrapperRect.height - 40) / (rect.height || 1);
                        scale = Math.min(1, scaleX, scaleY);
                        
                        const scaledWidth = rect.width * scale;
                        const scaledHeight = rect.height * scale;
                        
                        // Center in workspace
                        panX = (wrapperRect.width - scaledWidth) / 2;
                        panY = (wrapperRect.height - scaledHeight) / 2;
                        
                        updateTransform();
                    }, 0);
                } else {
                    updateTransform();
                }
            } else {
                workspace.innerHTML = '<div style="padding:20px; color:red;">File deleted or unavailable.</div>';
            }
        }

        // --- Pan & Zoom Mechanics ---
        function updateTransform() {
            workspace.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';
        }

        wrapper.addEventListener('wheel', (e) => {
            if (!currentFile) return;
            e.preventDefault();
            const zoomSensitivity = 0.002;
            const delta = e.deltaY * zoomSensitivity;
            const newScale = Math.max(0.05, Math.min(scale * (1 - delta), 100)); // Clamp scale between 0.05x and 100x

            // Zoom perfectly towards the mouse pointer location
            const rect = wrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            panX = mouseX - (mouseX - panX) * (newScale / scale);
            panY = mouseY - (mouseY - panY) * (newScale / scale);
            scale = newScale;
            
            updateTransform();
        });

        wrapper.addEventListener('mousedown', (e) => {
            if (!currentFile) return;
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            updateTransform();
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        // --- Live Reload (Server-Sent Events) ---
        const sse = new EventSource('/events');
        sse.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'change') {
                loadFiles(); // Always refresh list (in case of additions/deletions)
                // If currently viewed file was changed, soft-reload it (keep zoom/pan)
                if (data.file === currentFile) {
                    selectFile(currentFile, true);
                }
            }
        };

        // Initialize
        loadFiles();
    </script>
</body>
</html>
`;

// --- Server & SSE Management ---
let sseClients: http.ServerResponse[] = [];

function broadcastChange(filename: string) {
  const payload = `data: ${JSON.stringify({ type: "change", file: filename })}\n\n`;
  sseClients.forEach((client) => client.write(payload));
}

// Set up the HTTP Web Server
const server = http.createServer((req, res) => {
  // Parse URL safely
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 1. Serve the Frontend HTML
  if (pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(htmlTemplate);
  }
  // 2. Serve the live connection (SSE)
  else if (pathname === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    sseClients.push(res);
    req.on("close", () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
  }
  // 3. API: List all SVGs in the folder
  else if (pathname === "/api/files") {
    fs.readdir(targetFolder, (err, files) => {
      if (err) {
        res.writeHead(500);
        return res.end("Error reading directory");
      }
      const svgFiles = files
        .filter((f) => f.toLowerCase().endsWith(".svg"))
        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(svgFiles));
    });
  }
  // 4. API: Serve actual SVG file contents
  else if (pathname.startsWith("/api/svg/")) {
    const filename = decodeURIComponent(pathname.substring("/api/svg/".length));

    // Protect against directory traversal attacks (e.g. ../../../etc/passwd)
    const safePath = path.normalize(path.join(targetFolder, filename));
    if (!safePath.startsWith(path.normalize(targetFolder))) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    fs.readFile(safePath, "utf8", (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// --- File Watcher ---
const changedFiles = new Set<string>();
let watchTimeout: NodeJS.Timeout | null = null;

// Built in Node.js directory watcher
fs.watch(targetFolder, (eventType, filename) => {
  if (filename && filename.toLowerCase().endsWith(".svg")) {
    changedFiles.add(filename);

    // Debounce events (OS watchers can emit multiple events per single file save)
    if (watchTimeout) clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      changedFiles.forEach((file) => broadcastChange(file));
      changedFiles.clear();
    }, 100);
  }
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`\n🎨 SVG Live Preview Server is running!`);
  console.log(`📁 Watching directory : ${targetFolder}`);
  console.log(`🌐 Open your browser  : http://localhost:${PORT}\n`);
});
