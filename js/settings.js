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

    function showMessage(element, message, type, duration = 5000) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.setAttribute('role', 'alert');
        
        if (type === "success" && duration > 0) {
            setTimeout(() => {
                element.textContent = "";
                element.className = "message";
            }, duration);
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function toggleFormButton(form, disabled, loadingText = null) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = disabled;
            if (disabled && loadingText) {
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = loadingText;
                submitBtn.setAttribute('aria-busy', 'true');
            } else if (!disabled && submitBtn.dataset.originalText) {
                submitBtn.textContent = submitBtn.dataset.originalText;
                delete submitBtn.dataset.originalText;
                submitBtn.setAttribute('aria-busy', 'false');
            }
        }
    }

    usernameForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const newUsername = document.getElementById("newUsername").value.trim();
        const password = document.getElementById("usernamePassword").value;

        usernameMessage.textContent = "";
        usernameMessage.className = "message";

        const { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH } = window.CONFIG.VALIDATION;

        if (newUsername.length < MIN_USERNAME_LENGTH) {
            showMessage(usernameMessage, `Username deve ter no mínimo ${MIN_USERNAME_LENGTH} caracteres`, "error", 0);
            return;
        }

        if (newUsername.length > MAX_USERNAME_LENGTH) {
            showMessage(usernameMessage, `Username deve ter no máximo ${MAX_USERNAME_LENGTH} caracteres`, "error", 0);
            return;
        }

        if (newUsername === user.username) {
            showMessage(usernameMessage, "O novo username é igual ao atual", "info", 0);
            return;
        }

        if (!/^[a-zA-Z0-9\s_-]+$/.test(newUsername)) {
            showMessage(usernameMessage, "Username deve conter apenas letras, números, _ e -", "error", 0);
            return;
        }

        toggleFormButton(usernameForm, true, "Salvando...");

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
            showMessage(usernameMessage, error.message || window.CONFIG.ERRORS.NETWORK, "error", 0);
        } finally {
            toggleFormButton(usernameForm, false);
        }
    });

    emailForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const newEmail = document.getElementById("newEmail").value.trim();
        const password = document.getElementById("emailPassword").value;

        emailMessage.textContent = "";
        emailMessage.className = "message";

        if (!isValidEmail(newEmail)) {
            showMessage(emailMessage, "E-mail inválido", "error", 0);
            return;
        }

        if (newEmail === user.email) {
            showMessage(emailMessage, "O novo e-mail é igual ao atual", "info", 0);
            return;
        }

        toggleFormButton(emailForm, true, "Salvando...");

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
            showMessage(emailMessage, error.message || window.CONFIG.ERRORS.NETWORK, "error", 0);
        } finally {
            toggleFormButton(emailForm, false);
        }
    });

    passwordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        passwordMessage.textContent = "";
        passwordMessage.className = "message";

        const { MIN_PASSWORD_LENGTH } = window.CONFIG.VALIDATION;

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            showMessage(passwordMessage, `A nova senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`, "error", 0);
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage(passwordMessage, "As senhas não coincidem", "error", 0);
            return;
        }

        if (currentPassword === newPassword) {
            showMessage(passwordMessage, "A nova senha deve ser diferente da atual", "info", 0);
            return;
        }

        toggleFormButton(passwordForm, true, "Salvando...");

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
            showMessage(passwordMessage, error.message || window.CONFIG.ERRORS.NETWORK, "error", 0);
        } finally {
            toggleFormButton(passwordForm, false);
        }
    });

    btnDeleteAccount.addEventListener("click", async () => {
        dangerMessage.textContent = "";
        dangerMessage.className = "message";

        const confirmacao1 = confirm(
            "⚠️ ATENÇÃO!\n\nVocê está prestes a EXCLUIR sua conta permanentemente.\n\nTodos os seus dados, links e configurações serão perdidos para sempre.\n\nDeseja continuar?"
        );

        if (!confirmacao1) return;

        const confirmacao2 = prompt(
            `Para confirmar a exclusão, digite seu username abaixo:\n\n"${user.username}"`
        );

        if (confirmacao2 !== user.username) {
            showMessage(dangerMessage, "Username incorreto. Exclusão cancelada.", "info", 0);
            return;
        }

        const senha = prompt("Digite sua senha para confirmar a exclusão:");

        if (!senha) {
            showMessage(dangerMessage, "Senha não fornecida. Exclusão cancelada.", "info", 0);
            return;
        }

        btnDeleteAccount.disabled = true;
        btnDeleteAccount.textContent = "Excluindo...";
        btnDeleteAccount.setAttribute('aria-busy', 'true');

        try {
            const response = await auth.fetchAutenticado(`${API_URL}/auth/delete-account`, {
                method: "DELETE",
                body: JSON.stringify({ password: senha })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Conta excluída com sucesso. Você será redirecionado para a página inicial.");
                auth.logout();
            } else {
                throw new Error(data.error || "Erro ao excluir conta");
            }

        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            showMessage(dangerMessage, error.message || window.CONFIG.ERRORS.NETWORK, "error", 0);
            btnDeleteAccount.disabled = false;
            btnDeleteAccount.textContent = "Excluir Conta Permanentemente";
            btnDeleteAccount.setAttribute('aria-busy', 'false');
        }
    });

    btnVoltar.setAttribute('aria-label', 'Voltar para o dashboard');
    btnDeleteAccount.setAttribute('aria-label', 'Excluir conta permanentemente - Ação irreversível');

    const newUsernameInput = document.getElementById("newUsername");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    
    if (newPasswordInput && confirmPasswordInput) {
        const validatePasswordMatch = debounce(() => {
            if (newPasswordInput.value && confirmPasswordInput.value) {
                if (newPasswordInput.value !== confirmPasswordInput.value) {
                    confirmPasswordInput.setCustomValidity("As senhas não coincidem");
                } else {
                    confirmPasswordInput.setCustomValidity("");
                }
            }
        }, 500);
        
        newPasswordInput.addEventListener("input", validatePasswordMatch);
        confirmPasswordInput.addEventListener("input", validatePasswordMatch);
    }
});
