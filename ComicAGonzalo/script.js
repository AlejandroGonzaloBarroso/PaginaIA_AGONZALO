// CONFIGURACIÓN DE PÁGINAS E IMÁGENES
const PAGES = [
    "1.png", "2.png", "3.png", "4.png", "5.png",
    "6.png", "7.png", "8.png", "9.png", "10.png",
    "11 toma de decision.png"
];
const ENDING_1 = "final 1.png";
const ENDING_2 = "final 2.png";

// TUS CREDENCIALES
const SU = "https://cdqjwrfboxsdayzdqnqz.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcWp3cmZib3hzZGF5emRxbnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ1NjAsImV4cCI6MjA4MTM5MDU2MH0.cnu1mr6MwlEiKcufwRzzoFzSSYmsHfa_X6FyxZbtsAU";

// ESTADO (Renombrado para evitar conflictos)
let dbClient = null; 
let users = [];
let currentUser = null;
let isOffline = false;

// ---------------------------------------------------------
// 1. SISTEMA DE ARRANQUE "A PRUEBA DE FALLOS"
// ---------------------------------------------------------

async function initApp() {
    console.log("Iniciando S-ØMBRA...");
    const sel = document.getElementById('user-select');
    if(sel) sel.innerHTML = '<option>Conectando...</option>';

    // TEMPORIZADOR DE EMERGENCIA (El "Martillo")
    const safetyTimer = setTimeout(() => {
        if (!dbClient || users.length === 0) {
            console.warn("Tiempo de espera agotado. Forzando modo Offline.");
            activateOfflineMode("Tiempo de espera agotado");
        }
    }, 4000);

    try {
        // 1. Intentar cargar librería
        if (!window.supabase) {
            await waitForLib();
        }

        // 2. Conectar cliente (FIX: Sin persistencia para evitar bloqueo de Tracking)
        dbClient = window.supabase.createClient(SU, SK, {
            auth: {
                persistSession: false, // IMPORTANTE: Evita errores de localStorage/cookies
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        // 3. Descargar usuarios
        const { data, error } = await dbClient
            .from('users')
            .select('*')
            .order('lastPage', { ascending: false });

        if (error) throw error;

        // Si llegamos aquí, todo ha ido bien
        clearTimeout(safetyTimer);
        users = data || [];
        renderUserList();

    } catch (err) {
        console.error("Fallo en conexión:", err);
        clearTimeout(safetyTimer);
        activateOfflineMode(err.message || "Error de red");
    }
}

function waitForLib() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.supabase) {
                clearInterval(interval);
                resolve();
            }
            if (attempts > 20) { 
                clearInterval(interval);
                reject(new Error("Librería bloqueada o no cargada"));
            }
        }, 100);
    });
}

function activateOfflineMode(reason) {
    isOffline = true;
    const sel = document.getElementById('user-select');
    sel.innerHTML = `<option value="">⚠️ OFFLINE: ${reason}</option>`;
    
    const btnCreate = document.querySelector("#login-form button.secondary");
    if(btnCreate) {
        btnCreate.innerText = "Crear Usuario Local";
        btnCreate.style.border = "1px solid red";
    }
    
    // No bloqueamos con alert, solo mostramos en UI
    console.warn("Modo offline activo: " + reason);
}

function renderUserList() {
    const sel = document.getElementById('user-select');
    sel.innerHTML = '<option value="">-- Selecciona Usuario --</option>';

    if (users.length === 0) {
        const opt = document.createElement('option');
        opt.text = "Sin usuarios (Crea uno nuevo)";
        opt.disabled = true;
        sel.appendChild(opt);
    } else {
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.name} (Pág. ${u.lastPage})`;
            sel.appendChild(opt);
        });
    }
}

// ---------------------------------------------------------
// 2. FUNCIONES DE USUARIO (UI)
// ---------------------------------------------------------

window.showCreateUser = () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('create-form').style.display = 'block';
};

window.cancelCreate = () => {
    document.getElementById('create-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
};

window.handleLogin = () => {
    const sel = document.getElementById('user-select');
    const userId = sel.value;

    if (!userId || userId.startsWith("⚠️")) {
        if (isOffline) return alert("En modo offline debes crear un usuario nuevo.");
        if (users.length === 0) return alert("No hay usuarios. Crea uno nuevo.");
        return alert("Selecciona un usuario válido.");
    }

    currentUser = users.find(u => u.id == userId);
    if (currentUser) startReading();
};

window.createUser = async () => {
    const nameInput = document.getElementById('new-user-name');
    const name = nameInput.value.trim();
    if (!name) return alert("Pon un nombre.");

    // MODO OFFLINE / LOCAL
    if (isOffline || !dbClient) {
        const tempUser = { 
            id: 'local-' + Date.now(), 
            name: name + " (Local)", 
            lastPage: 1, 
            currentPath: 'neutral' 
        };
        users.push(tempUser);
        currentUser = tempUser;
        startReadingAfterAuth();
        return;
    }

    // MODO ONLINE
    try {
        const { data, error } = await dbClient
            .from('users')
            .insert([{ name: name, lastPage: 1, currentPath: 'neutral' }])
            .select();

        if (error) throw error;

        const newUser = data[0];
        users.push(newUser);
        currentUser = newUser;
        startReadingAfterAuth();

    } catch (e) {
        alert("Error creando usuario online: " + e.message + "\nSe creará en modo local.");
        activateOfflineMode("Error al guardar");
        // Reintentamos en local recursivamente pero forzando offline
        isOffline = true;
        window.createUser(); 
    }
};

function startReadingAfterAuth() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('plot-box').classList.remove('hidden');
}

window.startAfterPlot = () => {
    document.getElementById('overlay-screen').classList.add('hidden');
    loadPage(1); 
};

// ---------------------------------------------------------
// 3. LÓGICA DE LECTURA (CORE)
// ---------------------------------------------------------

function startReading() {
    document.getElementById('overlay-screen').classList.add('hidden');
    setPageImage(document.getElementById('page-back'), ''); 
    loadPage(currentUser.lastPage);
}

function setPageImage(el, src) {
    el.style.backgroundImage = src ? `url('${encodeURI(src)}')` : 'none';
    el.dataset.src = src || "";
}

function getPageSrc(el) { return el.dataset.src || ""; }

let isAnimating = false;

// Textos Finales
const CHAPTER_2_TEXT = `S-ØMBRA: CAPÍTULO 2 - CONSECUENCIAS<br><br>Próximamente.`;
const BAD_ENDING_TEXT = `S-ØMBRA: ASIMILACIÓN COMPLETADA<br><br>FIN DE LA TRANSMISIÓN.`;

function loadPage(pageIndex, direction = 'none') {
    if (isAnimating) return;
    if (pageIndex < 1) pageIndex = 1;
    
    const pageFront = document.getElementById('page-front');

    // Gestión de Finales
    if (pageIndex > PAGES.length) {
        if (pageIndex > PAGES.length + 1) {
            // Post-Final
            if (currentUser.currentPath === 'ending2') showPostEndingScreen(CHAPTER_2_TEXT);
            else if (currentUser.currentPath === 'ending1') showPostEndingScreen(BAD_ENDING_TEXT);
            else { currentUser.lastPage = PAGES.length + 1; loadPage(PAGES.length + 1); }
            return;
        }
        // Pantalla de Final
        if (currentUser.currentPath === 'ending1') displayEnding(ENDING_1);
        else if (currentUser.currentPath === 'ending2') displayEnding(ENDING_2);
        else pageIndex = PAGES.length;
    }

    const nextSrc = PAGES[pageIndex - 1];
    if(!nextSrc) return;

    if (direction === 'next' || direction === 'prev') {
        isAnimating = true;
        pageFront.classList.add('glitch-active');
        setTimeout(() => setPageImage(pageFront, nextSrc), 200);
        setTimeout(() => {
            pageFront.classList.remove('glitch-active');
            isAnimating = false;
            updateState(pageIndex, nextSrc.includes("decision"));
        }, 500); 
    } else {
        setPageImage(pageFront, nextSrc);
        updateState(pageIndex, nextSrc.includes("decision"));
    }
}

function updateState(idx, isDecision) {
    currentUser.lastPage = idx;
    const ind = document.getElementById('page-indicator');
    if(ind) ind.innerText = `Página: ${idx}`;
    saveProgress();
    
    const decTrigger = document.getElementById('decision-trigger');
    if (!isDecision && decTrigger && !decTrigger.classList.contains('active-phase')) {
        document.getElementById('decision-overlay').classList.remove('active');
        document.getElementById('page-front').classList.remove('blurred-context');
        document.getElementById('reader-container').classList.remove('decision-mode');
    }
}

async function saveProgress() {
    if (!currentUser || !dbClient || isOffline) return;
    if (typeof currentUser.id === 'string' && currentUser.id.startsWith('local')) return;

    try {
        await dbClient.from('users').update({ 
            lastPage: currentUser.lastPage, 
            currentPath: currentUser.currentPath 
        }).eq('id', currentUser.id);
    } catch (e) { console.warn("No se pudo guardar progreso en nube"); }
}

// ---------------------------------------------------------
// 4. CONTROLADORES (CLICK / TECLADO)
// ---------------------------------------------------------

window.nextPage = () => {
    const src = getPageSrc(document.getElementById('page-front'));
    if (src.includes("decision") && currentUser.currentPath === 'neutral') {
        triggerDecisionPhase();
        return;
    }
    loadPage(currentUser.lastPage + 1, 'next');
};

window.prevPage = () => { 
    if (currentUser.lastPage > 1) loadPage(currentUser.lastPage - 1, 'prev'); 
};

function triggerDecisionPhase() {
    document.getElementById('page-front').classList.add('blurred-context');
    document.getElementById('reader-container').classList.add('decision-mode');
    document.getElementById('decision-overlay').classList.add('active');
    document.getElementById('decision-trigger').style.display = 'block';
    document.getElementById('decision-choices').style.display = 'none';
    document.getElementById('decision-trigger').classList.add('active-phase');
}

window.revealDecision = () => {
    document.getElementById('decision-trigger').style.display = 'none';
    document.getElementById('decision-choices').style.display = 'block';
};

window.choosePath = (path) => {
    currentUser.currentPath = path === 1 ? 'ending1' : 'ending2';
    const finalImg = path === 1 ? ENDING_1 : ENDING_2;
    displayEnding(finalImg);
    currentUser.lastPage = PAGES.length + 1;
    saveProgress();
};

function displayEnding(img) {
    setPageImage(document.getElementById('page-front'), img);
    document.getElementById('decision-overlay').classList.remove('active');
    document.getElementById('page-front').classList.remove('blurred-context');
    document.getElementById('reader-container').classList.remove('decision-mode');
    document.getElementById('decision-trigger').classList.remove('active-phase');
    document.getElementById('page-indicator').innerText = "FIN";
}

window.showPostEndingScreen = (html) => {
    document.getElementById('overlay-screen').classList.remove('hidden');
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('plot-box').classList.add('hidden');
    document.getElementById('chapter2-box').classList.remove('hidden');
    document.getElementById('chapter2-text').innerHTML = html;
    startMatrix();
};

window.resetProgress = () => {
    if (confirm("¿Reiniciar capítulo?")) {
        currentUser.lastPage = 1; 
        currentUser.currentPath = 'neutral';
        saveProgress();
        loadPage(1);
    }
};

window.logout = () => location.reload();

// Matrix Effect
const cvs = document.getElementById('matrix-rain');
if (cvs) {
    const ctx = cvs.getContext('2d');
    let w = cvs.width = window.innerWidth, h = cvs.height = window.innerHeight;
    const cols = Math.floor(w/20)+1, ypos = Array(cols).fill(0);
    window.startMatrix = () => setInterval(() => {
        ctx.fillStyle='#0001'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle='#f00'; ctx.font='18pt monospace';
        ypos.forEach((y,i)=>{
            ctx.fillText(String.fromCharCode(Math.random()*128), i*20, y);
            ypos[i] = y>100+Math.random()*1e4 ? 0 : y+20;
        });
    }, 50);
    window.startMatrix();
} else { window.startMatrix = () => {}; }

// INICIAR AL CARGAR
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}