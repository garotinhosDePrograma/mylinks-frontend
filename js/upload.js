document.addEventListener("DOMContentLoaded", async () => {
    await auth.verificarLogin();

    const token = storage.get("accessToken");
    const uploadForm = document.getElementById("uploadForm");
    const fotoInput = document.getElementById("fotoInput");
    const preview = document.getElementById("preview");
    const mensagem = document.getElementById("mensagem");
    const voltarBtn = document.getElementById("voltarBtn");

    if (!token) {
        auth.logout();
        return;
    }

    networkMonitor.subscribe((status) => {
        const botoes = document.querySelectorAll('button[type="submit"]');

        if (status === 'offline') {
            botoes.forEach(btn => {
                btn.disabled = true;
                btn.dataset.originalText = btn.textContent;
                btn.textContent = 'Offline';
            });
        } else {
            botoes.forEach(btn => {
                btn.disabled = false;
                if (btn.dataset.originalText) {
                    btn.textContent = btn.dataset.originalText;
                }
            });
        }
    });

    const user = storage.get("user");

    if (user) {
        try {
            preview.style.opacity = "0.5";
            
            const response = await auth.fetchAutenticado(`${API_URL}/user/${user.username}`);
            if (response.ok) {
                const data = await response.json();
                
                const img = new Image();
                img.onload = () => {
                    preview.src = img.src;
                    preview.style.opacity = "1";
                };
                img.onerror = () => {
                    preview.src = window.CONFIG.DEFAULT_AVATAR;
                    preview.style.opacity = "1";
                };
                img.src = data.foto_perfil || window.CONFIG.DEFAULT_AVATAR;
            } else {
                preview.src = window.CONFIG.DEFAULT_AVATAR;
                preview.style.opacity = "1";
            }
        } catch (err) {
            console.error("Erro ao carregar foto atual:", err);
            preview.src = window.CONFIG.DEFAULT_AVATAR;
            preview.style.opacity = "1";
        }
    }

    function mostrarMensagem(texto, tipo = 'info') {
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

    function validarArquivo(file) {
        const { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } = window.CONFIG.VALIDATION;
        
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            mostrarMensagem("Formato inválido. Use PNG, JPG ou JPEG.", 'error');
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
            mostrarMensagem(`Imagem muito grande. Máximo: ${maxSizeMB}MB.`, 'error');
            return false;
        }
        
        return true;
    }

    fotoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        
        if (!file) return;
        
        if (!validarArquivo(file)) {
            fotoInput.value = "";
            return;
        }

        preview.style.opacity = "0.5";
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                preview.src = img.src;
                preview.style.opacity = "1";
                mostrarMensagem(`Imagem selecionada: ${file.name}`, 'info');
            };
            img.onerror = () => {
                mostrarMensagem("Erro ao carregar prévia da imagem.", 'error');
                preview.style.opacity = "1";
                fotoInput.value = "";
            };
            img.src = event.target.result;
        };
        
        reader.onerror = () => {
            mostrarMensagem("Erro ao ler arquivo.", 'error');
            preview.style.opacity = "1";
            fotoInput.value = "";
        };
        
        reader.readAsDataURL(file);
    });

    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        mostrarMensagem("", 'info');

        const file = fotoInput.files[0];
        
        if (!file) {
            mostrarMensagem("Selecione uma imagem antes de enviar.", 'error');
            return;
        }
        
        if (!validarArquivo(file)) {
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
        submitBtn.setAttribute('aria-busy', 'true');
        
        preview.style.opacity = "0.5";

        try {
            const response = await fetch(`${API_URL}/auth/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                mostrarMensagem(window.CONFIG.SUCCESS.PHOTO_UPLOADED, 'success');
                
                if (data.foto_perfil) {
                    const img = new Image();
                    img.onload = () => {
                        preview.src = img.src;
                        preview.style.opacity = "1";
                    };
                    img.src = data.foto_perfil;

                    const user = storage.get("user"));
                    if (user) {
                        user.foto_perfil = data.foto_perfil;
                        localStorage.setItem("user", JSON.stringify(user));
                    }
                }

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);
                
            } else {
                throw new Error(data.error || data.message || "Erro ao enviar foto");
            }
            
        } catch (error) {
            console.error("Erro:", error);
            preview.style.opacity = "1";
            
            if (error.name === 'TypeError') {
                mostrarMensagem(window.CONFIG.ERRORS.OFFLINE, 'error');
            } else {
                mostrarMensagem(error.message || window.CONFIG.ERRORS.NETWORK, 'error');
            }
            
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Enviar Foto";
            submitBtn.setAttribute('aria-busy', 'false');
        }
    });

    voltarBtn.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    fotoInput.setAttribute('aria-label', 'Selecionar foto de perfil');
    voltarBtn.setAttribute('aria-label', 'Voltar para o dashboard');
    preview.setAttribute('alt', 'Prévia da foto de perfil');
});
