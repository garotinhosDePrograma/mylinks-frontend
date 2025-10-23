// ===============================
// 🔐 Configurações principais
// ===============================
const API_URL = "https://pygre.onrender.com";
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos antes de expirar

// ===============================
// ⚙️ Funções utilitárias
// ===============================

// Salva sessão no localStorage
function salvarSessao(accessToken, refreshToken, user) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("loginTime", Date.now());
}

// Remove sessão e volta ao login
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// Decodifica o token JWT para ver a expiração
function decodeJwt(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload;
    } catch (e) {
        return null;
    }
}

// Retorna true se o token estiver expirando ou expirado
function tokenExpirando(token) {
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) return true;
    const exp = payload.exp * 1000;
    const agora = Date.now();
    return exp - agora < REFRESH_THRESHOLD;
}

// Tenta renovar o token automaticamente
async function renovarToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return logout();

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${refreshToken}`
            }
        });

        const data = await response.json();
        if (response.ok && data.access_token) {
            localStorage.setItem("accessToken", data.access_token);
            localStorage.setItem("loginTime", Date.now());
            console.log("🔁 Token renovado automaticamente.");
            return data.access_token;
        } else {
            console.warn("⚠️ Refresh token inválido, sessão encerrada.");
            logout();
        }
    } catch (error) {
        console.error("Erro ao renovar token:", error);
        logout();
    }
}

// Faz uma requisição autenticada com renovação automática
async function fetchAutenticado(url, options = {}) {
    let token = localStorage.getItem("accessToken");

    // Se o token estiver expirando, renova
    if (tokenExpirando(token)) {
        token = await renovarToken();
    }

    if (!token) return logout();

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    return fetch(url, { ...options, headers });
}

// ===============================
// 📥 Lógica de login e registro
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const mensagem = document.getElementById("mensagem");

    // Redireciona direto se o usuário já estiver logado
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && !tokenExpirando(accessToken)) {
        window.location.href = "dashboard.html";
        return;
    }

    // LOGIN
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value.trim();

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (response.ok && data.access_token && data.refresh_token) {
                    salvarSessao(data.access_token, data.refresh_token, data.user);
                    mensagem.style.color = "green";
                    mensagem.textContent = "Login realizado com sucesso!";
                    setTimeout(() => (window.location.href = "dashboard.html"), 1000);
                } else {
                    mensagem.style.color = "red";
                    mensagem.textContent = data.message || "Erro ao fazer login";
                }
            } catch (error) {
                console.error("Erro:", error);
                mensagem.style.color = "red";
                mensagem.textContent = "Falha na conexão com o servidor";
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

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, senha })
                });

                const data = await response.json();

                if (response.ok) {
                    mensagem.style.color = "green";
                    mensagem.textContent = "Cadastro realizado! Redirecionando...";
                    setTimeout(() => (window.location.href = "index.html"), 1500);
                } else {
                    mensagem.style.color = "red";
                    mensagem.textContent = data.message || "Erro ao cadastrar";
                }
            } catch (error) {
                console.error("Erro:", error);
                mensagem.style.color = "red";
                mensagem.textContent = "Falha na conexão com o servidor";
            }
        });
    }
});

// ===============================
// 🌐 Exporta globalmente
// ===============================
window.auth = { fetchAutenticado, renovarToken, logout };
