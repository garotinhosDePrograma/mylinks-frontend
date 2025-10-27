document.addEventListener("DOMContentLoaded", async () => {
    await auth.verificarLogin();

    const user = JSON.parse(localStorage.getItem("user"));
    const mensagem = document.getElementById("mensagem");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const fotoPerfil = document.getElementById("fotoPerfil");
    const linkForm = document.getElementById("linkForm");
    const linksList = document.getElementById("linksList");
    const logoutBtn = document.getElementById("logoutBtn");
    const linkIdInput = document.getElementById("linkId");
    const saveBtn = document.getElementById("saveBtn");
    const btnUpload = document.getElementById("btnUpload");
    const profileLink = document.getElementById("profileLink");
    const btnCopyProfile = document.getElementById("btnCopyProfile");
    const btnConfig = document.getElementById("btnConfig");

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    usernameDisplay.textContent = `Olá, ${user.username}!`;

    logoutBtn?.addEventListener("click", () => auth.logout());
    btnUpload?.addEventListener("click", () => (window.location.href = "upload.html"));
    btnConfig?.addEventListener("click", () => (window.location.href = "settings.html"));

    const profileUrl = `${API_URL}/${user.username}`;
    profileLink.href = profileUrl;
    profileLink.textContent = profileUrl;

    async function carregarFotoPerfil() {
        try {
            const response = await auth.fetchAutenticado(`${API_URL}/user/${user.username}`);
            if (!response.ok) throw new Error("Erro ao carregar perfil");

            const data = await response.json();
            fotoPerfil.src = data.foto_perfil || window.CONFIG.DEFAULT_AVATAR;
        } catch (err) {
            console.error("Erro ao carregar foto:", err);
            fotoPerfil.src = window.CONFIG.DEFAULT_AVATAR;
        }
    }

    async function carregarLinks() {
        try {
            const response = await auth.fetchAutenticado(`${API_URL}/links`);
            if (!response.ok) throw new Error("Erro ao carregar links");

            const links = await response.json();
            renderLinks(links);
        } catch (error) {
            mensagem.style.color = "red";
            mensagem.textContent = "Não foi possível carregar seus links.";
            console.error(error);
        }
    }

    function renderLinks(links) {
        linksList.innerHTML = "";

        if (!Array.isArray(links) || links.length === 0) {
            linksList.innerHTML = '<li class="empty-state"><p>Nenhum link adicionado ainda.</p></li>';
            return;
        }

        links.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        links.forEach(link => {
            const id = link[0];
            const titulo = link[2];
            const url = link[3];

            const li = document.createElement("li");

            const linkText = document.createElement("a");
            linkText.href = url.startsWith("http") ? url : `https://${url}`;
            linkText.target = "_blank";
            linkText.textContent = `${titulo} → ${url}`;

            const editBtn = document.createElement("button");
            editBtn.textContent = "Editar";
            editBtn.addEventListener("click", () =>
                preencherFormulario({ id, titulo, url })
            );

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Excluir";
            deleteBtn.addEventListener("click", () => excluirLink(id));

            li.appendChild(linkText);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);

            linksList.appendChild(li);
        });
    }

    function preencherFormulario(link) {
        linkIdInput.value = link.id;
        document.getElementById("titulo").value = link.titulo;
        document.getElementById("url").value = link.url;
        saveBtn.textContent = "Salvar Alterações";
    }

    function limparFormulario() {
        linkIdInput.value = "";
        linkForm.reset();
        saveBtn.textContent = "Adicionar Link";
    }

    linkForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = linkIdInput.value;
        const titulo = document.getElementById("titulo").value.trim();
        const url = document.getElementById("url").value.trim();

        mensagem.textContent = "";

        if (!titulo || !url) {
            mensagem.style.color = "red";
            mensagem.textContent = "Preencha todos os campos.";
            return;
        }

        if (!isValidUrl(url)) {
            mensagem.style.color = "red";
            mensagem.textContent = "URL inválida. Use o formato: https://exemplo.com";
            return;
        }

        try {
            const method = id ? "PUT" : "POST";
            const endpoint = id ? `${API_URL}/links/${id}` : `${API_URL}/links`;

            const response = await auth.fetchAutenticado(endpoint, {
                method,
                body: JSON.stringify({ titulo, url })
            });

            const data = await response.json();

            if (response.ok) {
                mensagem.style.color = "green";
                mensagem.textContent = data.message;
                limparFormulario();
                carregarLinks();
            } else {
                mensagem.style.color = "red";
                mensagem.textContent = data.error || "Erro ao salvar link.";
            }
        } catch (error) {
            console.error("Erro:", error);
            mensagem.style.color = "red";
            mensagem.textContent = "Falha na conexão com o servidor.";
        }
    });

    async function excluirLink(id) {
        if (!confirm("Tem certeza que deseja excluir este link?")) return;

        try {
            const response = await auth.fetchAutenticado(`${API_URL}/links/${id}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (response.ok) {
                mensagem.style.color = "green";
                mensagem.textContent = data.message;
                carregarLinks();
            } else {
                mensagem.style.color = "red";
                mensagem.textContent = data.error || "Erro ao excluir link.";
            }
        } catch (error) {
            console.error(error);
            mensagem.style.color = "red";
            mensagem.textContent = "Falha ao excluir o link.";
        }
    }

    btnCopyProfile.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            btnCopyProfile.textContent = "Copiado!";
            btnCopyProfile.classList.add("copied");

            setTimeout(() => {
                btnCopyProfile.textContent = "Copiar Link";
                btnCopyProfile.classList.remove("copied");
            }, 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
            mensagem.style.color = "red";
            mensagem.textContent = "Não foi possível copiar o link.";
        }
    });

    carregarFotoPerfil();
    carregarLinks();
});