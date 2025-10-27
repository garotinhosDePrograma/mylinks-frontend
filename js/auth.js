const API_URL = window.CONFIG.API_URL;

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
                const expiraEm = agora + window.CONFIG.TOKEN_EXPIRATION_TIME;

                localStorage.setItem("accessToken", data.access_token);
                localStorage.setItem("refreshToken", data.refresh_token);
                localStorage.setItem("tokenExp", expiraEm);
                localStorage.setItem("user", JSON.stringify(data.user));

                window.location.href = "dashboard.html";
            } else {
                throw new Error(data.error || "Erro ao fazer login");
            }
        } catch (err) {
            console.error("Erro no login:", err);
            throw err;
        }
    },

    async register(username, email, senha) {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, senha }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("Cadastro realizado com sucesso! Faça login para continuar.");
                window.location.href = "index.html";
            } else {
                throw new Error(data.error || "Erro ao registrar usuário");
            }
        } catch (err) {
            console.error("Erro no registro:", err);
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
            return true;
        }

        console.log("Access token expirado, renovando...");
        const novoToken = await this.renovarToken();
        
        if (novoToken) {
            console.log("Token renovado com sucesso!");
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
                throw new Error("Sessão expirada");
            }
        }

        return fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });
    },

    logout() {
        console.log("Fazendo logout...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExp");
        localStorage.removeItem("user");
        window.location.href = "index.html";
    },
};

function loginLoading(mostrar) {
    const loader = document.getElementById("Logloader");
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (loader && submitBtn) {
        if (mostrar) {
            loader.classList.add("active");
            submitBtn.disabled = true;
            submitBtn.textContent = "Entrando...";
        } else {
            loader.classList.remove("active");
            submitBtn.disabled = false;
            submitBtn.textContent = "Entrar";
        }
    }
}

function registerLoading(mostrar) {
    const loader = document.getElementById("Regloader");
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (loader && submitBtn) {
        if (mostrar) {
            loader.classList.add("active");
            submitBtn.disabled = true;
            submitBtn.textContent = "Cadastrando...";
        } else {
            loader.classList.remove("active");
            submitBtn.disabled = false;
            submitBtn.textContent = "Cadastrar";
        }
    }
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

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

            loginLoading(true);

            try {
                await auth.login(email, senha);
            } catch {
                loginLoading(false);
                mensagem.style.color = "#ff6b6b";
                mensagem.textContent = "E-mail ou senha incorretos.";
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

            registerLoading(true);

            try {
                await auth.register(username, email, senha);
            } catch (err) {
                registerLoading(false);
                mensagem.style.color = "#ff6b6b";
                mensagem.textContent = err.message || "Erro ao cadastrar. Tente novamente.";
            }
        });
    }
});