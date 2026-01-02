const API_URL = window.CONFIG.API_URL;

document.addEventListener("DOMContentLoaded", async () => {
    const mensagem = document.getElementById("mensagem");
    const usernameEl = document.getElementById("username");
    const fotoPerfil = document.getElementById("fotoPerfil");
    const linksList = document.getElementById("linksList");

    const params = new URLSearchParams(window.location.search);
    const username = params.get("user");

    function mostrarMensagem(texto, tipo = 'error') {
        mensagem.textContent = texto;
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
    }

    if (!username) {
        const errorMsg = "Usuário não especificado na URL.";
        networkMonitor.error("URL Inválida", errorMsg, 6000);
        mostrarMensagem(errorMsg, 'error');
        usernameEl.textContent = "Usuário não encontrado";
        return;
    }

    usernameEl.textContent = "Carregando...";
    fotoPerfil.style.opacity = "0.5";
    linksList.innerHTML = '<li class="empty-state"><p>Carregando links...</p></li>';

    try {
        const response = await fetch(`${API_URL}/user/${username}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Usuário não encontrado");
            } else if (response.status >= 500) {
                throw new Error(window.CONFIG.ERRORS.SERVER);
            } else {
                throw new Error(`Erro HTTP ${response.status}`);
            }
        }
        
        const data = await response.json();

        usernameEl.textContent = data.username;
        document.title = `${data.username} - MyLinks`;

        const img = new Image();
        img.onload = () => {
            fotoPerfil.src = img.src;
            fotoPerfil.style.opacity = "1";
        };
        img.onerror = () => {
            fotoPerfil.src = window.CONFIG.DEFAULT_AVATAR;
            fotoPerfil.style.opacity = "1";
        };
        img.src = data.foto_perfil || window.CONFIG.DEFAULT_AVATAR;
        
        fotoPerfil.alt = `Foto de perfil de ${data.username}`;

        if (data.links && Array.isArray(data.links) && data.links.length > 0) {
            linksList.innerHTML = "";
            
            data.links
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .forEach((link, index) => {
                    const li = document.createElement("li");
                    li.setAttribute('role', 'listitem');
                    
                    const a = document.createElement("a");
                    a.href = link.url.startsWith("http") ? link.url : `https://${link.url}`;
                    a.textContent = link.titulo;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.setAttribute('aria-label', `${link.titulo} - Abre em nova aba`);
                    
                    li.style.animationDelay = `${index * 0.1}s`;
                    
                    li.appendChild(a);
                    linksList.appendChild(li);
                });
            
            networkMonitor.success(
                "Perfil Carregado!",
                `${data.links.length} link${data.links.length !== 1 ? 's' : ''} encontrado${data.links.length !== 1 ? 's' : ''}`,
                3000
            );
        } else {
            linksList.innerHTML = '<li class="empty-state"><p>📭 Nenhum link encontrado.</p></li>';
            
            networkMonitor.info(
                "Perfil Vazio",
                `${data.username} ainda não adicionou nenhum link`,
                4000
            );
        }

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        
        if (error.name === 'TypeError') {
            networkMonitor.error(
                "Sem Conexão",
                window.CONFIG.ERRORS.OFFLINE,
                6000
            );
            mostrarMensagem(window.CONFIG.ERRORS.OFFLINE, 'error');
        } else if (error.message === "Usuário não encontrado") {
            networkMonitor.warning(
                "Usuário Não Encontrado",
                "Verifique se o username está correto",
                5000
            );
            mostrarMensagem("Usuário não encontrado. Verifique se o username está correto.", 'error');
        } else {
            networkMonitor.error(
                "Erro ao Carregar Perfil",
                error.message || "Falha ao carregar dados do usuário",
                5000
            );
            mostrarMensagem(error.message || "Falha ao carregar dados do usuário.", 'error');
        }
        
        usernameEl.textContent = username;
        fotoPerfil.src = window.CONFIG.DEFAULT_AVATAR;
        fotoPerfil.style.opacity = "1";
        linksList.innerHTML = '<li class="empty-state"><p>Não foi possível carregar os links.</p></li>';
    }
    
    const perfil = document.getElementById("perfil");
    if (perfil) {
        perfil.setAttribute('aria-label', `Perfil público de ${username}`);
    }
    
    const linksSection = document.getElementById("linksSection");
    if (linksSection) {
        linksSection.setAttribute('aria-label', 'Lista de links do perfil');
    }
    
    const metaDescription = document.createElement('meta');
    metaDescription.name = "description";
    metaDescription.content = `Veja todos os links de ${username} em um só lugar`;
    document.head.appendChild(metaDescription);
});
