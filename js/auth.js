const API_URL = window.CONFIG.API_URL;

const AppState = {
    _state: {
        user: null,
        isAuthenticated: false,
        isLoading: false
    },
    
    _listeners: [],
    
    getState() {
        return { ...this._state };
    },
    
    setState(newState) {
        this._state = { ...this._state, ...newState };
        this._listeners.forEach(listener => listener(this._state));
    },
    
    subscribe(listener) {
        this._listeners.push(listener);
        return () => {
            this._listeners = this._listeners.filter(l => l !== listener);
        };
    },
    
    initialize() {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                this._state.user = JSON.parse(userStr);
            } catch (err) {
                console.error("Erro ao carregar usuário:", err);
                localStorage.removeItem("user");
            }
        }
    }
};

const auth = {
    async login(email, senha) {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha }),
            });

            const data = await res.json();

            if (res.ok && data.access_token) {
                const agora = Date.now();
                const expiraEm = agora + window.CONFIG.TOKEN_EXP_TIME;

                localStorage.setItem("accessToken", data.access_token);
                localStorage.setItem("refreshToken", data.refresh_token);
                localStorage.setItem("tokenExp", expiraEm);
                localStorage.setItem("user", JSON.stringify(data.user));
                
                AppState.setState({ 
                    user: data.user, 
                    isAuthenticated: true 
                });

                window.location.href = "dashboard.html";
            } else {
                throw new Error(data.error || "Erro ao fazer login");
            }
        } catch (err) {
            console.error("Erro no login:", err);
            
            if (err.name === 'TypeError') {
                throw new Error(window.CONFIG.ERRORS.OFFLINE);
            }
            
            throw err;
        }
    },

    async register(username, email, senha) {
        if (username.length < window.CONFIG.VALIDATION.MIN_USERNAME_LENGTH) {
            throw new Error(`Username deve ter no mínimo ${window.CONFIG.VALIDATION.MIN_USERNAME_LENGTH} caracteres`);
        }
        
        if (senha.length < window.CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
            throw new Error(`Senha deve ter no mínimo ${window.CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} caracteres`);
        }
        
        if (!this._isValidEmail(email)) {
            throw new Error("E-mail inválido");
        }
        
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, senha }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("Cadastro realizado com sucesso! Faça login para continuar.");
                window.location.href = "login.html";
            } else {
                throw new Error(data.error || "Erro ao registrar usuário");
            }
        } catch (err) {
            console.error("Erro no registro:", err);
            
            if (err.name === 'TypeError') {
                throw new Error(window.CONFIG.ERRORS.OFFLINE);
            }
            
            throw err;
        }
    },

    async verificarLogin() {
        const refreshToken = localStorage.getItem("refreshToken");
        const user = localStorage.getItem("user");

        if (!refreshToken || !user) {
            console.warn("Sem credenciais salvas - Redirecionando para login");
            this.logout();
            return false;
        }

        const token = localStorage.getItem("accessToken");
        const tokenExp = parseInt(localStorage.getItem("tokenExp"), 10);
        const agora = Date.now();

        if (token && agora < tokenExp) {
            console.log("Access token válido");
            AppState.setState({ isAuthenticated: true });
            return true;
        }

        console.log("Access token expirado, renovando...");
        const novoToken = await this.renovarToken();
        
        if (novoToken) {
            console.log("Token renovado com sucesso!");
            AppState.setState({ isAuthenticated: true });
            return true;
        }

        console.error("Não foi possível renovar o token - Redirecionando para login");
        this.logout();
        return false;
    },

    async renovarToken() {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            console.warn("Refresh token não encontrado");
            return null;
        }

        console.log("Tentando renovar token...");

        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${refreshToken}`,
                },
            });

            const data = await res.json();

            if (res.ok && data.access_token) {
                const agora = Date.now();
                const expiraEm = agora + window.CONFIG.TOKEN_EXPIRATION_TIME;

                localStorage.setItem("accessToken", data.access_token);
                localStorage.setItem("tokenExp", expiraEm);

                console.log("Token renovado com sucesso!");
                return data.access_token;
            } else {
                console.warn("Falha ao renovar token:", data.error || data.message);

                if (data.error === "Refresh token expirado" || data.error === "Token inválido") {
                    console.error("Refresh token inválido - Limpando credenciais");
                    return null;
                }
                
                return null;
            }
        } catch (err) {
            console.error("Erro ao renovar token:", err);
            
            if (err.name === 'TypeError') {
                console.error(window.CONFIG.ERRORS.OFFLINE);
            }
            
            return null;
        }
    },

    async fetchAutenticado(url, options = {}) {
        let token = localStorage.getItem("accessToken");
        const tokenExp = parseInt(localStorage.getItem("tokenExp"), 10);
        const agora = Date.now();

        if (!token || agora > tokenExp) {
            console.log("Access token expirado, renovando antes da requisição...");
            token = await this.renovarToken();
            
            if (!token) {
                console.error("Não foi possível renovar token");
                this.logout();
                throw new Error(window.CONFIG.ERRORS.UNAUTHORIZED);
            }
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    ...(options.headers || {}),
                },
            });
            
            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        this.logout();
                        throw new Error(window.CONFIG.ERRORS.UNAUTHORIZED);
                    case 403:
                        throw new Error(window.CONFIG.ERRORS.FORBIDDEN);
                    case 404:
                        throw new Error(window.CONFIG.ERRORS.NOT_FOUND);
                    case 500:
                    case 502:
                    case 503:
                        throw new Error(window.CONFIG.ERRORS.SERVER);
                    default:
                        throw new Error(`Erro HTTP ${response.status}`);
                }
            }
            
            return response;
            
        } catch (err) {
            if (err.name === 'TypeError') {
                throw new Error(window.CONFIG.ERRORS.OFFLINE);
            }
            throw err;
        }
    },

    logout() {
        console.log("Fazendo logout...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExp");
        localStorage.removeItem("user");
        
        AppState.setState({ 
            user: null, 
            isAuthenticated: false 
        });
        
        window.location.href = "index.html";
    },
    
    _isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};

function toggleLoading(formType, mostrar) {
    const loaderMap = {
        'login': 'Logloader',
        'register': 'Regloader'
    };
    
    const buttonTextMap = {
        'login': { loading: 'Entrando...', default: 'Entrar' },
        'register': { loading: 'Cadastrando...', default: 'Cadastrar' }
    };
    
    const loaderId = loaderMap[formType];
    const buttonText = buttonTextMap[formType];
    
    const loader = document.getElementById(loaderId);
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (loader && submitBtn) {
        if (mostrar) {
            loader.classList.add("active");
            submitBtn.disabled = true;
            submitBtn.textContent = buttonText.loading;
        } else {
            loader.classList.remove("active");
            submitBtn.disabled = false;
            submitBtn.textContent = buttonText.default;
        }
    }
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return false;
        }
        
        const hostname = url.hostname.toLowerCase();
        const blockedDomains = window.CONFIG.VALIDATION.BLOCKED_DOMAINS;
        
        for (const blocked of blockedDomains) {
            if (hostname === blocked || hostname.endsWith(`.${blocked}`)) {
                return false;
            }
        }
        
        return true;
    } catch {
        return false;
    }
}

function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

AppState.initialize();

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const mensagem = document.getElementById("mensagem");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value.trim();
            mensagem.textContent = "";

            toggleLoading('login', true);

            try {
                await auth.login(email, senha);
            } catch (err) {
                toggleLoading('login', false);
                mensagem.style.color = "#ff6b6b";
                mensagem.textContent = err.message || "E-mail ou senha incorretos.";
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value.trim();

            mensagem.textContent = "";

            if (!username || !email || !senha) {
                mensagem.style.color = "#ff6b6b";
                mensagem.textContent = "Preencha todos os campos.";
                return;
            }

            toggleLoading('register', true);

            try {
                await auth.register(username, email, senha);
            } catch (err) {
                toggleLoading('register', false);
                mensagem.style.color = "#ff6b6b";
                mensagem.textContent = err.message || "Erro ao cadastrar. Tente novamente.";
            }
        });
    }
});
