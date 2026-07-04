import express from "express";
import http from "http";
import { Server } from "socket.io";
import chokidar from "chokidar";
import fs from "fs";
import path from "path";

// 1. Setup Environment
const DIRECTORY = path.resolve(
  process.argv[2] || path.join(process.cwd(), "dxfs"),
);

if (!fs.existsSync(DIRECTORY)) {
  fs.mkdirSync(DIRECTORY, { recursive: true });
  console.log(`Created directory: ${DIRECTORY}. Place your .dxf files here!`);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// 2. HTML Frontend Payload - Powered by Pure Native SVG Vector Rendering
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live DXF Viewer (SVG Vector Engine)</title>
    <style>
        body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; height: 100vh; overflow: hidden; background: #ecf0f1; }
        #sidebar { width: 340px; background: #2c3e50; color: white; display: flex; flex-direction: column; box-shadow: 2px 0 10px rgba(0,0,0,0.3); z-index: 10; }
        #sidebar h2 { padding: 15px; margin: 0; background: #1a252f; font-size: 16px; border-bottom: 1px solid #111; }
        #controls { padding: 15px; background: #34495e; border-bottom: 1px solid #1a252f; }
        #file-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex: 1; }
        #file-list li { padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #34495e; transition: background 0.2s; display: flex; align-items: center; user-select: none; }
        #file-list li:hover { background: #3b536b; }
        #file-list li.active { background: #1abc9c; }
        
        .layer-checkbox { width: 18px; height: 18px; cursor: pointer; margin-right: 12px; accent-color: #2ecc71; }
        .color-box { width: 14px; height: 14px; border-radius: 50%; display: inline-block; margin-right: 12px; box-shadow: 0 0 4px rgba(0,0,0,0.6); flex-shrink: 0; }
        
        #viewer { flex: 1; position: relative; overflow: hidden; background: #fff; cursor: grab; }
        #viewer:active { cursor: grabbing; }
        
        /* The SVG Canvas is infinitely sharp */
        svg { display: block; width: 100%; height: 100%; touch-action: none; }
        
        button { background: #3498db; color: white; border: none; padding: 12px; width: 100%; cursor: pointer; font-size: 14px; font-weight: bold; border-radius: 4px; transition: background 0.2s; }
        button:hover { background: #2980b9; }
        button.active-mode { background: #27ae60; }
        button.active-mode:hover { background: #219a52; }
        
        .loading { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.85); color: white; padding: 8px 16px; border-radius: 4px; display: none; font-size: 13px; font-weight: bold; z-index: 100; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    </style>
</head>
<body>

    <div id="sidebar">
        <h2>Live DXF Workspace (SVG)</h2>
        <div id="controls">
            <button id="overlapBtn">🔄 Overlap All Files</button>
        </div>
        <ul id="file-list"></ul>
    </div>

    <div id="viewer">
        <div id="loading" class="loading">Parsing CAD Geometry...</div>
        <!-- SVG Vector Setup -->
        <svg id="cadSvg" preserveAspectRatio="xMidYMid meet">
            <!-- transform scale(1, -1) safely converts SVG Y-Down to CAD Y-Up coordinates -->
            <g id="svgGroup" transform="scale(1, -1)"></g>
        </svg>
    </div>

    <script type="module">
        import DxfParser from 'https://esm.sh/dxf-parser@1.1.2';
        import { io } from 'https://esm.sh/socket.io-client@4.7.2';

        const socket = io();
        const parser = new DxfParser();
        const fileListEl = document.getElementById('file-list');
        const overlapBtn = document.getElementById('overlapBtn');
        const loadingEl = document.getElementById('loading');
        
        const svgEl = document.getElementById('cadSvg');
        const svgGroup = document.getElementById('svgGroup');
        
        // App State
        let serverFiles = [];
        const dxfCache = new Map();     
        const visibleFiles = new Set();  
        const fileColors = new Map();    
        
        const palette = ['#e74c3c', '#3498db', '#9b59b6', '#2ecc71', '#f1c40f', '#e67e22', '#1abc9c', '#34495e'];
        function getColor(index) { return palette[index % palette.length]; }

        // Camera / ViewBox bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let currentViewBox = { x: 0, y: 0, w: 1000, h: 1000 };

        // ==========================================
        // SOCKET.IO & LIVE RELOADING
        // ==========================================
        socket.on('file-list', async (files) => {
            serverFiles = files;
            files.forEach((file, index) => {
                if (!fileColors.has(file)) fileColors.set(file, getColor(index));
            });

            loadingEl.style.display = 'block';
            for (const file of files) {
                if (!dxfCache.has(file)) {
                    try {
                        const parsed = await fetchDxf(file);
                        dxfCache.set(file, parsed);
                    } catch (err) { console.error("Parse Error: " + file, err); }
                }
            }
            loadingEl.style.display = 'none';

            for (const file of visibleFiles) {
                if (!files.includes(file)) visibleFiles.delete(file);
            }

            if (visibleFiles.size === 0 && files.length > 0) visibleFiles.add(files[0]);

            updateUI();
            resetView();
            renderSVG();
        });

        socket.on('file-changed', async (filename) => {
            loadingEl.style.display = 'block';
            try {
                const parsed = await fetchDxf(filename);
                dxfCache.set(filename, parsed);
                if (visibleFiles.has(filename)) {
                    resetView();
                    renderSVG();
                }
            } catch (err) {}
            loadingEl.style.display = 'none';
        });

        async function fetchDxf(filename) {
            const res = await fetch('/api/dxf/' + encodeURIComponent(filename));
            const text = await res.text();
            return parser.parseSync(text);
        }

        // ==========================================
        // SVG GEOMETRY ENGINE (FLAWLESS CURVES)
        // ==========================================
        function renderSVG() {
            let svgHtml = '';
            
            visibleFiles.forEach(filename => {
                const dxf = dxfCache.get(filename);
                if (!dxf || !dxf.entities) return;
                
                const color = fileColors.get(filename) || '#000';
                // vector-effect="non-scaling-stroke" guarantees lines never get pixelated/thick when zooming!
                svgHtml += \`<g stroke="\${color}" stroke-width="1.5" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round">\`;
                
                dxf.entities.forEach(ent => {
                    if (ent.type === 'LINE') {
                        if(ent.vertices && ent.vertices.length >= 2) {
                            svgHtml += \`<line x1="\${ent.vertices[0].x}" y1="\${ent.vertices[0].y}" x2="\${ent.vertices[1].x}" y2="\${ent.vertices[1].y}" />\`;
                        }
                    } else if (ent.type === 'CIRCLE') {
                        svgHtml += \`<circle cx="\${ent.center.x}" cy="\${ent.center.y}" r="\${ent.radius}" />\`;
                    } else if (ent.type === 'ARC') {
                        // Native SVG Arc Generation completely eliminates 2*PI wrap bugs
                        const startRad = ent.startAngle * Math.PI / 180;
                        const endRad = ent.endAngle * Math.PI / 180;
                        const startX = ent.center.x + ent.radius * Math.cos(startRad);
                        const startY = ent.center.y + ent.radius * Math.sin(startRad);
                        const endX = ent.center.x + ent.radius * Math.cos(endRad);
                        const endY = ent.center.y + ent.radius * Math.sin(endRad);
                        
                        let sweep = endRad - startRad;
                        if (sweep < 0) sweep += 2 * Math.PI;
                        const largeArc = sweep > Math.PI ? 1 : 0;
                        
                        svgHtml += \`<path d="M \${startX},\${startY} A \${ent.radius} \${ent.radius} 0 \${largeArc} 1 \${endX},\${endY}" />\`;
                    
                    } else if (ent.type === 'POLYLINE' || ent.type === 'LWPOLYLINE') {
                        if (!ent.vertices || ent.vertices.length < 2) return;
                        let d = \`M \${ent.vertices[0].x},\${ent.vertices[0].y} \`;
                        
                        for (let i = 0; i < ent.vertices.length - 1; i++) {
                            const p1 = ent.vertices[i];
                            const p2 = ent.vertices[i+1];
                            const b = p1.bulge || 0;
                            if (b !== 0) {
                                const dx = p2.x - p1.x;
                                const dy = p2.y - p1.y;
                                const L = Math.hypot(dx, dy);
                                if(L > 1e-8) {
                                    const R = Math.abs(L * (1 + b * b) / (4 * b));
                                    const largeArc = Math.abs(b) > 1 ? 1 : 0;
                                    const sweep = b > 0 ? 1 : 0; // CAD Bulge maps 1:1 to SVG Sweep Flag!
                                    d += \`A \${R} \${R} 0 \${largeArc} \${sweep} \${p2.x},\${p2.y} \`;
                                } else d += \`L \${p2.x},\${p2.y} \`;
                            } else {
                                d += \`L \${p2.x},\${p2.y} \`;
                            }
                        }
                        
                        if (ent.shape || ent.closed) {
                            const p1 = ent.vertices[ent.vertices.length - 1];
                            const p2 = ent.vertices[0];
                            const b = p1.bulge || 0;
                            if (b !== 0) {
                                const dx = p2.x - p1.x;
                                const dy = p2.y - p1.y;
                                const L = Math.hypot(dx, dy);
                                if(L > 1e-8) {
                                    const R = Math.abs(L * (1 + b * b) / (4 * b));
                                    const largeArc = Math.abs(b) > 1 ? 1 : 0;
                                    const sweep = b > 0 ? 1 : 0;
                                    d += \`A \${R} \${R} 0 \${largeArc} \${sweep} \${p2.x},\${p2.y} \`;
                                } else d += \`Z \`;
                            } else d += \`Z \`;
                        }
                        svgHtml += \`<path d="\${d}" />\`;
                    
                    } else if (ent.type === 'ELLIPSE') {
                        const rx = Math.hypot(ent.majorAxisEndPoint.x, ent.majorAxisEndPoint.y);
                        const ry = rx * ent.axisRatio;
                        if (ent.startAngle === undefined || (ent.startAngle === 0 && ent.endAngle === Math.PI * 2)) {
                            const rot = Math.atan2(ent.majorAxisEndPoint.y, ent.majorAxisEndPoint.x) * 180 / Math.PI;
                            svgHtml += \`<ellipse cx="\${ent.center.x}" cy="\${ent.center.y}" rx="\${rx}" ry="\${ry}" transform="rotate(\${rot} \${ent.center.x} \${ent.center.y})" />\`;
                        }
                    } else if (ent.type === 'SPLINE') {
                        const pts = ent.points || ent.controlPoints;
                        if (pts && pts.length > 0) {
                            let d = \`M \${pts[0].x},\${pts[0].y} \`;
                            for(let i=1; i<pts.length; i++) d += \`L \${pts[i].x},\${pts[i].y} \`;
                            svgHtml += \`<path d="\${d}" />\`;
                        }
                    }
                });
                
                svgHtml += \`</g>\`;
            });

            svgGroup.innerHTML = svgHtml;
        }

        // ==========================================
        // AUTO-EXTENT CALCULATION
        // ==========================================
        function updateExtents(ent) {
            const addPt = (x, y) => {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            };

            if (ent.type === 'LINE' && ent.vertices) ent.vertices.forEach(v => addPt(v.x, v.y));
            else if ((ent.type === 'POLYLINE' || ent.type === 'LWPOLYLINE') && ent.vertices) {
                ent.vertices.forEach(v => addPt(v.x, v.y));
            } else if (ent.type === 'CIRCLE' || ent.type === 'ARC' || ent.type === 'ELLIPSE') {
                const rx = ent.radius || (ent.majorAxisEndPoint ? Math.hypot(ent.majorAxisEndPoint.x, ent.majorAxisEndPoint.y) : 0);
                if (ent.center) { addPt(ent.center.x - rx, ent.center.y - rx); addPt(ent.center.x + rx, ent.center.y + rx); }
            } else if (ent.type === 'SPLINE' && (ent.points || ent.controlPoints)) {
                (ent.points || ent.controlPoints).forEach(v => addPt(v.x, v.y));
            }
        }

        function resetView() {
            minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
            visibleFiles.forEach(filename => {
                const dxf = dxfCache.get(filename);
                if (dxf && dxf.entities) dxf.entities.forEach(ent => updateExtents(ent));
            });

            if (minX !== Infinity) {
                const w = maxX - minX;
                const h = maxY - minY;
                const cx = minX + w / 2;
                const cy = minY + h / 2;
                
                const paddedW = (w === 0 ? 100 : w) * 1.15;
                const paddedH = (h === 0 ? 100 : h) * 1.15;

                currentViewBox = {
                    x: cx - paddedW / 2,
                    y: -cy - paddedH / 2, // Inverted due to scale(1, -1)
                    w: paddedW,
                    h: paddedH
                };
                updateViewBox();
            }
        }

        // ==========================================
        // BUTTER-SMOOTH PANNING & ZOOMING (Native ViewBox)
        // ==========================================
        function updateViewBox() {
            svgEl.setAttribute('viewBox', \`\${currentViewBox.x} \${currentViewBox.y} \${currentViewBox.w} \${currentViewBox.h}\`);
        }

        let isDragging = false;
        let startPan = { x: 0, y: 0 };

        svgEl.addEventListener('mousedown', (e) => {
            isDragging = true;
            startPan = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => isDragging = false);

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startPan.x;
            const dy = e.clientY - startPan.y;
            
            // Map Screen Movement into Vector scale
            const ratioX = currentViewBox.w / svgEl.clientWidth;
            const ratioY = currentViewBox.h / svgEl.clientHeight;
            
            currentViewBox.x -= dx * ratioX;
            currentViewBox.y -= dy * ratioY;
            startPan = { x: e.clientX, y: e.clientY };
            updateViewBox();
        });

        svgEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomIntensity = 0.1;
            const wheel = e.deltaY < 0 ? -1 : 1;
            const zoomFactor = Math.exp(wheel * zoomIntensity);
            
            // Zoom in perfectly on the Mouse Position
            const rect = svgEl.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const ratioX = currentViewBox.w / svgEl.clientWidth;
            const ratioY = currentViewBox.h / svgEl.clientHeight;
            
            const vbMouseX = currentViewBox.x + mouseX * ratioX;
            const vbMouseY = currentViewBox.y + mouseY * ratioY;
            
            currentViewBox.w *= zoomFactor;
            currentViewBox.h *= zoomFactor;
            currentViewBox.x = vbMouseX - (mouseX * (currentViewBox.w / svgEl.clientWidth));
            currentViewBox.y = vbMouseY - (mouseY * (currentViewBox.h / svgEl.clientHeight));
            
            updateViewBox();
        }, { passive: false });

        // ==========================================
        // UI INTERACTIONS
        // ==========================================
        overlapBtn.addEventListener('click', () => {
            const allChecked = serverFiles.every(f => visibleFiles.has(f));
            if (allChecked) {
                visibleFiles.clear();
                if (serverFiles.length > 0) visibleFiles.add(serverFiles[0]);
            } else serverFiles.forEach(f => visibleFiles.add(f));
            
            updateUI();
            resetView();
            renderSVG();
        });

        function updateUI() {
            fileListEl.innerHTML = '';
            serverFiles.forEach((file) => {
                const li = document.createElement('li');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'layer-checkbox';
                checkbox.checked = visibleFiles.has(file);
                
                checkbox.addEventListener('click', (e) => e.stopPropagation());
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) visibleFiles.add(file);
                    else visibleFiles.delete(file);
                    
                    updateUI();
                    resetView();
                    renderSVG();
                });

                const colorBox = document.createElement('div');
                colorBox.className = 'color-box';
                colorBox.style.backgroundColor = fileColors.get(file);

                const span = document.createElement('span');
                span.innerText = file;
                span.style.flex = '1';

                li.appendChild(checkbox);
                li.appendChild(colorBox);
                li.appendChild(span);

                li.addEventListener('click', () => {
                    visibleFiles.clear();
                    visibleFiles.add(file);
                    updateUI();
                    resetView();
                    renderSVG();
                });

                if (visibleFiles.has(file) && visibleFiles.size === 1) li.classList.add('active');
                fileListEl.appendChild(li);
            });

            if (serverFiles.every(f => visibleFiles.has(f)) && serverFiles.length > 0) {
                overlapBtn.classList.add('active-mode');
                overlapBtn.innerText = '✅ Showing All Overlaps';
            } else {
                overlapBtn.classList.remove('active-mode');
                overlapBtn.innerText = '🔄 Overlap All Files';
            }
        }
    </script>
</body>
</html>
`;

// 3. API & Server Routes
app.get("/", (req, res) => res.send(indexHtml));
app.get("/api/dxf/:filename", (req, res) => {
  const filePath = path.join(DIRECTORY, req.params.filename);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.status(404).send("File not found");
});

// 4. File Watcher & Socket Interaction
const watcher = chokidar.watch(DIRECTORY, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
});
function broadcastFiles() {
  fs.readdir(DIRECTORY, (err, files) => {
    if (!err)
      io.emit(
        "file-list",
        files.filter((f) => f.toLowerCase().endsWith(".dxf")),
      );
  });
}
watcher
  .on("add", broadcastFiles)
  .on("unlink", broadcastFiles)
  .on("change", (filePath) => {
    io.emit("file-changed", path.basename(filePath));
  });
io.on("connection", (socket) => {
  fs.readdir(DIRECTORY, (err, files) => {
    if (!err)
      socket.emit(
        "file-list",
        files.filter((f) => f.toLowerCase().endsWith(".dxf")),
      );
  });
});

// 5. Start the Server
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`DXF Viewer running at: http://localhost:${PORT}`);
  console.log(`Watching directory:    ${DIRECTORY}`);
  console.log(`======================================================\n`);
});
