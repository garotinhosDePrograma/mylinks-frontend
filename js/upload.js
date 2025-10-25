document.addEventListener("DOMContentLoaded", async () => {
    // Garante que o usuário está logado
    await auth.verificarLogin();

    const token = localStorage.getItem("accessToken");
    const uploadForm = document.getElementById("uploadForm");
    const fotoInput = document.getElementById("fotoInput");
    const preview = document.getElementById("preview");
    const mensagem = document.getElementById("mensagem");
    const voltarBtn = document.getElementById("voltarBtn");

    // Se não houver token, redireciona
    if (!token) {
        auth.logout();
        return;
    }

    // ✅ ADICIONADO: Carrega a foto atual do usuário
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        try {
            const response = await auth.fetchAutenticado(`${API_URL}/user/${user.username}`);
            if (response.ok) {
                const data = await response.json();
                if (data.foto_perfil) {
                    preview.src = data.foto_perfil;
                } else {
                    preview.src = window.CONFIG.DEFAULT_AVATAR;
                }
            }
        } catch (err) {
            console.error("Erro ao carregar foto atual:", err);
            preview.src = window.CONFIG.DEFAULT_AVATAR;
        }
    }

    // Mostra prévia da imagem
    fotoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            // Valida tipo de arquivo
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                mensagem.style.color = "red";
                mensagem.textContent = "Formato inválido. Use PNG, JPG ou JPEG.";
                fotoInput.value = "";
                return;
            }

            // Valida tamanho (máx 5MB)
            if (file.size > 15 * 1024 * 1024) {
                mensagem.style.color = "red";
                mensagem.textContent = "Imagem muito grande. Máximo: 15MB.";
                fotoInput.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = () => (preview.src = reader.result);
            reader.readAsDataURL(file);
            mensagem.textContent = "";
        }
    });

    // Envia foto para o servidor
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        mensagem.textContent = "";

        const file = fotoInput.files[0];
        if (!file) {
            mensagem.style.color = "red";
            mensagem.textContent = "Selecione uma imagem antes de enviar.";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";

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
                mensagem.style.color = "green";
                mensagem.textContent = "Foto enviada com sucesso!";
                preview.src = data.foto_perfil || preview.src;

                // Atualiza no localStorage o novo perfil
                const user = JSON.parse(localStorage.getItem("user"));
                if (user) {
                    user.foto_perfil = data.foto_perfil;
                    localStorage.setItem("user", JSON.stringify(user));
                }

                // Redireciona após 2 segundos
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);
            } else {
                mensagem.style.color = "red";
                mensagem.textContent = data.error || data.message || "Erro ao enviar foto.";
            }
        } catch (error) {
            console.error("Erro:", error);
            mensagem.style.color = "red";
            mensagem.textContent = "Falha na conexão com o servidor.";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Enviar Foto";
        }
    });

    voltarBtn.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });
});
