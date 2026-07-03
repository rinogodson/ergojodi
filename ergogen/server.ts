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
            background-color: #121212;
            color: #e0e0e0;
            overflow: hidden;
        }

        /* Sidebar Styling */
        #sidebar {
            width: 300px;
            min-width: 300px;
            background: #1e1e1e;
            border-right: 1px solid #333;
            display: flex;
            flex-direction: column;
            z-index: 10;
            transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Collapsed State */
        body.sidebar-collapsed #sidebar {
            margin-left: -300px;
        }

        .sidebar-header {
            padding: 15px;
            background: #252526;
            border-bottom: 1px solid #333;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            white-space: nowrap;
        }
        
        .overlap-toggle {
            display: flex;
            align-items: center;
            font-weight: normal;
            font-size: 12px;
            cursor: pointer;
            color: #aaa;
        }
        .overlap-toggle input {
            margin-right: 6px;
            cursor: pointer;
        }

        /* Toggle Buttons */
        .btn-icon {
            background: transparent;
            border: none;
            color: #888;
            cursor: pointer;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }
        .btn-icon:hover {
            background: #333;
            color: #fff;
        }

        #floating-toggle {
            position: absolute;
            left: 10px;
            top: 10px;
            z-index: 5;
            background: #1e1e1e;
            border: 1px solid #333;
            display: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        body.sidebar-collapsed #floating-toggle {
            display: flex;
        }

        .file-list {
            flex: 1;
            overflow-y: auto;
        }
        .file-item {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #2a2a2a;
            font-size: 13px;
            display: flex;
            align-items: center;
            transition: background 0.1s;
            word-break: break-all;
            color: #ccc;
        }
        .file-item:hover { background: #2a2d2e; }
        .file-item.active {
            background: #04395e;
            color: #fff;
        }
        
        .layer-icon {
            width: 18px;
            height: 18px;
            fill: #888;
            margin-right: 10px;
            flex-shrink: 0;
            display: none;
            cursor: pointer;
        }
        .layer-icon:hover { fill: #fff; }
        .overlap-mode .layer-icon { display: block; }
        
        #workspace-wrapper {
            flex: 1;
            position: relative;
            background-color: #939393;
            background-size: 20px 20px;
            overflow: hidden;
            cursor: grab;
        }
        #workspace-wrapper:active {
            cursor: grabbing;
        }
        
        #workspace {
            position: absolute;
            transform-origin: 0 0;
            display: grid; 
            grid-template-areas: "overlap";
            align-items: start;
            justify-items: start;
        }
        
        #workspace .svg-container {
            grid-area: overlap;
            pointer-events: none;
            display: block;
        }
        #workspace svg {
            display: block;
        }
        
        #empty-state {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            color: #666;
            text-align: center;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <button id="floating-toggle" class="btn-icon" onclick="toggleSidebar()" title="Show Sidebar (Ctrl+B)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    </button>

    <div id="sidebar">
        <div class="sidebar-header">
            <span>SVG Files</span>
            <div style="display: flex; align-items: center; gap: 8px;">
                <label class="overlap-toggle">
                    <input type="checkbox" id="overlap-checkbox" onchange="toggleOverlap()"> Overlap
                </label>
                <button class="btn-icon" onclick="toggleSidebar()" title="Hide Sidebar (Ctrl+B)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
            </div>
        </div>
        <div id="file-list" class="file-list"></div>
    </div>

    <div id="workspace-wrapper">
        <div id="empty-state">
            <h2>Live SVG Preview</h2>
            <p id="empty-desc">Select a file from the sidebar to view it.</p>
        </div>
        <div id="workspace"></div>
    </div>

    <script>
        const fileListEl = document.getElementById('file-list');
        const workspace = document.getElementById('workspace');
        const wrapper = document.getElementById('workspace-wrapper');
        const emptyState = document.getElementById('empty-state');
        const emptyDesc = document.getElementById('empty-desc');
        const overlapCheckbox = document.getElementById('overlap-checkbox');
        
        // --- State ---
        let allFiles = [];
        let currentFile = null;
        let isOverlapMode = false;
        let activeLayers = new Set();
        const svgCache = new Map();
        
        // --- Pan & Zoom State ---
        let scale = 1;
        let panX = 0;
        let panY = 0;
        let isDragging = false;
        let startX = 0; 
        let startY = 0;

        const eyeOpenPath = "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";
        const eyeClosedPath = "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z";

        // --- Layout Functions ---
        function toggleSidebar() {
            document.body.classList.toggle('sidebar-collapsed');
            // Re-center SVG after sidebar transition finishes
            setTimeout(() => {
                renderWorkspace(true);
            }, 300);
        }

        // Keyboard Shortcut: Ctrl+B or Backslash
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey && e.key === 'b') || e.key === '\\\\') {
                e.preventDefault();
                toggleSidebar();
            }
        });

        // --- Core Functions ---
        async function fetchSvg(filename) {
            if (svgCache.has(filename)) return svgCache.get(filename);
            const res = await fetch('/api/svg/' + encodeURIComponent(filename));
            if (res.ok) {
                const text = await res.text();
                svgCache.set(filename, text);
                return text;
            }
            return '<div style="color:red;">Error loading</div>';
        }

        async function loadFiles() {
            try {
                const res = await fetch('/api/files');
                allFiles = await res.json();
                renderFileList();
            } catch (err) {
                console.error('Failed to load files', err);
            }
        }

        function renderFileList() {
            fileListEl.innerHTML = '';
            fileListEl.className = isOverlapMode ? 'file-list overlap-mode' : 'file-list';
            
            allFiles.forEach(f => {
                const div = document.createElement('div');
                div.className = 'file-item';
                if (!isOverlapMode && f === currentFile) div.classList.add('active');
                if (isOverlapMode && activeLayers.has(f)) div.classList.add('active');
                
                const isVisible = activeLayers.has(f);
                const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svgIcon.setAttribute("viewBox", "0 0 24 24");
                svgIcon.setAttribute("class", "layer-icon");
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", isVisible ? eyeOpenPath : eyeClosedPath);
                svgIcon.appendChild(path);
                
                svgIcon.onclick = (e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(f);
                };

                const textSpan = document.createElement('span');
                textSpan.textContent = f;
                div.appendChild(svgIcon);
                div.appendChild(textSpan);
                div.onclick = () => {
                    if (isOverlapMode) toggleLayerVisibility(f);
                    else selectFile(f);
                };
                fileListEl.appendChild(div);
            });
        }

        function toggleLayerVisibility(filename) {
            if (activeLayers.has(filename)) activeLayers.delete(filename);
            else activeLayers.add(filename);
            renderFileList();
            renderWorkspace(true);
        }

        async function toggleOverlap() {
            isOverlapMode = overlapCheckbox.checked;
            if (isOverlapMode) {
                activeLayers = new Set(allFiles);
                emptyDesc.textContent = "All layers hidden. Click eye icons to reveal.";
            } else {
                emptyDesc.textContent = "Select a file from the sidebar to view it.";
            }
            renderFileList();
            await renderWorkspace(false);
        }

        async function selectFile(filename) {
            currentFile = filename;
            renderFileList();
            await renderWorkspace(false);
        }

        async function renderWorkspace(keepState = false) {
            const filesToRender = isOverlapMode 
                ? allFiles.filter(f => activeLayers.has(f))
                : (currentFile ? [currentFile] : []);

            if (filesToRender.length === 0) {
                workspace.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';
            workspace.innerHTML = '';

            for (const f of filesToRender) {
                const svgContent = await fetchSvg(f);
                const container = document.createElement('div');
                container.className = 'svg-container';
                container.innerHTML = svgContent;
                workspace.appendChild(container);
            }
            
            if (!keepState) {
                workspace.style.transform = 'none';
                setTimeout(() => {
                    const rect = workspace.getBoundingClientRect();
                    const wrapperRect = wrapper.getBoundingClientRect();
                    const scaleX = (wrapperRect.width - 60) / (rect.width || 1);
                    const scaleY = (wrapperRect.height - 60) / (rect.height || 1);
                    scale = Math.min(1, scaleX, scaleY);
                    panX = (wrapperRect.width - (rect.width * scale)) / 2;
                    panY = (wrapperRect.height - (rect.height * scale)) / 2;
                    updateTransform();
                }, 0);
            } else {
                updateTransform();
            }
        }

        function updateTransform() {
            workspace.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';
        }

        wrapper.addEventListener('wheel', (e) => {
            const hasVisibleFiles = isOverlapMode ? activeLayers.size > 0 : !!currentFile;
            if (!hasVisibleFiles) return;
            e.preventDefault();
            const delta = e.deltaY * 0.002;
            const newScale = Math.max(0.05, Math.min(scale * (1 - delta), 100));
            const rect = wrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            panX = mouseX - (mouseX - panX) * (newScale / scale);
            panY = mouseY - (mouseY - panY) * (newScale / scale);
            scale = newScale;
            updateTransform();
        }, { passive: false });

        wrapper.addEventListener('mousedown', (e) => {
            const hasVisibleFiles = isOverlapMode ? activeLayers.size > 0 : !!currentFile;
            if (!hasVisibleFiles) return;
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

        const sse = new EventSource('/events');
        sse.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'change') {
                svgCache.delete(data.file);
                loadFiles();
                if ((isOverlapMode && activeLayers.has(data.file)) || (!isOverlapMode && data.file === currentFile)) {
                    renderWorkspace(true);
                }
            }
        };

        loadFiles();
    </script>
</body>
</html>
`;

// --- Server Logic (Unchanged) ---
let sseClients: http.ServerResponse[] = [];

function broadcastChange(filename: string) {
  const payload = `data: ${JSON.stringify({ type: "change", file: filename })}\n\n`;
  sseClients.forEach((client) => client.write(payload));
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(htmlTemplate);
  } else if (pathname === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    sseClients.push(res);
    req.on("close", () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
  } else if (pathname === "/api/files") {
    fs.readdir(targetFolder, (err, files) => {
      if (err) {
        res.writeHead(500);
        return res.end("Error reading directory");
      }
      const svgFiles = files
        .filter((f) => f.toLowerCase().endsWith(".svg"))
        .sort((a, b) => a.localeCompare(b));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(svgFiles));
    });
  } else if (pathname.startsWith("/api/svg/")) {
    const filename = decodeURIComponent(pathname.substring("/api/svg/".length));
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

const changedFiles = new Set<string>();
let watchTimeout: NodeJS.Timeout | null = null;

fs.watch(targetFolder, (eventType, filename) => {
  if (filename && filename.toLowerCase().endsWith(".svg")) {
    changedFiles.add(filename);
    if (watchTimeout) clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      changedFiles.forEach((file) => broadcastChange(file));
      changedFiles.clear();
    }, 100);
  }
});

server.listen(PORT, () => {
  console.log(`\n🎨 Dark Theme SVG Preview is running!`);
  console.log(`📁 Watching directory : ${targetFolder}`);
  console.log(`🌐 Open your browser  : http://localhost:${PORT}\n`);
});
