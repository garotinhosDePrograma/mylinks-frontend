const API = "https://pygre.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
    const mensagem = document.getElementById("mensagem");
    const usernameEl = document.getElementBydId("username");
    const fotoPerfil = document.getElementById("fotoPerfil");
    const linksList = document.getElementById("linksList");

    const params = new URLSearchParams(window.location.search);
    const username = params.get("user");

    if (!username) {
        mensagem.textContent = "Usuário não especificado";
        return;
    }

    try {
        const response = await fetch(`${API}/user/${username}`);
        const data = await response.json();

        if (!response.ok) {
            mensagem.textContent = data.message || "Usuário não encontrado";
            return;
        }

        usernameEl.textContent = data.username;

        if (data.foto_perfil) {
            fotoPerfil.src = `${API}$data.foto_perfil`;
        } else {
            fotoPerfil.src = "https://via.placeholder.com/120?text=Sem+Foto";
        }

        if (data.links && data.links.length > 0) {
            data.links
                .sort((a, b) => a.ordem - b.ordem)
                .forEach(link => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = link.url;
                    a.textContent = link.titulo;
                    a.target = "_blank";
                    a.style.textAlign = "center";
                    a.style.display = "block";
                    a.style.padding = "10px";
                    a.style.border = "1px solid #ccc";
                    a.style.borderRadius = "8px";
                    li.appendChild(a);
                    linksList.appendChild(li);
                });
        } else {
            linksList.textContent = "<li>Nenhum link encontrado.</li>";
        }
    } catch (err) {
        console.log(err);
        mensagem.textContent = "Falha ao carregar dados do usuário.";
    }
});
