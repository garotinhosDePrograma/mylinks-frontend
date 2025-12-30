const googleAuth = {
    async loginWithRedirect() {
        try {
            const response = await fetch(`${API_URL}/auth/google`);
            const data = await response.json();

            if (data.auth_url) {
                storage.set("google_oauth_state", data.state, 5*60*1000);

                window.location.href = auth_url;
            } else {
                networkMonitor.error("ERRO", "URL de autenticação não recebida", 6000);
                throw new Error("URL de autenticação não recebida");
            }
        } catch (error) {
            console.error("Erro ao iniciar login com google:", error);
            networkMonitor.error("ERRO", "Não foi possível conectar com Google", 6000);
        }
    },

    handleCallback() {
        const params = new URLSearchParams(window.location.search);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const userId = params.get("user_id");
        const username = params.get("username");
        const email = params.get("email");
        const fotoPerfil = params.get("foto_perfol");
        const error = params.get("error");

        window.history.replaceState({}, document.title, window.location.pathname);

        if (error) {
            const errorMessages = {
                "access_denied": "Você negou o acesso ao Google",
                "no_code": "Código de autorização não recebido",
                "no_email": "Não foi possível obter seu email do Google",
                "google_error": "Erro ao comunicar com o Google",
                "server_error": "Erro no servidor"
            };

            networkMonitor.error("ERRO", errorMessages[error] || "Erro desconhecido ao fazer login", 6000);
        }

        if (accessToken && refreshToken && userId) {
            const agora = Date.now();
            const expiraEm = agora + window.CONFIG.TOKEN_EXP_TIME;

            storage.set("accessToken", accessToken, window.CONFIG.TOKEN_EXP_TIME);
            storage.set("refreshToken", refreshToken, 7*24*60*60*1000);
            storage.set("tokenExp", expiraEm, window.CONFIG.TOKEN_EXP_TIME);

            const user = {
                id: parseInt(userId),
                username: username,
                email: email,
                foto_perfil: fotoPerfil || window.CONFIG.DEFAULT_AVATAR
            };

            storage.set("user", user, 7*24*60*60*1000);

            AppState.setState({
                user: user,
                isAuthenticated: true
            });

            return true;
        }

        return false;
    },

    initGoogleIndentityServices(onSuccess, onError) {
        if (!document.getElementById('google-indentity-script')) {
            const script = document.createElement("script");
            script.id = 'google-indentity-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                this.setupGoogleButton(onSuccess, onError);
            };
            document.head.appendChild(script);
        } else {
            this.setupGoogleButton(onSuccess, onError);
        }
    },

    setupGoogleButton(onSuccess, onError) {
        if (typeof google === "undefined") {
            console.error("Google Indentity Services não carregado");
            if (onError) onError(new Error("Google não disponível"));
            return;
        }

        google.accounts.id.initialize({
            client_id: window.CONFIG.GOOGLE_CLIENT_ID,
            callback: async (response) => {
                try {
                    await this.handleGoogleCredential(response.credential);
                    if (onSuccess) onSuccess();
                } catch (error) {
                    console.error("Erro no login com Google:", console.error);
                    if (onError) onError(error);
                }
            },
            auto_select: false,
            cancel_on_tap_outside: true
        });

        const buttonContainer = document.getElementById('google-signin-button');
        if (buttonContainer) {
            google.accounts.id.renderButton(
                buttonContainer,
                {
                    theme: 'filled_blue',
                    size: 'large',
                    width: 250,
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                }
            );
        }

        google.accounts.id.prompt();
    },

    async handleGoogleCredential(idToken) {
        try {
            const response = await fetch(`${API_URL}/auth/google/mobile`, {
                method: "POST",
                headers: { "Content-Type": "application" },
                body: JSON.stringify({ id_token: idToken })
            });

            if (!response.ok) {
                const error = await response.json();
                networkMonitor.error("ERRO", error.error || "Erro ao autenticar com Google", 6000);
            }

            const data = await response.json();

            if (data.access_token && data.refresh_token) {
                const agora = Date.now();
                const expiraEm = agora + window.CONFIG.TOKEN_EXP_TIME;

                storage.set("accessToken", data.access_token, window.CONFIG.TOKEN_EXP_TIME);
                storage.set("refreshToken", data.refresh_token, 7*24*60*60*1000);
                storage.set("tokenExp", expiraEm, window.CONFIG.TOKEN_EXP_TIME);
                storage.set("user", data.user, 7*24*60*60*1000);

                AppState.setState({
                    user: data.user,
                    isAuthenticated: true
                });

                window.location.href = "dashboard.html";
            } else {
                networkMonitor.error("ERRO", "Tokens não recebidos do servidor", 6000);
            }
        } catch (error) {
            console.error("Erro ao processar credencial do Google:", error);
            networkMonitor.error("ERRO", error, 6000);
        }
    }
};

window.googleAuth = googleAuth;

if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            const hasTokens = googleAuth.handleCallback();
            if (hasTokens) {
                networkMonitor.success(
                    "Login com Google realizado com sucesso!",
                    "Redirecionando...",
                    2000
                );
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);
            }
        } catch (error) {
            console.error("Erro ao processar callback:", error);
            networkMonitor.error(
                "Erro no login",
                error.message,
                6000
            );
        }
    });
}
