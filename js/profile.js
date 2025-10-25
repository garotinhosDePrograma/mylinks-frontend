const API_URL = window.CONFIG.API_URL;

document.addEventListener("DOMContentLoaded", async () => {
    const mensagem = document.getElementById("mensagem");
    const usernameEl = document.getElementById("username");
    const fotoPerfil = document.getElementById("fotoPerfil");
    const linksList = document.getElementById("linksList");

    const params = new URLSearchParams(window.location.search);
    const username = params.get("user");

    if (!username) {
        mensagem.style.color = "red";
        mensagem.textContent = "Usuário não especificado.";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/user/${username}`);
        const data = await response.json();

        if (!response.ok) {
            mensagem.style.color = "red";
            mensagem.textContent = data.error || "Usuário não encontrado.";
            return;
        }

        usernameEl.textContent = data.username;

        if (data.foto_perfil) {
            fotoPerfil.src = data.foto_perfil;
        } else {
            fotoPerfil.src = window.CONFIG.DEFAULT_AVATAR;
        }

        if (data.links && data.links.length > 0) {
            data.links
                .sort((a, b) => a.ordem - b.ordem)
                .forEach(link => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = link.url.startsWith("http") ? link.url : `https://${link.url}`;
                    a.textContent = link.titulo;
                    a.target = "_blank";
                    li.appendChild(a);
                    linksList.appendChild(li);
                });
        } else {
            linksList.innerHTML = '<li class="empty-state"><p>Nenhum link encontrado.</p></li>';
        }

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        mensagem.style.color = "red";
        mensagem.textContent = "Falha ao carregar dados do usuário.";
    }
});
