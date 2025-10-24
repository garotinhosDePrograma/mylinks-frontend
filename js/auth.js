const API_URL = "https://pygre.onrender.com";

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

            if (res.ok && data.access_token) {
                const agora = Date.now();
                const expiraEm = agora + 60 * 60 * 1000; // 1 hora

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
            alert("Falha ao registrar. Verifique os dados e tente novamente.");
        }
    },

    // ==================================================
    // 🔍 VERIFICA LOGIN E RENOVA TOKEN SE PRECISAR
    // ==================================================
    async verificarLogin() {
        const token = localStorage.getItem("accessToken");
        const tokenExp = parseInt(localStorage.getItem("tokenExp"), 10);
        const user = JSON.parse(localStorage.getItem("user"));
        const agora = Date.now();

        if (!token || !user) {
            console.warn("Sem token - Tentando renovar...");
            const novoToken = await this.renovarToken();
            if (novoToken) return;
            this.logout();
            return;
        }

        if (agora > tokenExp) {
            console.log("Token expirado - Tentando renovar...");
            const novoToken = await this.renovarToken();
            if (!novoToken) this.logout();
        }
    },

    // ==================================================
    // ♻️ RENOVA TOKEN USANDO REFRESH TOKEN
    // ==================================================
    async renovarToken() {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return null;

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
                const expiraEm = agora + 60 * 60 * 1000; // 1 hora

                localStorage.setItem("accessToken", data.access_token);
                localStorage.setItem("tokenExp", expiraEm);

                console.log("🔄 Token renovado com sucesso!");
                return data.access_token;
            } else {
                console.warn("Falha ao renovar token:", data.error || data.message);
                return null;
            }
        } catch (err) {
            console.error("Erro ao renovar token:", err);
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

        if (!token || agora > tokenExp) {
            console.log("Access token expirado — tentando renovar...");
            token = await this.renovarToken()
            if (!token) {
                this.logout();
                return;
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
            submitBtn.textContent = "cadastrando...";
        } else {
            loader.classList.remove("active");
            submitBtn.disabled = false;
            submitBtn.textContent = "Entrar";
        }
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
            } catch {
                registerLoading(false);
            }
        });
    }
});
