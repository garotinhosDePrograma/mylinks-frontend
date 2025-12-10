const SEARCH_CONFIG = {
    minUsernameLength: 3,
    debounceDelay: 300,
    maxResults: 10
};

let debounceTimer;
let searchProfileInput;
let searchProfileBtn;
let searchLoader;
let searchMessage;
let searchResults;
let searchDropdown;

function debounceFunc(callback, delay = 300) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(callback, delay);
}

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

    inicializarBuscaPerfis();

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

        if (searchDropdown && 
            !searchDropdown.contains(e.target) && 
            !searchProfileInput.contains(e.target) &&
            !searchProfileBtn.contains(e.target)) {
            searchDropdown.classList.remove("show");
        }
    });

    const debouncedReposition = debounceFunc(() => {
        posicionarDropdown();
    }, window.CONFIG.DEBOUNCE_DELAY);

    window.addEventListener("resize", debouncedReposition);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (dropdownMenu.classList.contains("show")) {
                dropdownMenu.classList.remove("show");
                btnMenu.classList.remove("active");
                btnMenu.setAttribute('aria-expanded', 'false');
                btnMenu.focus();
            }
            
            if (searchDropdown && searchDropdown.classList.contains("show")) {
                searchDropdown.classList.remove("show");
                searchProfileInput.focus();
            }
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
    profileLink.target = "_blank";
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
            
            if (data.foto_perfil) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.referrerPolicy = "no-referrer";
                
                img.onload = () => {
                    fotoPerfil.src = img.src;
                    fotoPerfil.loading = "eager";
                    fotoPerfil.setAttribute("crossorigin", "anonymous");
                    setFotoLoading(false);
                };
                img.onerror = () => {
                    fotoPerfil.src = window.CONFIG.DEFAULT_AVATAR;
                    fotoPerfil.loading = "eager";
                    setFotoLoading(false);
                };
                img.src = data.foto_perfil;
            } else {
                fotoPerfil.src = window.CONFIG.DEFAULT_AVATAR;
                fotoPerfil.loading = "eager";
                setFotoLoading(false);
            }
            
        } catch (err) {
            console.error("Erro ao carregar foto:", err);
            fotoPerfil.src = window.CONFIG.DEFAULT_AVATAR;
            fotoPerfil.loading = "eager";
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

function inicializarBuscaPerfis() {
    searchProfileInput = document.getElementById("searchProfileInput");
    searchProfileBtn = document.getElementById("searchProfileBtn");
    searchLoader = document.getElementById("searchLoader");
    searchMessage = document.getElementById("searchMessage");
    searchResults = document.getElementById("searchResults");
    searchDropdown = document.getElementById("searchDropdown");

    if (!searchProfileInput || !searchProfileBtn) {
        console.warn("⚠️ Elementos de busca não encontrados");
        return;
    }

    searchProfileBtn.addEventListener("click", () => {
        executarBuscaPerfil();
    });

    searchProfileInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            executarBuscaPerfil();
        }
    });

    searchProfileInput.addEventListener("focus", () => {
        if (searchResults.children.length > 0) {
            searchDropdown.classList.add("show");
        }
    });

    searchProfileInput.addEventListener("input", (e) => {
        const username = e.target.value.trim();

        if (username.length < SEARCH_CONFIG.minUsernameLength) {
            limparResultados();
            searchDropdown.classList.remove("show");
            return;
        }

        debounceSearchFunc(() => {
            executarBuscaPerfil(username);
        });
    });
}

async function executarBuscaPerfil(username = null) {
    username = username || searchProfileInput.value.trim();

    try {
        username = validarUsername(username);
    } catch (error) {
        mostrarSearchMensagem(error.message, "error");
        searchResults.innerHTML = "";
        searchDropdown.classList.add("show");
        return;
    }

    searchProfileBtn.disabled = true;
    searchLoader.classList.add("active");
    searchDropdown.classList.add("show");

    try {
        const usuarios = await buscarUsuarios(username);

        if (!usuarios || usuarios.length === 0) {
            mostrarSearchMensagem("Nenhum usuário encontrado", "info");
            searchResults.innerHTML =
                '<div class="search-no-results">😔 Nenhum resultado encontrado</div>';
            return;
        }

        searchResults.innerHTML = "";
        usuarios.forEach((usuario, index) => {
            if (usuario && usuario.username) {
                const resultItem = renderPerfilEncontrado(usuario);
                if (resultItem) {
                    resultItem.style.animationDelay = `${index * 0.05}s`;
                    searchResults.appendChild(resultItem);
                }
            }
        });

        const resultadosValidos = searchResults.children.length;
        if (resultadosValidos === 0) {
            mostrarSearchMensagem("Nenhum usuário encontrado", "info");
            searchResults.innerHTML =
                '<div class="search-no-results">😔 Nenhum resultado encontrado</div>';
        } else {
            mostrarSearchMensagem(
                `${resultadosValidos} resultado(s) encontrado(s)`,
                "info"
            );
        }
    } catch (error) {
        console.error("Erro na busca:", error);
        mostrarSearchMensagem(
            error.message || "Erro ao buscar perfis",
            "error"
        );
    } finally {
        searchProfileBtn.disabled = false;
        searchLoader.classList.remove("active");
    }
}

function renderPerfilEncontrado(usuario) {
    const profileDiv = document.createElement("div");
    profileDiv.className = "search-profile-result";

    if (!usuario || !usuario.username) {
        console.warn("Dados de usuário inválidos:", usuario);
        return null;
    }

    const avatar =
        usuario.foto_perfil || criarAvatarPadrao(usuario.username);

    let linksCount = 0;
    if (usuario.links_count !== undefined) {
        linksCount = usuario.links_count;
    } else if (Array.isArray(usuario.links)) {
        linksCount = usuario.links.length;
    }
    
    const links = Array.isArray(usuario.links) ? usuario.links : [];

    profileDiv.innerHTML = `
        <div class="profile-result-content">
            <img 
                src="${avatar}" 
                alt="Foto de ${escapeHtml(usuario.username)}" 
                class="profile-result-avatar"
                loading="eager"
                referrerpolicy="no-referrer"
                crossorigin="anonymous"
                onerror="this.src='${criarAvatarPadrao(usuario.username)}'">
            <div class="profile-result-details">
                <h4>${escapeHtml(usuario.username)}</h4>
                <p class="profile-links-count">
                    🔗 ${linksCount} link${linksCount !== 1 ? "s" : ""}
                </p>
                ${links && links.length > 0 ? `
                <div class="profile-links-preview">
                    ${links
                        .slice(0, 3)
                        .map(
                            (link) =>
                                `<span class="link-preview-tag" title="${escapeHtml(
                                    link.titulo || "Sem título"
                                )}">${escapeHtml(
                                    link.titulo || "Sem título"
                                )}</span>`
                        )
                        .join("")}
                </div>` : ''}
            </div>
        </div>
        <button 
            class="profile-visit-btn" 
            data-username="${usuario.username}"
            aria-label="Visitar perfil de ${usuario.username}">
            Visitar →
        </button>
    `;

    const visitBtn = profileDiv.querySelector(".profile-visit-btn");
    if (visitBtn) {
        visitBtn.addEventListener("click", () => {
            navegarParaPerfil(usuario.username);
        });
    }

    return profileDiv;
}

async function buscarUsuarios(searchTerm) {
    try {
        if (
            !searchTerm ||
            searchTerm.length < SEARCH_CONFIG.minUsernameLength
        ) {
            return [];
        }

        const response = await fetch(
            `${API_URL}/user/${encodeURIComponent(searchTerm)}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                return [];
            } else if (response.status >= 500) {
                throw new Error("Erro no servidor ao buscar usuário");
            }
        }

        const data = await response.json();
        
        console.log("Dados recebidos do servidor:", data);
        
        return data ? [data] : [];
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        return [];
    }
}

function validarUsername(username) {
    username = username.trim().toLowerCase();

    if (!username) {
        throw new Error("Digite um nome de usuário");
    }

    if (username.length < SEARCH_CONFIG.minUsernameLength) {
        throw new Error(
            `Username deve ter pelo menos ${SEARCH_CONFIG.minUsernameLength} caracteres`
        );
    }

    if (username.length > 20) {
        throw new Error("Username muito longo (máximo 20 caracteres)");
    }

    if (!/^[a-z0-9\s_-]+$/.test(username)) {
        throw new Error("Username contém caracteres inválidos");
    }

    return username;
}

function debounceSearchFunc(callback, delay = SEARCH_CONFIG.debounceDelay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(callback, delay);
}

function limparResultados() {
    if (searchResults) searchResults.innerHTML = "";
    if (searchMessage) searchMessage.textContent = "";
}

function navegarParaPerfil(username) {
    window.location.href = `${API_URL}/${encodeURIComponent(username)}`;
}

function escapeHtml(text) {
    if (!text || typeof text !== "string") {
        return "";
    }

    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

function criarAvatarPadrao(username) {
    const letra = username.charAt(0).toUpperCase();
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23667eea'/%3E%3Ctext x='50' y='60' font-size='50' fill='white' font-weight='bold' text-anchor='middle'%3E${letra}%3C/text%3E%3C/svg%3E`;
}

function mostrarSearchMensagem(texto, tipo = "info") {
    if (!searchMessage) return;

    searchMessage.textContent = texto;
    searchMessage.className = `search-message ${tipo}`;
    searchMessage.setAttribute("role", "alert");
}

function isValidUrl(string) {
    try {
        const url = new URL(string.startsWith('http') ? string : `https://${string}`);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}
