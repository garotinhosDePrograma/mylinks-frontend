const API_URL = "https://pygre.onrender.com";

const auth = {
    async login(email, senha) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
        });

        const data = await res.json();

        if (res.ok && data.token) {
            const agora = new Date().getTime();
            const expiraEm = agora + 4 * 60 * 60 * 1000; // 4 horas

            localStorage.setItem("accessToken", data.token);
            localStorage.setItem("tokenExp", expiraEm);
            localStorage.setItem("user", JSON.stringify(data.user));

            window.location.href = "dashboard.html";
        } else {
            throw new Error(data.message || "Erro ao fazer login");
        }
    },

    verificarLogin() {
        const token = localStorage.getItem("accessToken");
        const user = JSON.parse(localStorage.getItem("user"));
        const tokenExp = parseInt(localStorage.getItem("tokenExp"), 10);

        // Se não houver token ou expiração inválida, redireciona
        if (!token || !tokenExp || !user) {
            console.warn("Nenhum token encontrado — redirecionando para login.");
            window.location.href = "index.html";
            return;
        }

        const agora = new Date().getTime();

        // Se o token expirou
        if (agora > tokenExp) {
            console.warn("Token expirado — redirecionando para login.");
            auth.logout();
        }
    },

    async fetchAutenticado(url, options = {}) {
        let token = localStorage.getItem("accessToken");
        const tokenExp = parseInt(localStorage.getItem("tokenExp"), 10);
        const agora = new Date().getTime();

        // Se o token expirou, tenta renovar
        if (agora > tokenExp) {
            console.log("Token expirado — tentando renovar...");
            const novoToken = await auth.renovarToken();
            if (novoToken) {
                token = novoToken;
            } else {
                console.warn("Falha ao renovar token — redirecionando.");
                auth.logout();
                return;
            }
        }

        // Faz a requisição com token válido
        return fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });
    },

    async renovarToken() {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return null;

        try {
            // A rota /auth/refresh pode ser implementada depois no backend
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email, // ⚠ precisa incluir email no login inicial
                    senha: user.senha, // ⚠ ou implementar refresh real no backend
                }),
            });

            const data = await res.json();
            if (res.ok && data.token) {
                const agora = new Date().getTime();
                const expiraEm = agora + 4 * 60 * 60 * 1000;

                localStorage.setItem("accessToken", data.token);
                localStorage.setItem("tokenExp", expiraEm);

                return data.token;
            }
        } catch (err) {
            console.error("Erro ao renovar token:", err);
        }

        return null;
    },

    logout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("tokenExp");
        localStorage.removeItem("user");
        window.location.href = "index.html";
    }
};
