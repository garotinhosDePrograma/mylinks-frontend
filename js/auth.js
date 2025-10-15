const API_URL = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const mensagem = document.getElementById("mensagem");

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

                if (response.ok && data.token) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));

                    window.location.href = "dashboard.html";
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
                    mensagem.textContent = "Cadastro realizado com sucesso! Redirecionando...";
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