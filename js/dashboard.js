const API = "https://pygre.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
	const usernameSpan = document.getElementById("username");
	const fotoPerfil = document.getElementById("fotoPerfil");
	const btnLogout = document.getElementById("btnLogout");
	const btnUpload = document.getElementById("btnUpload");
	const linksList = document.getElementById("linksList");
	const formAddLink = document.getElementById("formAddLink");
	const tituloInput = document.getElementById("titulo");
	const urlInput = document.getElementById("url");

	const token = localStorage.getItem("token");
	if (!token) {
		window.location.href = "index.html";
		return;
	}

	async function getUserData() {
		try {
			const payload = JSON.parse(atob(token.split(".")[1]));
			const username = payload.username;

			const response = await fetch(`${API}/user/${username}`);
			const data = await response.json();

			usernameSpan.textContent = `@${data.username}`;
			fotoPerfil.src = data.foto_perfil ? `${API}${data.foto_perfil}` : "default-avatar.png";

			renderLinks(data.links);
		} catch (error) {
			console.error("Erro ao carregar perfil:", error);
			alert("Erro ao carregar dados do usuário. Faça login novamente.");
			localStorage.removeItem("token");
			window.location.href = "index.html";
		}
	}

	function renderLinks(links) {
		linksList.innerHTML = "";
		if (!links || links.length === 0) {
			linksList.innerHTML = "<li>Nenhum link adicionado ainda.</li>";
			return;
		}

		links.forEach(link => {
			const li = document.createElement("li");
			li.innerHTML = `
				<strong>${link.titulo}</strong><br>
				<a href="${link.url}" target="_blank">${link.url}</a><br>
				<button class="editar" data-id="${link.id}">Editar</button>
				<button class="excluir" data-id="${link.id}">Excluir</button>
			`;
			linksList.appendChild(li);
		});
	}

	formAddLink.addEventListener("submit", async (e) => {
		e.preventDefault();
		const titulo = tituloInput.value.trim();
		const url = urlInput.value.trim();

		if (!titulo || !url) return alert("Preencha todos os campos.");

		try {
			const response = await fetch(`${API}/links`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: JSON.stringify({ titulo, url })
			});

			const data = await response.json();

			if (response.ok) {
				alert("Link adicionado com sucesso!");
				formAddLink.reset();
				getUserData();
			} else {
				alert(data.message || "Erro ao adicionar link.");
			}
		} catch (error) {
			console.error(error);
			alert("Falha na conexão com o servidor.");
		}
	});

	linksList.addEventListener("click", async (e) => {
		const id = e.target.dataset.id;
		if (!id) return;

		if (e.target.classList.contains("excluir")) {
			if (confirm("Deseja realmente excluir este link?")) {
				await deleteLink(id);
			}
		}

		if (e.target.classList.contains("editar")) {
			const novoTitulo = prompt("Novo título:");
			const novaUrl = prompt("Nova URL:");
			if (novoTitulo && novaUrl) {
				await updateLink(id, novoTitulo, novaUrl);
			}
		}
	});

	async function deleteLink(id) {
		try {
			const response = await fetch(`${API}/links/${id}`, {
				method: "DELETE",
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});
			const data = await response.json();
			if (response.ok) {
				alert("Link removido com sucesso!");
				getUserData();
			} else {
				alert(data.message || "Erro ao remover link.");
			}
		} catch (error) {
			console.error(error);
			alert("Erro ao remover link.");
		}
	}

	async function updateLink(id, titulo, url) {
		try {
			const response = await fetch(`${API}/links/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: JSON.stringify({ titulo, url })
			});
			const data = await response.json();
			if (response.ok) {
				alert("Link atualizado!");
				getUserData();
			} else {
				alert(data.message || "Erro ao atualizar link.");
			}
		} catch (error) {
			console.error(error);
			alert("Erro ao atualizar link.");
		}
	}

	btnLogout.addEventListener("click", () => {
		localStorage.removeItem("token");
		window.location.href = "index.html";
	});

	btnUpload.addEventListener("click", () => {
		window.location.href = "upload.html";
	});
    
	getUserData();
});
