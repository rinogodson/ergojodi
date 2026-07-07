import express from "express";
import * as http from "http";
import { Server } from "socket.io";
import * as chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import { spawn, execSync } from "child_process";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const TARGET_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();
const TEMP_DIR = path.join(process.cwd(), ".jscad_preview_temp");

// Install local compiler instantly to skip slow `npx` overhead
const JSCAD_PKG = "@jscad/openjscad@1";
const BIN_NAME = process.platform === "win32" ? "openjscad.cmd" : "openjscad";
const LOCAL_BIN = path.join(process.cwd(), "node_modules", ".bin", BIN_NAME);

if (!fs.existsSync(LOCAL_BIN)) {
  console.log(
    `\nLocal compiler not found. Installing ${JSCAD_PKG} for instant compilation...`,
  );
  execSync(`npm install --no-save ${JSCAD_PKG}`, { stdio: "inherit" });
  console.log(`Install complete.\n`);
}

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

process.on("SIGINT", () => {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  process.exit();
});

// Holds both .jscad and .stl files
let modelFiles: string[] = [];

function updateFilesList() {
  fs.readdir(TARGET_DIR, (err, files) => {
    if (err) return console.error("Error reading dir:", err);
    modelFiles = files.filter((f) => {
      const ext = f.toLowerCase();
      return ext.endsWith(".jscad") || ext.endsWith(".stl");
    });
    io.emit("files", modelFiles);
  });
}

const watcher = chokidar.watch(TARGET_DIR, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
});

watcher
  .on("add", (f) => {
    const ext = f.toLowerCase();
    if (ext.endsWith(".jscad") || ext.endsWith(".stl")) updateFilesList();
  })
  .on("unlink", (f) => {
    const ext = f.toLowerCase();
    if (ext.endsWith(".jscad") || ext.endsWith(".stl")) updateFilesList();
  })
  .on("change", (f) => {
    const ext = f.toLowerCase();
    if (ext.endsWith(".jscad") || ext.endsWith(".js") || ext.endsWith(".stl")) {
      io.emit("source_changed");
    }
  });

function compileJscadToStl(jscadPath: string, stlPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(LOCAL_BIN, [jscadPath, "-o", stlPath], {
      shell: process.platform === "win32",
    });

    let errorData = "";
    proc.stderr.on("data", (data) => (errorData += data.toString()));

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(errorData));
    });
  });
}

app.get("/", (req, res) => res.send(HTML_CONTENT));

app.get("/preview/:filename", async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(TARGET_DIR, filename);

  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

  const isStl = filename.toLowerCase().endsWith(".stl");

  try {
    let buffer;
    if (isStl) {
      // Native STL file - stream directly without compiling
      buffer = await fs.promises.readFile(filePath);
    } else {
      // JSCAD file - compile to STL, then stream
      const stlPath = path.join(TEMP_DIR, filename + ".stl");
      await compileJscadToStl(filePath, stlPath);
      buffer = await fs.promises.readFile(stlPath);
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(buffer);
  } catch (err: any) {
    console.error("Error serving preview:", err.message);
    res.status(500).send("Compilation or Read error");
  }
});

io.on("connection", (socket) => socket.emit("files", modelFiles));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n=== JSCAD & STL Instant Live Preview Started ===`);
  console.log(`Listening on: http://localhost:${PORT}`);
  console.log(`Watching dir: ${TARGET_DIR}\n`);
  updateFilesList();
});

// ----------------------------------------------------------------------
// FRONTEND HTML / CSS / JS PAYLOAD
// ----------------------------------------------------------------------
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JSCAD & STL Live Preview</title>
    <style>
        body { margin: 0; display: flex; height: 100vh; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1e1e1e; color: #eee; }
        
        #sidebar { width: 260px; background: #252526; border-right: 1px solid #3c3c3c; display: flex; flex-direction: column; z-index: 5; flex-shrink: 0; transition: margin-left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
        #sidebar.collapsed { margin-left: -260px; }
        #sidebar h2 { padding: 15px; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #3c3c3c; background: #2d2d2d; }
        #sidebar ul { list-style: none; padding: 0; margin: 0; flex: 1; overflow-y: auto; }
        #sidebar li { padding: 12px 15px; border-bottom: 1px solid #333; cursor: pointer; font-size: 14px; transition: background 0.15s; display: flex; align-items: center; gap: 10px; }
        #sidebar li:hover { background: #37373d; }
        #sidebar input[type="checkbox"] { cursor: pointer; width: 16px; height: 16px; accent-color: #4daafc; }
        
        #viewer { flex: 1; position: relative; overflow: hidden; }
        canvas { display: block; width: 100%; height: 100%; outline: none; }
        
        #status-overlay { position: absolute; top: 20px; right: 20px; background: rgba(0, 120, 215, 0.9); color: white; padding: 8px 16px; border-radius: 4px; display: none; font-size: 13px; z-index: 10; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        #empty-state { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666; font-size: 18px; pointer-events: none; }
        
        .floating-panel { position: absolute; z-index: 10; display: flex; gap: 6px; background: rgba(37,37,38,0.85); padding: 8px; border-radius: 8px; border: 1px solid #444; box-shadow: 0 4px 6px rgba(0,0,0,0.3); backdrop-filter: blur(4px); align-items: center; }
        #toolbar { bottom: 25px; right: 25px; }
        #zoom-toolbar { bottom: 25px; left: 25px; }
        
        .ui-btn { padding: 8px 12px; background: #2d2d2d; color: #aaa; border: 1px solid #444; border-radius: 4px; font-size: 12px; cursor: pointer; transition: 0.15s; font-weight: 600; text-transform: uppercase; white-space: nowrap; }
        .ui-btn:hover { background: #3c3c3c; color: #fff; }
        .ui-btn.active { background: #0068d6; color: #fff; border-color: #4daafc; }
        .separator { width: 1px; height: 20px; background: #555; margin: 0 4px; }
    </style>
</head>
<body>
    <div id="sidebar">
        <h2>Models (Overlap Mode)</h2>
        <ul id="file-list"></ul>
    </div>
    
    <div id="viewer">
        <button id="btn-toggle-sidebar" class="ui-btn" style="position: absolute; top: 15px; left: 15px; z-index: 20;">☰ Models</button>
        <div id="status-overlay">Compiling...</div>
        <div id="empty-state">Select .jscad or .stl files from the left sidebar to preview</div>
        
        <!-- ZOOM & SAVED VIEWS TOOLBAR -->
        <div id="zoom-toolbar" class="floating-panel" style="display: none;">
            <div id="zoom-text" style="color: #ccc; font-size: 13px; font-weight: bold; width: 45px; text-align: center;">100%</div>
            <button id="btn-save-zoom" class="ui-btn">+ Save</button>
            <div class="separator"></div>
            <div id="saved-views-container" style="display: flex; gap: 4px;"></div>
        </div>

        <!-- MAIN VIEW TOOLBAR -->
        <div id="toolbar" class="floating-panel" style="display: none;">
            <button id="btn-origin" class="ui-btn active" title="Use absolute CAD Coordinates">Origin: CAD</button>
            <div class="separator"></div>
            <button id="btn-grid" class="ui-btn active">Grid</button>
            <button id="btn-camera" class="ui-btn">Persp</button>
            <button id="btn-xray" class="ui-btn">X-Ray</button>
            <div class="separator"></div>
            <button id="btn-view-x" class="ui-btn" style="color: #ff6b6b;" title="Right View">X</button>
            <button id="btn-view-y" class="ui-btn" style="color: #4ecdc4;" title="Front View">Y</button>
            <button id="btn-view-z" class="ui-btn" style="color: #4daafc;" title="Top View">Z</button>
            <button id="btn-view-iso" class="ui-btn">ISO</button>
        </div>
    </div>
    
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
        }
    </script>
    <script type="module">
        import * as THREE from 'three';
        import { STLLoader } from 'three/addons/loaders/STLLoader.js';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { io } from 'https://cdn.socket.io/4.7.4/socket.io.esm.min.js';

        // SET Z-AXIS AS UP (Standard CAD Behavior)
        THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

        const container = document.getElementById('viewer');
        const overlay = document.getElementById('status-overlay');
        const emptyState = document.getElementById('empty-state');
        const toolbar = document.getElementById('toolbar');
        const zoomToolbar = document.getElementById('zoom-toolbar');
        
        // --- UI BINDINGS ---
        document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // --- SCENE & CAD LIGHTING ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x222222);
        
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(100, -100, 200);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xe0eaff, 0.6);
        fillLight.position.set(-100, 100, 50);
        scene.add(fillLight);
        const backLight = new THREE.DirectionalLight(0xffe0e0, 0.5);
        backLight.position.set(50, 100, -50);
        scene.add(backLight);
        
        // --- GRID & AXES ---
        const helpersGroup = new THREE.Group();
        const grid1 = new THREE.GridHelper(400, 400, 0x444444, 0x2a2a2a);
        grid1.rotation.x = Math.PI / 2;
        const grid10 = new THREE.GridHelper(400, 40, 0x777777, 0x444444);
        grid10.rotation.x = Math.PI / 2;
        grid10.position.z = 0.01;
        const axes = new THREE.AxesHelper(150);
        
        helpersGroup.add(grid1);
        helpersGroup.add(grid10);
        helpersGroup.add(axes);
        scene.add(helpersGroup);

        // --- CAMERAS & CONTROLS ---
        let isOrthographic = false;
        let modelMaxDim = 100;
        let baseDistance = 150;
        let hasInitiallyAligned = false;
        
        const perspCam = new THREE.PerspectiveCamera(45, 1, 1, 10000);
        const orthoCam = new THREE.OrthographicCamera(-100, 100, 100, -100, -10000, 10000);
        let camera = perspCam;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.15;

        function alignCamera(x, y, z) {
            updateModelMaxDim();
            baseDistance = modelMaxDim > 0 ? modelMaxDim * 1.5 : 150;
            const pos = new THREE.Vector3(x, y, z).normalize().multiplyScalar(baseDistance);
            controls.target.set(0, 0, 0);
            
            if (isOrthographic) {
                orthoCam.position.copy(pos);
                orthoCam.zoom = 1;
            } else {
                perspCam.position.copy(pos);
            }
            updateCameraProjections();
            controls.update();
            updateZoomText();
        }

        // --- ZOOM PERCENTAGE & SAVED VIEWS ---
        const savedViews = [];
        
        function updateZoomText() {
            let zoomPct = 100;
            if (isOrthographic) {
                zoomPct = orthoCam.zoom * 100;
            } else {
                const dist = controls.target.distanceTo(perspCam.position);
                if (baseDistance > 0) zoomPct = (baseDistance / dist) * 100;
            }
            document.getElementById('zoom-text').innerText = Math.round(zoomPct) + '%';
        }

        controls.addEventListener('change', updateZoomText);

        document.getElementById('btn-save-zoom').addEventListener('click', () => {
            savedViews.push({
                isOrtho: isOrthographic,
                pos: camera.position.clone(),
                target: controls.target.clone(),
                zoom: orthoCam.zoom
            });
            renderSavedViews();
        });

        function renderSavedViews() {
            const cont = document.getElementById('saved-views-container');
            cont.innerHTML = '';
            savedViews.forEach((v, i) => {
                const btn = document.createElement('button');
                btn.className = 'ui-btn';
                btn.innerText = 'V' + (i + 1);
                btn.onclick = () => {
                    if (isOrthographic !== v.isOrtho) document.getElementById('btn-camera').click();
                    camera.position.copy(v.pos);
                    controls.target.copy(v.target);
                    if (isOrthographic) { orthoCam.zoom = v.zoom; updateCameraProjections(); }
                    controls.update();
                    updateZoomText();
                };
                cont.appendChild(btn);
            });
        }

        // --- TOOLBAR BINDINGS ---
        document.getElementById('btn-grid').addEventListener('click', (e) => {
            helpersGroup.visible = !helpersGroup.visible;
            e.target.classList.toggle('active', helpersGroup.visible);
        });

        let isXRay = false;
        document.getElementById('btn-xray').addEventListener('click', (e) => {
            isXRay = !isXRay;
            e.target.classList.toggle('active', isXRay);
            for (const key in fileObjects) {
                const mat = fileObjects[key].mesh.material;
                mat.transparent = isXRay;
                mat.opacity = isXRay ? 0.25 : 1.0;
                mat.depthWrite = !isXRay;
                mat.needsUpdate = true;
            }
        });

        let isAutoCenter = false; // Default: Origin CAD (Overlap correct measurements)
        document.getElementById('btn-origin').addEventListener('click', (e) => {
            isAutoCenter = !isAutoCenter;
            e.target.classList.toggle('active', !isAutoCenter);
            e.target.innerText = isAutoCenter ? "Center: Auto" : "Origin: CAD";
            updateGroupCenter();
        });

        const btnCamera = document.getElementById('btn-camera');
        btnCamera.addEventListener('click', () => {
            isOrthographic = !isOrthographic;
            if (isOrthographic) {
                const dist = controls.target.distanceTo(perspCam.position);
                const fov = perspCam.fov * (Math.PI / 180);
                const h = 2 * Math.tan(fov / 2) * dist;
                orthoCam.top = h / 2; orthoCam.bottom = h / -2;
                orthoCam.position.copy(perspCam.position);
                orthoCam.quaternion.copy(perspCam.quaternion);
                orthoCam.zoom = 1;
                camera = orthoCam;
                btnCamera.innerText = "Ortho";
                btnCamera.classList.add('active');
            } else {
                const dist = controls.target.distanceTo(orthoCam.position);
                const newDist = dist / orthoCam.zoom;
                const dir = new THREE.Vector3().subVectors(orthoCam.position, controls.target).normalize();
                perspCam.position.copy(controls.target).add(dir.multiplyScalar(newDist));
                perspCam.quaternion.copy(orthoCam.quaternion);
                camera = perspCam;
                btnCamera.innerText = "Persp";
                btnCamera.classList.remove('active');
            }
            controls.object = camera;
            updateCameraProjections();
            controls.update();
            updateZoomText();
        });

        document.getElementById('btn-view-x').addEventListener('click', () => alignCamera(1, 0, 0));
        document.getElementById('btn-view-y').addEventListener('click', () => alignCamera(0, -1, 0));
        document.getElementById('btn-view-z').addEventListener('click', () => alignCamera(0, 0, 1));
        document.getElementById('btn-view-iso').addEventListener('click', () => alignCamera(1, -1, 1));

        // --- RESPONSIVE CANVAS ---
        function updateCameraProjections() {
            const width = container.clientWidth;
            const height = container.clientHeight;
            if (width === 0 || height === 0) return;
            const aspect = width / height;
            
            if (isOrthographic) {
                const h = orthoCam.top - orthoCam.bottom;
                orthoCam.left = (h * aspect) / -2;
                orthoCam.right = (h * aspect) / 2;
                orthoCam.updateProjectionMatrix();
            } else {
                perspCam.aspect = aspect;
                perspCam.updateProjectionMatrix();
            }
        }

        function resizeCanvasToDisplaySize() {
            const width = container.clientWidth;
            const height = container.clientHeight;
            if (renderer.domElement.width !== width || renderer.domElement.height !== height) {
                renderer.setSize(width, height, false);
                updateCameraProjections();
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            resizeCanvasToDisplaySize(); // Smooth resize for collapsing sidebar
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // --- STL LOADER & OVERLAP LOGIC ---
        const loader = new STLLoader();
        const modelGroup = new THREE.Group();
        scene.add(modelGroup);
        
        const fileObjects = {}; 
        const activeFiles = new Set();

        function updateModelMaxDim() {
            const box = new THREE.Box3().setFromObject(modelGroup);
            if (!box.isEmpty()) {
                const size = new THREE.Vector3();
                box.getSize(size);
                modelMaxDim = Math.max(size.x, size.y, size.z, 10);
            }
        }

        function updateGroupCenter() {
            if (isAutoCenter) {
                const box = new THREE.Box3().setFromObject(modelGroup);
                if (!box.isEmpty()) {
                    const center = new THREE.Vector3();
                    box.getCenter(center);
                    modelGroup.position.set(-center.x, -center.y, -box.min.z);
                }
            } else {
                // Return to CAD Origin
                modelGroup.position.set(0, 0, 0);
            }
        }

        window.removeSTL = function(filename) {
            if (fileObjects[filename]) {
                modelGroup.remove(fileObjects[filename].mesh);
                modelGroup.remove(fileObjects[filename].edges);
                fileObjects[filename].mesh.geometry.dispose();
                fileObjects[filename].mesh.material.dispose();
                delete fileObjects[filename];
            }
            updateGroupCenter();
            if (activeFiles.size === 0) {
                emptyState.style.display = 'block';
                toolbar.style.display = 'none';
                zoomToolbar.style.display = 'none';
                hasInitiallyAligned = false; // Reset alignment rule
            }
        };

        window.loadSTL = function(filename, isReload = false) {
            emptyState.style.display = 'none';
            toolbar.style.display = 'flex';
            zoomToolbar.style.display = 'flex';
            overlay.textContent = 'Loading...';
            overlay.style.display = 'block';
            
            fetch('/preview/' + encodeURIComponent(filename) + '?t=' + Date.now())
                .then(res => {
                    if (!res.ok) throw new Error("Load failed.");
                    return res.arrayBuffer();
                })
                .then(buffer => {
                    const geometry = loader.parse(buffer);
                    
                    if (fileObjects[filename]) {
                        modelGroup.remove(fileObjects[filename].mesh);
                        modelGroup.remove(fileObjects[filename].edges);
                        fileObjects[filename].mesh.geometry.dispose();
                    }
                    
                    const material = new THREE.MeshStandardMaterial({ 
                        color: 0x98bce8, roughness: 0.6, metalness: 0.1,
                        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, side: THREE.DoubleSide,
                        transparent: isXRay, opacity: isXRay ? 0.25 : 1.0, depthWrite: !isXRay
                    });
                    
                    const mesh = new THREE.Mesh(geometry, material);
                    const edges = new THREE.EdgesGeometry(geometry, 20);
                    const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2, transparent: true, opacity: 0.6 }));
                    
                    fileObjects[filename] = { mesh, edges: edgeLines };
                    modelGroup.add(mesh);
                    modelGroup.add(edgeLines);
                    
                    updateGroupCenter();
                    
                    // Only Auto-Frame completely new setups. PRESERVE CAMERA ON RE-COMPILE!
                    if (!isReload && !hasInitiallyAligned) {
                        alignCamera(1, -1, 1);
                        hasInitiallyAligned = true; 
                    }

                    overlay.style.display = 'none';
                })
                .catch(err => {
                    overlay.textContent = 'Load / Compile Error!';
                    overlay.style.background = 'rgba(220, 53, 69, 0.9)';
                    setTimeout(() => { 
                        overlay.style.display = 'none'; 
                        overlay.style.background = 'rgba(0, 120, 215, 0.9)'; 
                    }, 3000);
                });
        };

        // --- SOCKET.IO FILE SYNC ---
        const socket = io();

        socket.on('files', (files) => {
            const ul = document.getElementById('file-list');
            ul.innerHTML = '';
            files.forEach(f => {
                const li = document.createElement('li');
                
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = activeFiles.has(f);
                cb.onclick = (e) => e.stopPropagation(); // prevent double toggle
                cb.onchange = () => {
                    if (cb.checked) {
                        activeFiles.add(f);
                        window.loadSTL(f, false);
                    } else {
                        activeFiles.delete(f);
                        window.removeSTL(f);
                    }
                };

                const span = document.createElement('span');
                span.innerText = f;
                
                li.appendChild(cb);
                li.appendChild(span);
                li.onclick = () => cb.click();
                
                ul.appendChild(li);
            });
        });

        socket.on('source_changed', () => {
            activeFiles.forEach(f => {
                window.loadSTL(f, true); 
            });
        });
    </script>
</body>
</html>`;
