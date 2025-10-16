const API_URL = "https://pygre.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById("uploadForm");
    const fotoInput = document.getElementById("fotoInput");
    const preview = document.getElementById("preview");
    const mensagem = document.getElementById("mensagem");
    const voltarBtn = document.getElementById("voltarBtn");

    fotoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                preview.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    });

    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        mensagem.textContent = "";

        const token = localStorage.getItem("token");
        if (!token) {
            mensagem.style.color = "red";
            mensagem.textContent = "Você precisa estar logado para enviar uma foto.";
            return;
        }

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
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                mensagem.style.color = "green";
                mensagem.textContent = "Foto enviada com sucesso!";
                preview.src = `${API_URL}/${data.file_path}`;
            } else {
                mensagem.style.color = "red";
                mensagem.textContent = data.message || "Erro ao enviar foto.";
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