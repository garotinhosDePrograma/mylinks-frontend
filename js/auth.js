const API_URL = window.CONFIG.API_URL;

const auth = {
    // ==================================================
    // 🔐 LOGIN
    // ==================================================
    async login(email, senha) {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha }),
            });

            const data = await res.json();
            console.log(data);

            if (res.ok && data.access_token) {
                const agora = Date.now();
                const expiraEm = agora + window.CONFIG.TOKEN_EXPIRATION_TIME;

                // Armazena tokens e dados do usuário
                localStorage.setItem("accessToken", data.access_token);
                localStorage.setItem("refreshToken", data.refresh_token);
                localStorage.setItem("tokenExp", expiraEm);
                localStorage.setItem("user", JSON.stringify(data.user));

                // Redireciona ao dashboard
                window.location.href = "dashboard.html";
            } else {
                throw new Error(data.error || "Erro ao fazer login");
            }
        } catch (err) {
            console.error("Erro no login:", err);
            throw err;
        }
    },

    // ==================================================
    // 🧾 REGISTRO DE NOVO USUÁRIO
    // ==================================================
    async register(username, email, senha) {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, senha }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("✅ Cadastro realizado com sucesso! Faça login para continuar.");
                window.location.href = "index.html";
            } else {
                throw new Error(data.error || "Erro ao registrar usuário");
            }
        } catch (err) {
            console.error("Erro no registro:", err);
            throw err;
        }
    },

    // ==================================================
    // 🔍 VERIFICA LOGIN E RENOVA TOKEN SE PRECISAR
    // ==================================================
    async verificarLogin() {
        const refreshToken = localStorage.getItem("refreshToken");
        const user = localStorage.getItem("user");

        // ✅ MUDANÇA: Verifica primeiro se tem refresh token válido
        if (!refreshToken || !user) {
            console.warn("⚠️ Sem credenciais salvas - Redirecionando para login");
            this.logout();
            return false;
        }

        const token = localStorage.getItem("accessToken");
        const tokenExp = parseInt(localStorage.getItem("tokenExp"), 10);
        const agora = Date.now();

        // Se o access token ainda é válido, não precisa fazer nada
        if (token && agora < tokenExp) {
            console.log("✅ Access token válido");
            return true;
        }

        // Access token expirado, tenta renovar
        console.log("🔄 Access token expirado, renovando...");
        const novoToken = await this.renovarToken();
        
        if (novoToken) {
            console.log("✅ Token renovado com sucesso!");
            return true;
        }

        // ✅ MUDANÇA: Só faz logout se refresh token realmente estiver inválido
        console.error("❌ Não foi possível renovar o token - Redirecionando para login");
        this.logout();
        return false;
    },

    // ==================================================
    // ♻️ RENOVA TOKEN USANDO REFRESH TOKEN
    // ==================================================
    async renovarToken() {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            console.warn("⚠️ Refresh token não encontrado");
            return null;
        }

        console.log("🔄 Tentando renovar token...");

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

                console.log("✅ Token renovado com sucesso!");
                return data.access_token;
            } else {
                console.warn("⚠️ Falha ao renovar token:", data.error || data.message);
                
                // ✅ MUDANÇA: Se o refresh token expirou, limpa tudo
                if (data.error === "Refresh token expirado" || data.error === "Token inválido") {
                    console.error("❌ Refresh token inválido - Limpando credenciais");
                    return null;
                }
                
                return null;
            }
        } catch (err) {
            console.error("❌ Erro ao renovar token:", err);
            // ✅ MUDANÇA: Em caso de erro de rede, não faz logout imediato
            // Deixa o usuário tentar novamente
            return null;
        }
    },

    // ==================================================
    // 🚀 REQUISIÇÃO AUTENTICADA
    // ==================================================
    async fetchAutenticado(url, options = {}) {
        let token = localStorage.getItem("accessToken");
        const tokenExp = parseInt(localStorage.getItem("tokenExp"), 10);
        const agora = Date.now();

        // Se o token expirou, tenta renovar antes de fazer a requisição
        if (!token || agora > tokenExp) {
            console.log("🔄 Access token expirado, renovando antes da requisição...");
            token = await this.renovarToken();
            
            if (!token) {
                console.error("❌ Não foi possível renovar token");
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

    // ==================================================
    // 🚪 LOGOUT
    // ==================================================
    logout() {
        console.log("🚪 Fazendo logout...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExp");
        localStorage.removeItem("user");
        window.location.href = "index.html";
    },
};

// ==================================================
// 🎨 CONTROLE DE LOADING
// ==================================================
function loginLoading(mostrar) {
    const loader = document.getElementById("loader");
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
    const loader = document.getElementById("loader");
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

// ==================================================
// 🎯 VALIDAÇÃO DE URL
// ==================================================
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

// ==================================================
// 🧠 EVENTO DE LOGIN (executado se existir o form)
// ==================================================
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const mensagem = document.getElementById("mensagem");

    // LOGIN
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value.trim();
            mensagem.textContent = "";

            // Inicia loading
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

    // REGISTRO
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

            // Inicia loading
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
