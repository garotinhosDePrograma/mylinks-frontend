document.addEventListener("DOMContentLoaded", async () => {
    await auth.verificarLogin();

    const user = JSON.parse(localStorage.getItem("user"));
    const mensagem = document.getElementById("mensagem");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const fotoPerfil = document.getElementById("fotoPerfil");
    const linkForm = document.getElementById("linkForm");
    const linksList = document.getElementById("linksList");
    const linkIdInput = document.getElementById("linkId");
    const saveBtn = document.getElementById("saveBtn");
    const profileLink = document.getElementById("profileLink");
    const btnCopyProfile = document.getElementById("btnCopyProfile");

    const btnMenu = document.getElementById("btnMenu");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const menuUpload = document.getElementById("menuUpload");
    const menuConfig = document.getElementById("menuConfig");
    const menuLogout = document.getElementById("menuLogout");

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    usernameDisplay.textContent = `Olá ${user.username}!`;

    function posicionarDropdown() {
        if (dropdownMenu.classList.contains("show")) {
            const btnRect = btnMenu.getBoundingClientRect();
            dropdownMenu.style.top = `${btnRect.bottom + 10}px`;
        }
    }

    btnMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("show");
        btnMenu.classList.toggle("active");
        btnMenu.setAttribute('aria-expanded', dropdownMenu.classList.contains("show"));
        posicionarDropdown();
    });

    document.addEventListener("click", (e) => {
        if (!dropdownMenu.contains(e.target) && e.target !== btnMenu) {
            dropdownMenu.classList.remove("show");
            btnMenu.classList.remove("active");
            btnMenu.setAttribute('aria-expanded', 'false');
        }
    });

    const debouncedReposition = debounce(() => {
        posicionarDropdown();
    }, window.CONFIG.DEBOUNCE_DELAY);

    window.addEventListener("resize", debouncedReposition);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && dropdownMenu.classList.contains("show")) {
            dropdownMenu.classList.remove("show");
            btnMenu.classList.remove("active");
            btnMenu.setAttribute('aria-expanded', 'false');
            btnMenu.focus();
        }
    });

    menuUpload.addEventListener("click", () => {
        window.location.href = "upload.html";
    });

    menuConfig.addEventListener("click", () => {
        window.location.href = "settings.html";
    });

    menuLogout.addEventListener("click", () => {
        if (confirm("Tem certeza que deseja sair?")) {
            auth.logout();
        }
    });

    const profileUrl = `${API_URL}/${user.username}`;
    profileLink.href = profileUrl;
    profileLink.textContent = profileUrl;

    function setFotoLoading(loading) {
        if (loading) {
            fotoPerfil.style.opacity = "0.5";
            fotoPerfil.style.filter = "blur(2px)";
        } else {
            fotoPerfil.style.opacity = "1";
            fotoPerfil.style.filter = "none";
        }
    }

    async function carregarFotoPerfil() {
        try {
            setFotoLoading(true);
            
            const response = await auth.fetchAutenticado(`${API_URL}/user/${user.username}`);
            if (!response.ok) throw new Error("Erro ao carregar perfil");

            const data = await response.json();
            
            const img = new Image();
            img.onload = () => {
                fotoPerfil.src = img.src;
                setFotoLoading(false);
            };
            img.onerror = () => {
                fotoPerfil.src = window.CONFIG.DEFAULT_AVATAR;
                setFotoLoading(false);
            };
            img.src = data.foto_perfil || window.CONFIG.DEFAULT_AVATAR;
            
        } catch (err) {
            console.error("Erro ao carregar foto:", err);
            fotoPerfil.src = window.CONFIG.DEFAULT_AVATAR;
            setFotoLoading(false);
            
            mostrarMensagem(err.message || window.CONFIG.ERRORS.NETWORK, 'error');
        }
    }

    async function carregarLinks() {
        try {
            const response = await auth.fetchAutenticado(`${API_URL}/links`);
            if (!response.ok) throw new Error("Erro ao carregar links");

            const links = await response.json();
            renderLinks(links);
        } catch (error) {
            console.error(error);
            mostrarMensagem(error.message || "Não foi possível carregar seus links.", 'error');
        }
    }

    function renderLinks(links) {
        linksList.innerHTML = "";
        
        if (!Array.isArray(links) || links.length === 0) {
            linksList.innerHTML = '<li class="empty-state"><p>Nenhum link adicionado ainda.</p></li>';
            return;
        }

        links.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        links.forEach((link, index) => {
            const { id, titulo, url } = link;

            const li = document.createElement("li");
            li.setAttribute('role', 'listitem');
            li.style.animationDelay = `${index * 0.05}s`;

            const linkText = document.createElement("a");
            linkText.href = url.startsWith("http") ? url : `https://${url}`;
            linkText.target = "_blank";
            linkText.rel = "noopener noreferrer";
            linkText.textContent = `${titulo} → ${url}`;
            linkText.setAttribute('aria-label', `${titulo} - Abre em nova aba`);

            const editBtn = document.createElement("button");
            editBtn.textContent = "Editar";
            editBtn.setAttribute('aria-label', `Editar ${titulo}`);
            editBtn.addEventListener("click", () =>
                preencherFormulario({ id, titulo, url })
            );

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Excluir";
            deleteBtn.setAttribute('aria-label', `Excluir ${titulo}`);
            deleteBtn.addEventListener("click", () => excluirLink(id, titulo));

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

        linkForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        document.getElementById("titulo").focus();
    }

    function limparFormulario() {
        linkIdInput.value = "";
        linkForm.reset();
        saveBtn.textContent = "Adicionar Link";
    }

    function mostrarMensagem(texto, tipo = 'info', duracao = 5000) {
        mensagem.textContent = texto;
        mensagem.className = '';
        mensagem.setAttribute('role', 'alert');
        
        switch(tipo) {
            case 'success':
                mensagem.style.color = "#4caf50";
                mensagem.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
                mensagem.style.border = "1px solid rgba(76, 175, 80, 0.3)";
                break;
            case 'error':
                mensagem.style.color = "#ff6b6b";
                mensagem.style.backgroundColor = "rgba(255, 107, 107, 0.1)";
                mensagem.style.border = "1px solid rgba(255, 107, 107, 0.3)";
                break;
            default:
                mensagem.style.color = "#667eea";
                mensagem.style.backgroundColor = "rgba(102, 126, 234, 0.1)";
                mensagem.style.border = "1px solid rgba(102, 126, 234, 0.3)";
        }
        
        if (tipo === 'success' && duracao > 0) {
            setTimeout(() => {
                mensagem.textContent = "";
                mensagem.style.backgroundColor = "";
                mensagem.style.border = "";
            }, duracao);
        }
    }

    linkForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = linkIdInput.value;
        const titulo = document.getElementById("titulo").value.trim();
        const url = document.getElementById("url").value.trim();

        mostrarMensagem("", 'info');

        if (!titulo || !url) {
            mostrarMensagem("Preencha todos os campos.", 'error', 0);
            return;
        }

        if (!isValidUrl(url)) {
            mostrarMensagem(window.CONFIG.ERRORS.INVALID_URL, 'error', 0);
            return;
        }

        saveBtn.disabled = true;
        const textoOriginal = saveBtn.textContent;
        saveBtn.textContent = "Salvando...";

        try {
            const method = id ? "PUT" : "POST";
            const endpoint = id ? `${API_URL}/links/${id}` : `${API_URL}/links`;

            const response = await auth.fetchAutenticado(endpoint, {
                method,
                body: JSON.stringify({ titulo, url })
            });

            const data = await response.json();

            if (response.ok) {
                mostrarMensagem(
                    id ? window.CONFIG.SUCCESS.LINK_UPDATED : window.CONFIG.SUCCESS.LINK_CREATED, 
                    'success'
                );
                limparFormulario();
                carregarLinks();
            } else {
                mostrarMensagem(data.error || "Erro ao salvar link.", 'error', 0);
            }
        } catch (error) {
            console.error("Erro:", error);
            mostrarMensagem(error.message || window.CONFIG.ERRORS.NETWORK, 'error', 0);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = textoOriginal;
        }
    });

    async function excluirLink(id, titulo) {
        if (!confirm(`Tem certeza que deseja excluir "${titulo}"?`)) return;

        try {
            const response = await auth.fetchAutenticado(`${API_URL}/links/${id}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (response.ok) {
                mostrarMensagem(window.CONFIG.SUCCESS.LINK_DELETED, 'success');
                carregarLinks();
            } else {
                mostrarMensagem(data.error || "Erro ao excluir link.", 'error', 0);
            }
        } catch (error) {
            console.error(error);
            mostrarMensagem(error.message || "Falha ao excluir o link.", 'error', 0);
        }
    }

    btnCopyProfile.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            btnCopyProfile.textContent = "Copiado!";
            btnCopyProfile.classList.add("copied");
            btnCopyProfile.setAttribute('aria-label', 'Link copiado para área de transferência');

            setTimeout(() => {
                btnCopyProfile.textContent = "📋 Copiar Link";
                btnCopyProfile.classList.remove("copied");
                btnCopyProfile.setAttribute('aria-label', 'Copiar link do perfil');
            }, 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
            
            const input = document.createElement('input');
            input.value = profileUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            
            mostrarMensagem(window.CONFIG.SUCCESS.LINK_COPIED, 'success');
        }
    });

    carregarFotoPerfil();
    carregarLinks();

    btnMenu.setAttribute('arial-label', 'Menu de opções');
    btnMenu.setAttribute('aria-expanded', 'false');
    btnMenu.setAttribute('aria-hashpopup', 'true');
});