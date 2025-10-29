document.addEventListener("DOMContentLoaded", async () => {
    await auth.verificarLogin();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const btnVoltar = document.getElementById("btnVoltar");
    const currentUsername = document.getElementById("currentUsername");
    const currentEmail = document.getElementById("currentEmail");
    const usernameForm = document.getElementById("usernameForm");
    const emailForm = document.getElementById("emailForm");
    const passwordForm = document.getElementById("passwordForm");
    const btnDeleteAccount = document.getElementById("btnDeleteAccount");
    const usernameMessage = document.getElementById("usernameMessage");
    const emailMessage = document.getElementById("emailMessage");
    const passwordMessage = document.getElementById("passwordMessage");
    const dangerMessage = document.getElementById("dangerMessage");

    currentUsername.textContent = user.username || "N/A";
    currentEmail.textContent = user.email || "N/A";

    btnVoltar.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    usernameForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const newUsername = document.getElementById("newUsername").value.trim();
        const password = document.getElementById("usernamePassword").value;

        usernameMessage.textContent = "";
        usernameMessage.className = "message";

        if (newUsername.length < 3) {
            showMessage(usernameMessage, "Username deve ter no mínimo 3 caracteres", "error");
            return;
        }

        if (newUsername === user.username) {
            showMessage(usernameMessage, "O novo username é igual ao atual", "info");
            return;
        }

        const submitBtn = usernameForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Salvando...";

        try {
            const response = await auth.fetchAutenticado(`${API_URL}/auth/update-username`, {
                method: "PUT",
                body: JSON.stringify({ newUsername, password })
            });

            const data = await response.json();

            if (response.ok) {
                user.username = data.username;
                localStorage.setItem("user", JSON.stringify(user));
                currentUsername.textContent = data.username;
                usernameForm.reset();
                showMessage(usernameMessage, "Username atualizado com sucesso!", "success");
            } else {
                throw new Error(data.error || "Erro ao atualizar username");
            }

        } catch (error) {
            console.error("Erro ao atualizar username:", error);
            showMessage(usernameMessage, error.message || "Erro ao atualizar username", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Salvar Username";
        }
    });

    emailForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const newEmail = document.getElementById("newEmail").value.trim();
        const password = document.getElementById("emailPassword").value;

        emailMessage.textContent = "";
        emailMessage.className = "message";

        if (!isValidEmail(newEmail)) {
            showMessage(emailMessage, "E-mail inválido", "error");
            return;
        }

        if (newEmail === user.email) {
            showMessage(emailMessage, "O novo e-mail é igual ao atual", "info");
            return;
        }

        const submitBtn = emailForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Salvando...";

        try {
             const response = await auth.fetchAutenticado(`${API_URL}/auth/update-email`, {
                 method: "PUT",
                 body: JSON.stringify({ newEmail, password })
             });

             const data = await response.json();

             if (response.ok) {
                 user.email = newEmail;
                 localStorage.setItem("user", JSON.stringify(user));
                 currentEmail.textContent = newEmail;
                 emailForm.reset();
                 showMessage(emailMessage, "E-mail atualizado com sucesso!", "success");
             } else {
                 throw new Error(data.error || "Erro ao atualizar e-mail");
             }
        } catch (error) {
            console.error("Erro ao atualizar e-mail:", error);
            showMessage(emailMessage, error.message || "Erro ao atualizar e-mail", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Salvar E-mail";
        }
    });

    passwordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        passwordMessage.textContent = "";
        passwordMessage.className = "message";

        if (newPassword.length < 6) {
            showMessage(passwordMessage, "A nova senha deve ter no mínimo 6 caracteres", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage(passwordMessage, "As senhas não coincidem", "error");
            return;
        }

        if (currentPassword === newPassword) {
            showMessage(passwordMessage, "A nova senha deve ser diferente da atual", "info");
            return;
        }

        const submitBtn = passwordForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Salvando...";

        try {
            const response = await auth.fetchAutenticado(`${API_URL}/auth/update-password`, {
                method: "PUT",
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                passwordForm.reset();
                showMessage(passwordMessage, "Senha atualizada com sucesso!", "success");
            } else {
                throw new Error(data.error || "Erro ao atualizar senha");
            }

        } catch (error) {
            console.error("Erro ao atualizar senha:", error);
            showMessage(passwordMessage, error.message || "Erro ao atualizar senha", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Salvar Senha";
        }
    });

    btnDeleteAccount.addEventListener("click", async () => {
        dangerMessage.textContent = "";
        dangerMessage.className = "message";

        const confirmacao1 = confirm(
            "ATENÇÃO!\n\nVocê está prestes a EXCLUIR sua conta permanentemente.\n\nTodos os seus dados, links e configurações serão perdidos para sempre.\n\nDeseja continuar?"
        );

        if (!confirmacao1) return;

        const confirmacao2 = prompt(
            "Para confirmar a exclusão, digite seu username abaixo:\n\n" + user.username
        );

        if (confirmacao2 !== user.username) {
            showMessage(dangerMessage, "Username incorreto. Exclusão cancelada.", "info");
            return;
        }

        const senha = prompt("Digite sua senha para confirmar a exclusão:");

        if (!senha) {
            showMessage(dangerMessage, "Senha não fornecida. Exclusão cancelada.", "info");
            return;
        }

        btnDeleteAccount.disabled = true;
        btnDeleteAccount.textContent = "Excluindo...";

        try {
            const response = await auth.fetchAutenticado(`${API_URL}/auth/delete-account`, {
                method: "DELETE",
                body: JSON.stringify({ password: senha })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Conta excluída com sucesso. Você será redirecionado.");
                auth.logout();
            } else {
                throw new Error(data.error || "Erro ao excluir conta");
            }

        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            showMessage(dangerMessage, error.message || "Erro ao excluir conta", "error");
            btnDeleteAccount.disabled = false;
            btnDeleteAccount.textContent = "Excluir Conta Permanentemente";
        }
    });
    
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
        
        if (type === "success") {
            setTimeout(() => {
                element.textContent = "";
                element.className = "message";
            }, 5000);
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});
