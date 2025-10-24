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
        const refreshToken = localStorage.getItem("refreshToken");
        const tokenExp = parseInt(localStorage.getItem("tokenExp"), 10);
        const user = JSON.parse(localStorage.getItem("user"));

        if (!token || !refreshToken || !tokenExp || !user) {
            console.warn("Sessão inválida — redirecionando para login.");
            this.logout();
            return;
        }

        const agora = Date.now();

        if (agora > tokenExp) {
            console.log("Token expirado — tentando renovar...");
            const novoToken = await this.renovarToken();
            if (!novoToken) {
                console.warn("Falha ao renovar token — redirecionando.");
                this.logout();
            }
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

        if (agora > tokenExp) {
            console.log("Access token expirado — tentando renovar...");
            const novoToken = await this.renovarToken();
            if (novoToken) token = novoToken;
            else {
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

            try {
                await auth.login(email, senha);
            } catch {
                mensagem.style.color = "red";
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
                mensagem.style.color = "red";
                mensagem.textContent = "Preencha todos os campos.";
                return;
            }

            await auth.register(username, email, senha);
        });
    }
});