// Data Configuration
const PAGES = [
    "1.png", "2.png", "3.png", "4.png", "5.png",
    "6.png", "7.png", "8.png", "9.png", "10.png",
    "11 toma de decision.png"
];
const ENDING_1 = "final 1.png";
const ENDING_2 = "final 2.png";

// SUPABASE CONFIGURATION
const SU = "https://cdqjwrfboxsdayzdqnqz.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcWp3cmZib3hzZGF5emRxbnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ1NjAsImV4cCI6MjA4MTM5MDU2MH0.cnu1mr6MwlEiKcufwRzzoFzSSYmsHfa_X6FyxZbtsAU";

let supabase;
try {
    if (!window.supabase) throw new Error("Librería Supabase no cargada");
    supabase = window.supabase.createClient(SU, SK);
    console.log("Supabase Client Initialized");
} catch (e) {
    console.error(e);
    alert("Error Crítico: No se pudo cargar la librería de Supabase. Revisa tu conexión.");
}

// State
let users = [];
let currentUser = null;

// DOM Elements
const overlayScreen = document.getElementById('overlay-screen');
const authBox = document.getElementById('auth-box');
const plotBox = document.getElementById('plot-box');
const userSelect = document.getElementById('user-select');
const newUserInput = document.getElementById('new-user-name');
// const mangaImg = document.getElementById('manga-page'); // Replaced
const pageFront = document.getElementById('page-front');
const pageBack = document.getElementById('page-back');
const bookStage = document.getElementById('book-stage');

const decisionOverlay = document.getElementById('decision-overlay');
const pageIndicator = document.getElementById('page-indicator');

// Initialization
async function init() {
    await loadUsers();
    renderUserSelect();
}

async function loadUsers() {
    userSelect.innerHTML = '<option>Cargando de la nube...</option>';

    // Fetch from Supabase
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('lastPage', { ascending: false });

    if (error) {
        console.error("Error loading users:", error);
        alert("Error de conexión con la base de datos.");
        users = [];
    } else {
        users = data || [];
    }
}

// Deprecated: Local Save. Now we use Upsert/Update on events.
async function saveProgress() {
    if (!currentUser) return;

    // Update DB
    const { error } = await supabase
        .from('users')
        .update({
            lastPage: currentUser.lastPage,
            currentPath: currentUser.currentPath
        })
        .eq('id', currentUser.id);

    if (error) console.error("Error saving progress:", error);
}

function renderUserSelect() {
    userSelect.innerHTML = '<option value="">-- Seleccionar Usuario --</option>';
    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.name} (Pág. ${u.lastPage})`;
        userSelect.appendChild(opt);
    });
}

// UI Handlers
window.handleLogin = () => {
    const userId = userSelect.value; // ID is text/uuid from DB now
    if (!userId) return alert("Por favor selecciona un usuario");

    currentUser = users.find(u => u.id == userId); // Weak check for string/int mismatch safety
    startReading();
};

window.showCreateUser = () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('create-form').style.display = 'block';
};

window.cancelCreate = () => {
    document.getElementById('create-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
};

window.createUser = async () => {
    const name = newUserInput.value.trim();
    if (!name) return alert("El nombre no puede estar vacío");

    // Insert into DB
    const newUserPayload = {
        name: name,
        lastPage: 1,
        currentPath: 'neutral'
    };

    const { data, error } = await supabase
        .from('users')
        .insert([newUserPayload])
        .select();

    if (error) {
        console.error("Error creating user:", error);
        alert("Error al crear usuario. Intenta otro nombre.");
        return;
    }

    const newUser = data[0];
    users.push(newUser);

    // Switch to Plot View for new user
    currentUser = newUser;
    authBox.classList.add('hidden');
    plotBox.classList.remove('hidden');
};

window.startAfterPlot = () => {
    overlayScreen.classList.add('hidden');
    loadPage(1); // New users always start at 1
};

// Helper to set image
function setPageImage(el, src) {
    if (!src) {
        el.style.backgroundImage = 'none';
        return;
    }
    // Encode the filename to handle spaces in URL
    el.style.backgroundImage = `url('${encodeURI(src)}')`;
    // Store raw src for logic checks
    el.dataset.src = src;
}

function getPageSrc(el) {
    return el.dataset.src || "";
}

function startReading() {
    overlayScreen.classList.add('hidden');
    setPageImage(pageBack, ''); // Clear back page on start
    loadPage(currentUser.lastPage);
}

// Navigation Logic
let isAnimating = false;

function loadPage(pageIndex, direction = 'none') {
    if (isAnimating) return;

    if (pageIndex < 1) pageIndex = 1;

    // ... Ending checks similar ...
    if (pageIndex > PAGES.length) {
        // If we really are past the ending (user clicked Next ON the ending)
        if (pageIndex > PAGES.length + 1) {
            if (currentUser.currentPath === 'ending2') {
                showPostEndingScreen(CHAPTER_2_TEXT);
            } else if (currentUser.currentPath === 'ending1') {
                showPostEndingScreen(BAD_ENDING_TEXT);
            } else {
                // Stay on ending for other paths (fallback)
                currentUser.lastPage = PAGES.length + 1;
                loadPage(PAGES.length + 1);
            }
            return;
        }

        if (currentUser.currentPath === 'ending1') {
            displayEnding(ENDING_1);
            return;
        } else if (currentUser.currentPath === 'ending2') {
            displayEnding(ENDING_2);
            return;
        } else {
            pageIndex = PAGES.length;
        }
    }

    const nextSrc = PAGES[pageIndex - 1];
    if (!nextSrc) return; // safety

    if (direction === 'next' || direction === 'prev') {
        // GLITCH TRANSITION
        isAnimating = true;

        // 1. Play Glitch Sound? (Optional future)
        // 2. Add Glitch Class to Front Page
        pageFront.classList.add('glitch-active');

        // 3. Wait for "fail" peak (approx 200ms)
        setTimeout(() => {
            // 4. Swap Source while glitched
            setPageImage(pageFront, nextSrc);
        }, 200);

        // 5. End Glitch and Cleanup
        setTimeout(() => {
            pageFront.classList.remove('glitch-active');
            isAnimating = false;
            postLoadCheck(nextSrc, pageIndex);
        }, 500); // 0.5s total duration

    } else {
        // No animation (initial)
        setPageImage(pageFront, nextSrc);
        postLoadCheck(nextSrc, pageIndex);
    }
}

function postLoadCheck(src, idx) {
    updateState(idx, src.includes("decision"));
}


window.updateState = function (pageIndex, isDecision) {
    currentUser.lastPage = pageIndex;
    updateIndicator(pageIndex);
    saveProgress();

    if (!document.getElementById('decision-trigger').classList.contains('active-phase')) {
        decisionOverlay.classList.remove('active');
        pageFront.classList.remove('blurred-context'); // Apply blur to front page
        document.getElementById('reader-container').classList.remove('decision-mode');
    }
};

window.triggerDecisionPhase = () => {
    // Visual focus
    pageFront.classList.add('blurred-context');
    document.getElementById('reader-container').classList.add('decision-mode');

    // Show Overlay
    decisionOverlay.classList.add('active');
    document.getElementById('decision-trigger').style.display = 'block';
    document.getElementById('decision-choices').style.display = 'none';

    document.getElementById('decision-trigger').classList.add('active-phase');
};

window.revealDecision = () => {
    document.getElementById('decision-trigger').style.display = 'none';
    document.getElementById('decision-choices').style.display = 'block';
};

window.displayEnding = function (imgSrc) {
    setPageImage(pageFront, imgSrc);
    decisionOverlay.classList.remove('active');
    pageFront.classList.remove('blurred-context');
    document.getElementById('reader-container').classList.remove('decision-mode');
    document.getElementById('decision-trigger').classList.remove('active-phase');

    updateIndicator("FIN");
};

function updateIndicator(text) {
    pageIndicator.innerText = `Página: ${text}`;
}

function updateIndicator(text) {
    pageIndicator.innerText = `Página: ${text}`;
}

// Embedded to avoid CORS/Fetch errors on local file:// protocol
const CHAPTER_2_TEXT = `
S-ØMBRA: CAPÍTULO 2 - CONSECUENCIAS<br><br>
Tras los eventos en el subsuelo, Kael ya no es el mismo. La decisión ha sido tomada, pero el precio a pagar apenas comienza a revelarse.<br><br>
Los "Purificadores" han marcado su firma biológica. No hay refugio en la Antigua Metrópolis.<br>
La única salida es cruzar el Mar de Óxido, una tierra de nadie donde las leyes de la corporación no alcanzan... y donde horrores peores que la muerte aguardan.<br><br>
"La libertad es un desierto. La sintonía es una jaula."<br><br>
PRÓXIMAMENTE.
`;

const BAD_ENDING_TEXT = `
S-ØMBRA: ASIMILACIÓN COMPLETADA<br><br>
Sujeto integrado exitosamente en la Red Neural Central.<br>
Individualidad: <span style="color:red">ELIMINADA</span><br>
Conciencia: <span style="color:red">ARCHIVADA</span><br>
Voluntad: <span style="color:red">NULL</span><br><br>
"No hay dolor en la unidad. No hay duda en el código."<br><br>
FIN DE LA TRANSMISIÓN.
`;

window.showPostEndingScreen = (contentHtml) => {
    overlayScreen.classList.remove('hidden');
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('plot-box').classList.add('hidden');

    // Using the generic "chapter2-box" container for all endings now (could rename ID in HTML but keeping for simplicity)
    const container = document.getElementById('chapter2-box');
    const contentArea = document.getElementById('chapter2-text');
    const title = container.querySelector('h1');

    container.classList.remove('hidden');
    startMatrix(); // Bring back the cool background

    // Update Title based on content? Or just keep generic.
    // Let's deduce title from context if needed, but for now generic box style works.
    if (contentHtml === BAD_ENDING_TEXT) {
        title.innerText = "SISTEMA";
        title.style.color = "red";
    } else {
        title.innerText = "CAPÍTULO 2";
        title.style.color = "var(--accent-color)";
    }

    // Use embedded text
    contentArea.innerHTML = contentHtml;
};

// Reader Actions
// RTL: Left Click/Arrow = NEXT Page. Right Click/Arrow = PREV Page.
window.nextPage = () => {
    const currentSrc = getPageSrc(pageFront);
    if (currentSrc.includes("decision") && currentUser.currentPath === 'neutral') {
        window.triggerDecisionPhase();
        return;
    }

    // if (currentUser.currentPath !== 'neutral') return; // Allow navigation to trigger Chapter 2 logic // Removed to allow post-ending navigation (Chapter 2)

    let next = currentUser.lastPage + 1;
    loadPage(next, 'next');
};

window.prevPage = () => {
    if (currentUser.currentPath !== 'neutral') {
        currentUser.currentPath = 'neutral';
        currentUser.lastPage = PAGES.length;
        loadPage(currentUser.lastPage); // No specific animation for reset
        return;
    }

    let prev = currentUser.lastPage - 1;
    if (prev < 1) prev = 1;

    if (prev !== currentUser.lastPage) {
        loadPage(prev, 'prev'); // Direction 'prev'
    }
};


// Branching
window.choosePath = (path) => {
    if (path === 1) {
        currentUser.currentPath = 'ending1';
        displayEnding(ENDING_1);
    } else {
        currentUser.currentPath = 'ending2';
        displayEnding(ENDING_2);
    }
    currentUser.lastPage = PAGES.length + 1; // Mark as completed essentially
    saveProgress();
};

window.resetProgress = () => {
    if (!confirm("¿Borrar progreso de este usuario?")) return;
    currentUser.lastPage = 1;
    currentUser.currentPath = 'neutral';
    saveProgress();
    loadPage(1);
};

window.logout = () => {
    currentUser = null;
    location.reload();
};

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (!overlayScreen.classList.contains('hidden')) return;

    if (e.key === 'ArrowLeft') {
        window.nextPage(); // RTL
    } else if (e.key === 'ArrowRight') {
        window.prevPage(); // RTL
    }
});

// Run Init
init();

// --- MATRIX RAIN EFFECT ---
const canvas = document.getElementById('matrix-rain');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Re-size canvas on window resize
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

const cols = Math.floor(width / 20) + 1;
const ypos = Array(cols).fill(0);

let matrixInterval;

function matrix() {
    // Semi-transparent black to create trailing effect
    ctx.fillStyle = '#0001';
    ctx.fillRect(0, 0, width, height);

    // Set text color and font
    ctx.fillStyle = '#ff0000'; // Brighter Red
    ctx.shadowBlur = 8; // Glow effect
    ctx.shadowColor = 'red';
    ctx.font = '18pt monospace'; // Larger font

    ypos.forEach((y, ind) => {
        // Generate random character
        const text = String.fromCharCode(Math.random() * 128);
        const x = ind * 20;

        ctx.fillText(text, x, y);

        // Reset drop randomly if it passes height
        if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
        else ypos[ind] = y + 20;
    });
}

function startMatrix() {
    if (matrixInterval) return;
    canvas.style.display = 'block';
    matrixInterval = setInterval(matrix, 50);
}

function stopMatrix() {
    clearInterval(matrixInterval);
    matrixInterval = null;
    canvas.style.display = 'none';
}

// Run matrix animation initially
startMatrix();
