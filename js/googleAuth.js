const googleAuth = {
    async loginWithRedirect() {
        try {
            const response = await fetch(`${API_URL}/auth/google`);
            const data = await response.json();
            
            if (data.auth_url) {
                storage.set("google_oauth_state", data.state, 5 * 60 * 1000);
                window.location.href = data.auth_url;
            } else {
                throw new Error("URL de autenticação não recebida");
            }
        } catch (error) {
            console.error("Erro ao iniciar login com Google:", error);
            throw new Error("Não foi possível conectar com o Google");
        }
    },

    handleCallback() {
        const params = new URLSearchParams(window.location.search);
        
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const userId = params.get("user_id");
        const username = params.get("username");
        const email = params.get("email");
        const fotoPerfil = params.get("foto_perfil");
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
            
            throw new Error(errorMessages[error] || "Erro desconhecido ao fazer login com Google");
        }
        
        if (accessToken && refreshToken && userId) {
            const agora = Date.now();
            const expiraEm = agora + window.CONFIG.TOKEN_EXP_TIME;
            
            storage.set("accessToken", accessToken, window.CONFIG.TOKEN_EXP_TIME);
            storage.set("refreshToken", refreshToken, 7 * 24 * 60 * 60 * 1000);
            storage.set("tokenExp", expiraEm, window.CONFIG.TOKEN_EXP_TIME);
            
            const user = {
                id: parseInt(userId),
                username: username,
                email: email,
                foto_perfil: fotoPerfil || window.CONFIG.DEFAULT_AVATAR
            };
            
            storage.set("user", user, 7 * 24 * 60 * 60 * 1000);
            
            AppState.setState({ 
                user: user, 
                isAuthenticated: true 
            });
            
            return true;
        }
        
        return false;
    },

    initGoogleIdentityServices(onSuccess, onError) {
        console.log("🔄 Iniciando Google Identity Services...");
        
        if (!document.getElementById('google-identity-script')) {
            const script = document.createElement('script');
            script.id = 'google-identity-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                console.log("✅ Script do Google carregado");
                setTimeout(() => this.setupGoogleButton(onSuccess, onError), 100);
            };
            
            script.onerror = () => {
                console.error("❌ Erro ao carregar script do Google");
                if (onError) onError(new Error('Falha ao carregar Google Identity Services'));
            };
            
            document.head.appendChild(script);
        } else {
            console.log("Script do Google já existe");
            setTimeout(() => {
                if (typeof google !== 'undefined') {
                    this.setupGoogleButton(onSuccess, onError);
                } else {
                    console.warn("Google ainda não disponível, aguardando...");
                    setTimeout(() => this.setupGoogleButton(onSuccess, onError), 500);
                }
            }, 100);
        }
    },

    setupGoogleButton(onSuccess, onError) {
        console.log("🔧 Configurando botão do Google...");
        
        if (typeof google === 'undefined') {
            console.error('❌ Google Identity Services não está disponível');
            if (onError) onError(new Error('Google não disponível'));
            return;
        }

        const buttonContainer = document.getElementById('google-signin-button');
        if (!buttonContainer) {
            console.error('❌ Container do botão não encontrado');
            if (onError) onError(new Error('Container não encontrado'));
            return;
        }

        try {
            // Inicializar Google Identity Services
            google.accounts.id.initialize({
                client_id: window.CONFIG.GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    console.log("✅ Credencial do Google recebida");
                    try {
                        await this.handleGoogleCredential(response.credential);
                        if (onSuccess) onSuccess();
                    } catch (error) {
                        console.error('❌ Erro no login com Google:', error);
                        if (onError) onError(error);
                    }
                },
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // Criar botão customizado
            buttonContainer.innerHTML = `
                <button type="button" class="google-btn-custom" id="customGoogleButton">
                    <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Continuar com o Google</span>
                </button>
            `;

            // Adicionar evento ao botão
            const customButton = document.getElementById('customGoogleButton');
            if (customButton) {
                customButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log("🖱️ Botão Google clicado");
                    
                    // Disparar prompt do Google
                    google.accounts.id.prompt((notification) => {
                        if (notification.isNotDisplayed()) {
                            const reason = notification.getNotDisplayedReason();
                            console.log("⚠️ Prompt não exibido:", reason);
                            
                            if (reason === 'suppressed_by_user' || reason === 'tap_outside') {
                                networkMonitor.info(
                                    "Login Cancelado",
                                    "Você cancelou o login com Google",
                                    3000
                                );
                            } else {
                                networkMonitor.error(
                                    "Erro no Login",
                                    "Não foi possível abrir o login do Google. Tente novamente.",
                                    5000
                                );
                            }
                        } else if (notification.isSkippedMoment()) {
                            console.log("⏭️ Prompt ignorado:", notification.getSkippedReason());
                        } else {
                            console.log("✅ Prompt do Google exibido");
                        }
                    });
                });
                
                console.log("✅ Botão do Google configurado com sucesso");
            } else {
                console.error("❌ Falha ao criar botão customizado");
                if (onError) onError(new Error('Falha ao criar botão'));
            }
        } catch (error) {
            console.error("❌ Erro ao configurar botão:", error);
            if (onError) onError(error);
        }
    },

    async handleGoogleCredential(idToken) {
        console.log("🔐 Processando credencial do Google...");
        
        try {
            const response = await fetch(`${API_URL}/auth/google/mobile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_token: idToken })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao autenticar com Google');
            }

            const data = await response.json();

            if (data.access_token && data.refresh_token) {
                const agora = Date.now();
                const expiraEm = agora + window.CONFIG.TOKEN_EXP_TIME;

                storage.set("accessToken", data.access_token, window.CONFIG.TOKEN_EXP_TIME);
                storage.set("refreshToken", data.refresh_token, 7 * 24 * 60 * 60 * 1000);
                storage.set("tokenExp", expiraEm, window.CONFIG.TOKEN_EXP_TIME);
                storage.set("user", data.user, 7 * 24 * 60 * 60 * 1000);

                AppState.setState({ 
                    user: data.user, 
                    isAuthenticated: true 
                });

                console.log("✅ Login com Google bem-sucedido!");
                networkMonitor.success(
                    "Login Realizado",
                    "Redirecionando para o dashboard...",
                    2000
                );
                
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);
            } else {
                throw new Error('Tokens não recebidos do servidor');
            }
        } catch (error) {
            console.error('❌ Erro ao processar credencial:', error);
            networkMonitor.error(
                "Erro no Login",
                error.message || "Falha ao autenticar com Google",
                5000
            );
            throw error;
        }
    }
};

// Exportar para uso global
window.googleAuth = googleAuth;

// Auto-inicialização na página de login
if (window.location.pathname.includes('login.html')) {
    console.log("📄 Página de login detectada");
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log("🚀 DOM carregado, inicializando Google Auth...");
        
        // Processar callback se houver
        try {
            const hasTokens = googleAuth.handleCallback();
            if (hasTokens) {
                networkMonitor.success(
                    "Login com Google realizado!",
                    "Redirecionando...",
                    2000
                );
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                return;
            }
        } catch (error) {
            console.error('❌ Erro ao processar callback:', error);
            networkMonitor.error(
                "Erro no Login",
                error.message,
                5000
            );
        }
        
        // Inicializar botão do Google
        googleAuth.initGoogleIdentityServices(
            () => {
                console.log("✅ Login com Google bem-sucedido");
            },
            (error) => {
                console.error("❌ Erro no login com Google:", error);
                networkMonitor.error(
                    "Erro no Login",
                    "Não foi possível carregar o login com Google. Tente novamente mais tarde.",
                    5000
                );
            }
        );
    });
}
