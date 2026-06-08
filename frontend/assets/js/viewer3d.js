// ==================== 3D 建筑结构查看器 ====================
const wrap = document.getElementById('viewer3dContainer');
// 创建 canvas
const canvas = document.createElement('canvas');
canvas.style.display = 'block'; canvas.style.width = '100%'; canvas.style.height = '380px';
const loading = document.getElementById('viewer3dLoading');
if (loading) loading.remove();
wrap.appendChild(canvas);

const W = wrap.clientWidth || 700, H = 380;
canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W, H);
renderer.setClearColor(0x0d1117, 1);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0d1117, 40, 120);

const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
camera.position.set(18, 14, 22);
camera.lookAt(0, 5, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const sun = new THREE.DirectionalLight(0xffeedd, 1.1);
sun.position.set(20, 30, 20); sun.castShadow = true;
sun.shadow.mapSize.width = 1024; sun.shadow.mapSize.height = 1024;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x8bb8ff, 0.4);
fill.position.set(-15, 10, -10); scene.add(fill);

const groundGeo = new THREE.PlaneGeometry(80, 80);
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x1a2235, roughness: 0.9 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
scene.add(new THREE.GridHelper(40, 20, 0x1e2d45, 0x1e2d45));

// --- 结构动力学参数 ---
const bldParams = [
    { name: "砌体结构", color: 0xc9a87c, T: 0.2, xi: 0.05, ductility: 1.5, fy: 0.15 },
    { name: "RC框架", color: 0x5a7a96, T: 0.5, xi: 0.05, ductility: 4.0, fy: 0.2 },
    { name: "钢框架", color: 0x7a8fa0, T: 1.2, xi: 0.02, ductility: 6.0, fy: 0.12 },
    { name: "剪力墙", color: 0x6a7888, T: 0.3, xi: 0.06, ductility: 3.0, fy: 0.35 }
];

// --- 四种建筑模型 ---
function mkMasonry() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xc9a87c, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 6), mat);
    body.position.y = 5; body.castShadow = true; g.add(body);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x8a6040 });
    for (let r = 0; r < 5; r++) {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4, r * 2 + 1, -3.01), new THREE.Vector3(4, r * 2 + 1, -3.01)]);
        g.add(new THREE.Line(geo, lineMat));
    }
    const winMat = new THREE.MeshStandardMaterial({ color: 0x8fafe0, roughness: 0.3, metalness: 0.3 });
    [[-2, 7], [2, 7], [-2, 4], [2, 4]].forEach(([x, y]) => { const w = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), winMat); w.position.set(x, y, -3.1); g.add(w); });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x4a5a80, roughness: 0.5 }));
    door.position.set(0, 1.25, -3.1); g.add(door);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.5, 4), new THREE.MeshStandardMaterial({ color: 0x8a6040, roughness: 0.6 }));
    roof.position.y = 11.25; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    return g;
}

function mkRC() {
    const g = new THREE.Group();
    const colMat = new THREE.MeshStandardMaterial({ color: 0x607080, roughness: 0.5 });
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x506070, roughness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x8fafe0, roughness: 0.2, transparent: true, opacity: 0.45 });
    const cols = [[-3, -2], [3, -2], [-3, 2], [3, 2]];
    const floors = 4, fH = 3.5;
    cols.forEach(([x, z]) => { const col = new THREE.Mesh(new THREE.BoxGeometry(0.6, floors * fH, 0.6), colMat); col.position.set(x, floors * fH / 2, z); col.castShadow = true; g.add(col); });
    for (let f = 0; f < floors; f++) {
        const y = (f + 1) * fH;
        [[-3, 0], [3, 0], [0, -2], [0, 2]].forEach(([x, z]) => {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(z === 0 ? 7 : 0.5, 0.5, z === 0 ? 0.5 : 5), beamMat);
            beam.position.set(x, y, z); g.add(beam);
        });
        if (f < floors - 1) { const p = new THREE.Mesh(new THREE.BoxGeometry(5.8, fH - 0.5, 4.8), glassMat); p.position.set(0, y + fH / 2 - 0.25, 0); g.add(p); }
    }
    const slab = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 5.5), new THREE.MeshStandardMaterial({ color: 0x455565, roughness: 0.6 }));
    slab.position.y = floors * fH + 0.15; slab.castShadow = true; g.add(slab);
    return g;
}

function mkSteel() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x7a8fa0, roughness: 0.3, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x8fafe0, roughness: 0.2, transparent: true, opacity: 0.35 });
    const floors = 6, fH = 3;
    [[-3.5, -2.5], [3.5, -2.5], [-3.5, 2.5], [3.5, 2.5]].forEach(([x, z]) => { const col = new THREE.Mesh(new THREE.BoxGeometry(0.35, floors * fH, 0.35), mat); col.position.set(x, floors * fH / 2, z); col.castShadow = true; g.add(col); });
    for (let f = 0; f <= floors; f++) {
        const y = f * fH;
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.3, 0.3), mat); b1.position.set(0, y, -2.5); g.add(b1);
        const b2 = b1.clone(); b2.position.z = 2.5; g.add(b2);
        const xb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 5.5), mat); xb.position.set(-3.5, y, 0); g.add(xb);
        const xb2 = xb.clone(); xb2.position.x = 3.5; g.add(xb2);
    }
    for (let f = 0; f < floors; f++) { const p = new THREE.Mesh(new THREE.BoxGeometry(6.5, fH - 0.3, 4.5), glassMat); p.position.set(0, f * fH + fH / 2, 0); g.add(p); }
    return g;
}

function mkShear() {
    const g = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x6a7888, roughness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x8fafe0, roughness: 0.2, transparent: true, opacity: 0.4 });
    const floors = 5, fH = 3;
    const lw = new THREE.Mesh(new THREE.BoxGeometry(1.2, floors * fH, 5), wallMat); lw.position.set(-3.4, floors * fH / 2, 0); lw.castShadow = true; g.add(lw);
    const rw = lw.clone(); rw.position.x = 3.4; g.add(rw);
    const fw = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 5), new THREE.MeshStandardMaterial({ color: 0x5a6878, roughness: 0.6 })); fw.position.set(0, floors * fH, 0); fw.castShadow = true; g.add(fw);
    for (let f = 0; f < floors; f++) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.25, 5), new THREE.MeshStandardMaterial({ color: 0x5a6878, roughness: 0.6 })); slab.position.set(0, (f + 1) * fH, 0); g.add(slab);
        if (f < floors - 1) { const fill = new THREE.Mesh(new THREE.BoxGeometry(4.5, fH - 0.25, 4.5), glassMat); fill.position.set(0, f * fH + fH / 2, 0); g.add(fill); }
    }
    return g;
}

const builders = [mkMasonry, mkRC, mkSteel, mkShear];
let currentGroup = null, selB = 0, mag3d = 5.5;
let quakeAnim = false, quakeT = 0, quakeDur = 0, quakeAmp = 0, quakeFreq = 0;
let crackMeshes = [], dmgD = 0, crackAdded = false;

function pga(m) { return 0.025 * Math.pow(10, 0.65 * (m - 4)); }
function saCalc(m, T, xi) { const pg = pga(m), Tg = 0.6; let s = T < 0.1 ? pg * (1 + 9 * T) : T <= Tg ? pg * 2.5 : pg * 2.5 * (Tg / T); return s * (1 + (0.05 - xi) * 0.3 / xi); }
function calcD(m, b) { return Math.min(1, (saCalc(m, b.T, b.xi) / b.fy) / b.ductility); }

function updateDamageOverlay(D) {
    const labels = ["基本完好", "轻微破坏", "中等破坏", "严重破坏", "倒塌"];
    const colors = ["#6ee7b7", "#fcd34d", "#fb923c", "#f87171", "#ff4444"];
    const idx = D < 0.15 ? 0 : D < 0.35 ? 1 : D < 0.6 ? 2 : D < 0.85 ? 3 : 4;
    const b = bldParams[selB];
    const el = document.getElementById('dmgInfo');
    if (el) el.innerHTML = `${b.name}<br>Sa=${saCalc(mag3d,b.T,b.xi).toFixed(3)}g<br><span style="color:${colors[idx]}">${labels[idx]}(D=${D.toFixed(2)})</span>`;
}

function addCrack(D) {
    if (!currentGroup || D < 0.3) return;
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a0a00, transparent: true, opacity: Math.min(1, (D - 0.3) * 2.5) * 0.8 });
    for (let i = 0; i < Math.floor(D * 6); i++) {
        const geo = new THREE.BoxGeometry(0.08, 0.5 + Math.random() * 1.5, 0.05);
        const m = new THREE.Mesh(geo, mat); m.position.set((Math.random() - 0.5) * 6, Math.random() * 10 + 1, -3.1); m.rotation.z = (Math.random() - 0.5) * 0.8;
        currentGroup.add(m); crackMeshes.push(m);
    }
}

// --- 全局接口 ---
window.viewer3D = {
    switchBuilding(i, btn) {
        selB = i;
        document.querySelectorAll('.btn3d').forEach((b, j) => b.classList.toggle('active', j === i));
        if (currentGroup) { scene.remove(currentGroup); crackMeshes = []; }
        currentGroup = builders[i](); scene.add(currentGroup);
        quakeAnim = false; quakeT = 0; crackAdded = false; updateDamageOverlay(0);
    },
    setMag(v) { mag3d = parseFloat(v); document.getElementById('mag3dVal').textContent = v; },
    quake() {
        if (!currentGroup) return;
        const b = bldParams[selB]; dmgD = calcD(mag3d, b);
        quakeFreq = b.T < 0.5 ? 4 : b.T < 0.9 ? 2.5 : 1.5;
        quakeAmp = Math.min(3.5, dmgD * 4.5);
        quakeDur = 180; quakeT = 0; quakeAnim = true; crackAdded = false;
        crackMeshes.forEach(m => currentGroup.remove(m)); crackMeshes = [];
        updateDamageOverlay(dmgD);
    }
};

// --- 相机 ---
let isDrag = false, prevM = { x: 0, y: 0 }, theta = 0.8, phi = 0.6, radius = 28;
canvas.addEventListener('mousedown', e => { isDrag = true; prevM = { x: e.clientX, y: e.clientY }; });
window.addEventListener('mouseup', () => isDrag = false);
window.addEventListener('mousemove', e => {
    if (!isDrag) return;
    theta -= (e.clientX - prevM.x) * 0.008;
    phi = Math.max(0.2, Math.min(1.5, phi + (e.clientY - prevM.y) * 0.008));
    prevM = { x: e.clientX, y: e.clientY };
    updateCam();
});
canvas.addEventListener('wheel', e => { e.preventDefault(); radius = Math.max(10, Math.min(55, radius + e.deltaY * 0.04)); updateCam(); }, { passive: false });

function updateCam() {
    camera.position.set(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(phi), radius * Math.cos(theta) * Math.cos(phi));
    camera.lookAt(0, 5, 0);
}

// --- 渲染 ---
(function animate3d() {
    requestAnimationFrame(animate3d);
    if (quakeAnim && currentGroup) {
        quakeT++;
        const prog = quakeT / quakeDur;
        const env = prog < 0.1 ? prog / 0.1 : prog < 0.7 ? 1 : Math.exp(-5 * (prog - 0.7));
        const phase = Math.sin(quakeT * quakeFreq * 0.18) * quakeAmp * env;
        const vert = Math.sin(quakeT * quakeFreq * 0.28) * quakeAmp * 0.3 * env;
        currentGroup.position.x = phase;
        currentGroup.position.y = Math.max(0, vert);
        currentGroup.rotation.z = -phase * 0.018;
        if (prog > 0.4 && !crackAdded) { addCrack(dmgD); crackAdded = true; }
        if (quakeT >= quakeDur) { quakeAnim = false; quakeT = 0; crackAdded = false; currentGroup.position.set(0, 0, 0); currentGroup.rotation.z = 0; }
    }
    renderer.render(scene, camera);
})();

// 启动
window.viewer3D.switchBuilding(0, document.querySelector('.btn3d'));
updateCam();
console.log('🧊 3D 查看器已就绪 ⚡震动版');
