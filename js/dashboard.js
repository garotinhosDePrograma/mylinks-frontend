const API_URL = "https://pygre.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    const mensagem = document.getElementById("mensagem");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const linkForm = document.getElementById("linkForm");
    const linksList = document.getElementById("linksList");
    const logoutBtn = document.getElementById("logoutBtn");
    const linkIdInput = document.getElementById("linkId");
    const saveBtn = document.getElementById("saveBtn");

    if (!token || !user) {
        window.location.href = "index.html";
        return;
    }

    usernameDisplay.textContent = `Olá, ${user.username}!`;

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
    });

    async function carregarLinks() {
        try {
            const response = await fetch(`${API_URL}/links`, {
                headers: { Authorization: `Bearer ${token}` }
            });

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

        if (links.length === 0) {
            linksList.innerHTML = "<li>Nenhum link adicionado ainda.</li>";
            return;
        }

        links
            .sort((a, b) => a.ordem - b.ordem)
            .forEach(link => {
                const li = document.createElement("li");
                li.style.marginBottom = "10px";

                const linkText = document.createElement("a");
                linkText.href = link.url;
                linkText.target = "_blank";
                linkText.textContent = `${link.titulo} → ${link.url}`;
                linkText.style.marginRight = "10px";

                const editBtn = document.createElement("button");
                editBtn.textContent = "Editar";
                editBtn.addEventListener("click", () => preencherFormulario(link));

                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Excluir";
                deleteBtn.addEventListener("click", () => excluirLink(link.id));

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

        if (!titulo || !url) {
            mensagem.style.color = "red";
            mensagem.textContent = "Preencha todos os campos.";
            return;
        }

        try {
            const method = id ? "PUT" : "POST";
            const endpoint = id ? `${API_URL}/links/${id}` : `${API_URL}/links`;

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
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
                mensagem.textContent = data.message || "Erro ao salvar link.";
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
            const response = await fetch(`${API_URL}/links/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok) {
                mensagem.style.color = "green";
                mensagem.textContent = data.message;
                carregarLinks();
            } else {
                mensagem.style.color = "red";
                mensagem.textContent = data.message || "Erro ao excluir link.";
            }
        } catch (error) {
            console.error(error);
            mensagem.style.color = "red";
            mensagem.textContent = "Falha ao excluir o link.";
        }
    }

    carregarLinks();
});