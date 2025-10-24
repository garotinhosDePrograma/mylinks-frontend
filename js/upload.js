document.addEventListener("DOMContentLoaded", () => {
    // Garante que o usuário está logado
    auth.verificarLogin();

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

    // Mostra prévia da imagem
    fotoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => (preview.src = reader.result);
            reader.readAsDataURL(file);
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
            } else {
                mensagem.style.color = "red";
                mensagem.textContent = data.error || data.message || "Erro ao enviar foto.";
            }
        } catch (error) {
            console.error("Erro:", error);
            mensagem.style.color = "red";
            mensagem.textContent = "Falha na conexão com o servidor.";
        }
    });

    voltarBtn.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });
});