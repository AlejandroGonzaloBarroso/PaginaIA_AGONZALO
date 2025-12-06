// Authentication with Supabase REST API for DocViewer Pro
// No SDK required - works perfectly on GitHub Pages

// ========== CONFIGURATION ==========

const SUPABASE_URL = 'https://hamiezabntlxxovdvvtw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbWllemFibnRseHhvdmR2dnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTMwNDgsImV4cCI6MjA4MDQyOTA0OH0.ZAMg2w1u5t_9uxN-O2WCO0utPpPpdfLHk6Vd9N27Lxk';

// ========== AUTHENTICATION STATE ==========

let currentUser = null;
let accessToken = null;
let isGuestMode = false;

// ========== SUPABASE REST API FUNCTIONS ==========

async function supabaseSignUp(email, password, username) {
    console.log('Attempting signup for:', email);
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                data: { username }
            })
        });

        const data = await response.json();
        console.log('Signup response:', data);
        return data;
    } catch (error) {
        console.error('Network error during signup:', error);
        return { error: { message: 'Network error: ' + error.message } };
    }
}

async function supabaseSignIn(email, password) {
    console.log('Attempting login for:', email);
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Login response:', data);
        return data;
    } catch (error) {
        console.error('Network error during login:', error);
        return { error: { message: 'Network error: ' + error.message } };
    }
}

async function supabaseSignOut() {
    if (!accessToken) return;

    const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    return response.ok;
}

async function supabaseGetUser() {
    if (!accessToken) return null;

    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (response.ok) {
        return await response.json();
    }
    return null;
}

// ========== UI FUNCTIONS ==========

function showAuth() {
    document.getElementById('authOverlay').style.display = 'flex';
    const header = document.querySelector('.header');
    const mainContainer = document.querySelector('.main-container');
    if (header) header.style.display = 'none';
    if (mainContainer) mainContainer.style.display = 'none';
}

function showApp() {
    const authOverlay = document.getElementById('authOverlay');
    const header = document.querySelector('.header');
    const mainContainer = document.querySelector('.main-container');

    if (authOverlay) authOverlay.style.display = 'none';
    else console.error('Auth overlay not found');

    if (header) header.style.display = 'flex';
    else console.error('Header not found');

    if (mainContainer) mainContainer.style.display = 'flex';
    else console.error('Main container not found');

    updateUserProfile();
}

function updateUserProfile() {
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (userProfile && userName && userAvatar) {
        userProfile.style.display = 'flex';

        if (isGuestMode) {
            userName.textContent = 'Invitado';
            userAvatar.textContent = '👁';
            userAvatar.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))';
        } else if (currentUser) {
            userName.textContent = currentUser.username;
            userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
            userAvatar.style.background = '';
        }
    }

    // Disable editing features in guest mode
    if (isGuestMode) {
        disableEditingFeatures();
    }
}

function disableEditingFeatures() {
    // Hide editor toolbar
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) toolbar.style.display = 'none';

    // Hide editor tab
    const editorTab = document.getElementById('editorTab');
    if (editorTab) editorTab.style.display = 'none';

    // Force preview view
    const previewTab = document.getElementById('previewTab');
    if (previewTab) {
        previewTab.click();
        // Remove pointer events to prevent switching back if somehow visible
        previewTab.style.pointerEvents = 'none';
    }

    // Disable save and download buttons (hide them)
    const saveBtn = document.getElementById('saveBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    if (saveBtn) saveBtn.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';

    // Ensure upload button is visible and active
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.style.opacity = '1';
        uploadBtn.style.cursor = 'pointer';
        uploadBtn.title = 'Subir Archivos';
        uploadBtn.style.display = 'inline-flex';
    }

    // Make editor read-only (just in case)
    if (typeof editor !== 'undefined' && editor) {
        editor.updateOptions({ readOnly: true });
    }
}

function showAuthError(message) {
    const errorEl = document.getElementById('authError');
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 5000);
}

function showAuthSuccess(message) {
    const successEl = document.getElementById('authSuccess');
    successEl.textContent = message;
    successEl.classList.add('show');
    setTimeout(() => successEl.classList.remove('show'), 3000);
}

function hideAuthMessages() {
    document.getElementById('authError').classList.remove('show');
    document.getElementById('authSuccess').classList.remove('show');
}

// ========== AUTHENTICATION LOGIC ==========

async function checkAuth() {
    // Check for stored token
    const storedToken = localStorage.getItem('supabase_token');
    const storedUser = localStorage.getItem('supabase_user');

    if (storedToken && storedUser) {
        accessToken = storedToken;
        currentUser = JSON.parse(storedUser);

        // Verify token is still valid
        const user = await supabaseGetUser();
        if (user) {
            showApp();
            return true;
        } else {
            // Token expired, clear storage
            localStorage.removeItem('supabase_token');
            localStorage.removeItem('supabase_user');
        }
    }

    showAuth();
    return false;
}

function saveSession(token, user) {
    accessToken = token;
    currentUser = user;
    localStorage.setItem('supabase_token', token);
    localStorage.setItem('supabase_user', JSON.stringify(user));
}

function clearSession() {
    accessToken = null;
    currentUser = null;
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_user');
}

// ========== EVENT HANDLERS ==========

function initAuth() {
    // Switch between login and register tabs
    document.getElementById('loginTabBtn').addEventListener('click', () => {
        document.getElementById('loginTabBtn').classList.add('active');
        document.getElementById('registerTabBtn').classList.remove('active');
        document.getElementById('loginForm').style.display = 'flex';
        document.getElementById('registerForm').style.display = 'none';
        hideAuthMessages();
    });

    document.getElementById('registerTabBtn').addEventListener('click', () => {
        document.getElementById('registerTabBtn').classList.add('active');
        document.getElementById('loginTabBtn').classList.remove('active');
        document.getElementById('registerForm').style.display = 'flex';
        document.getElementById('loginForm').style.display = 'none';
        hideAuthMessages();
    });

    // Password strength indicator
    document.getElementById('registerPassword').addEventListener('input', (e) => {
        const password = e.target.value;
        const strengthBar = document.getElementById('passwordStrengthBar');

        if (password.length === 0) {
            strengthBar.className = 'password-strength-bar';
            return;
        }

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 1) {
            strengthBar.className = 'password-strength-bar weak';
        } else if (strength <= 3) {
            strengthBar.className = 'password-strength-bar medium';
        } else {
            strengthBar.className = 'password-strength-bar strong';
        }
    });

    // Handle login
    // Handle login (Delegated)
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'loginForm') {
            e.preventDefault();
            console.log('Login form submitted');
            hideAuthMessages();

            const emailInput = document.getElementById('loginUsername');
            const passwordInput = document.getElementById('loginPassword');

            if (!emailInput || !passwordInput) {
                console.error('Login inputs not found');
                return;
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                showAuthError('Por favor completa todos los campos');
                return;
            }

            try {
                const data = await supabaseSignIn(email, password);

                // Handle various Supabase error formats
                if (data.error || data.code) {
                    const msg = data.error_description || data.msg || (typeof data.error === 'string' ? data.error : data.error.message) || 'Error al iniciar sesión';
                    console.error('Login failed:', msg);
                    showAuthError(msg);
                    return;
                }

                if (data.access_token) {
                    const user = {
                        id: data.user.id,
                        email: data.user.email,
                        username: data.user.user_metadata?.username || data.user.email.split('@')[0]
                    };

                    saveSession(data.access_token, user);

                    showAuthSuccess('¡Inicio de sesión exitoso!');
                    setTimeout(() => {
                        showApp();
                        if (typeof showToast === 'function') {
                            showToast(`Bienvenido, ${user.username}!`, 'success');
                        }
                    }, 1000);
                }
            } catch (err) {
                console.error('Error durante login:', err);
                showAuthError('Error al conectar con el servidor');
            }
        }
    });

    // Handle registration
    // Handle registration (Delegated)
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'registerForm') {
            e.preventDefault();
            console.log('Register form submitted');
            hideAuthMessages();

            const username = document.getElementById('registerUsername').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

            // Validation
            if (!username || !email || !password || !passwordConfirm) {
                showAuthError('Por favor completa todos los campos');
                return;
            }

            if (username.length < 3) {
                showAuthError('El nombre de usuario debe tener al menos 3 caracteres');
                return;
            }

            if (password.length < 6) {
                showAuthError('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            if (password !== passwordConfirm) {
                showAuthError('Las contraseñas no coinciden');
                return;
            }

            try {
                const data = await supabaseSignUp(email, password, username);

                // Handle various Supabase error formats
                if (data.error || data.code || data.msg || data.error_description) {
                    const msg = data.error_description || data.msg || (typeof data.error === 'string' ? data.error : (data.error?.message)) || 'Error al registrar usuario';
                    console.error('Registration failed:', msg);
                    showAuthError(msg);
                    return;
                }

                // Check if user ID exists (successful registration)
                if (!data.id && !data.user?.id) {
                    showAuthError('Error al registrar usuario. Intenta de nuevo.');
                    return;
                }

                showAuthSuccess('¡Registro exitoso! Ahora puedes iniciar sesión');

                // Clear form and switch to login tab
                document.getElementById('registerForm').reset();
                setTimeout(() => {
                    document.getElementById('loginTabBtn').click();
                    document.getElementById('loginUsername').value = email;
                }, 1500);
            } catch (err) {
                console.error('Error durante registro:', err);
                showAuthError('Error al conectar con el servidor');
            }
        }
    });


    // Handle guest mode
    // Handle guest mode (Delegated event to handle dynamic DOM updates)
    document.addEventListener('click', (e) => {
        const guestBtn = e.target.closest('#guestModeBtn');
        if (guestBtn) {
            console.log('Guest mode button clicked');
            isGuestMode = true;
            currentUser = null;
            accessToken = null;

            showAuthSuccess('Modo invitado activado - Solo lectura');
            setTimeout(() => {
                showApp();
                if (typeof showToast === 'function') {
                    showToast('Modo invitado: solo puedes visualizar archivos', 'info');
                }
            }, 1000);
        }
    });

    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await supabaseSignOut();
            } catch (err) {
                console.error('Error during logout:', err);
            }

            clearSession();
            isGuestMode = false;
            showAuth();

            // Reset forms
            document.getElementById('loginForm').reset();
            document.getElementById('registerForm').reset();

            // Re-enable editor if it was disabled
            if (typeof editor !== 'undefined' && editor) {
                editor.updateOptions({ readOnly: false });
            }

            if (typeof showToast === 'function') {
                showToast('Sesión cerrada', 'success');
            }

            // Reset forms
            document.getElementById('loginForm').reset();
            document.getElementById('registerForm').reset();
        });
    }
}

// ========== INITIALIZE ==========

window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Supabase REST API initialized');
    console.log('📍 Project URL:', SUPABASE_URL);

    initAuth();
    checkAuth();
});
