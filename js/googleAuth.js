const googleAuth = {
    // Função para mostrar mensagens na tela (já que não tem console)
    showDebug(message, type = 'info') {
        const debugDiv = document.getElementById('debug-messages') || this.createDebugContainer();
        const msgElement = document.createElement('div');
        msgElement.style.padding = '10px';
        msgElement.style.margin = '5px 0';
        msgElement.style.borderRadius = '5px';
        msgElement.style.fontSize = '12px';
        
        if (type === 'error') {
            msgElement.style.backgroundColor = '#ffebee';
            msgElement.style.color = '#c62828';
        } else if (type === 'success') {
            msgElement.style.backgroundColor = '#e8f5e9';
            msgElement.style.color = '#2e7d32';
        } else {
            msgElement.style.backgroundColor = '#e3f2fd';
            msgElement.style.color = '#1565c0';
        }
        
        msgElement.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        debugDiv.appendChild(msgElement);
        
        // Scroll automático para última mensagem
        debugDiv.scrollTop = debugDiv.scrollHeight;
        
        // Limita a 10 mensagens
        if (debugDiv.children.length > 10) {
            debugDiv.removeChild(debugDiv.firstChild);
        }
    },
    
    createDebugContainer() {
        const container = document.createElement('div');
        container.id = 'debug-messages';
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.left = '10px';
        container.style.right = '10px';
        container.style.maxHeight = '200px';
        container.style.overflow = 'auto';
        container.style.backgroundColor = 'rgba(0,0,0,0.8)';
        container.style.color = 'white';
        container.style.padding = '10px';
        container.style.borderRadius = '10px';
        container.style.zIndex = '999999';
        container.style.fontSize = '11px';
        document.body.appendChild(container);
        return container;
    },

    async loginWithRedirect() {
        try {
            this.showDebug('Iniciando login com redirecionamento...');
            const response = await fetch(`${API_URL}/auth/google`);
            const data = await response.json();
            
            if (data.auth_url) {
                storage.set("google_oauth_state", data.state, 5 * 60 * 1000);
                this.showDebug('Redirecionando para Google...', 'success');
                window.location.href = data.auth_url;
            } else {
                throw new Error("URL de autenticação não recebida");
            }
        } catch (error) {
            this.showDebug(`Erro: ${error.message}`, 'error');
            throw new Error("Não foi possível conectar com o Google");
        }
    },

    handleCallback() {
        const params = new URLSearchParams(window.location.search);
        
        this.showDebug('Verificando callback do Google...');
        
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const userId = params.get("user_id");
        const username = params.get("username");
        const email = params.get("email");
        const fotoPerfil = params.get("foto_perfil");
        const error = params.get("error");
        
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (error) {
            const errorMessages = {
                "access_denied": "Você negou o acesso ao Google",
                "no_code": "Código de autorização não recebido",
                "no_email": "Não foi possível obter seu email do Google",
                "google_error": "Erro ao comunicar com o Google",
                "server_error": "Erro no servidor"
            };
            
            this.showDebug(`Erro no callback: ${errorMessages[error]}`, 'error');
            throw new Error(errorMessages[error] || "Erro desconhecido ao fazer login com Google");
        }
        
        if (accessToken && refreshToken && userId) {
            this.showDebug('Tokens recebidos! Salvando...', 'success');
            
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
            
            this.showDebug('Login concluído! Tokens salvos.', 'success');
            return true;
        }
        
        this.showDebug('Nenhum token encontrado no callback');
        return false;
    },

    initGoogleIdentityServices(onSuccess, onError) {
        this.showDebug('Iniciando Google Identity Services...');
        
        if (!document.getElementById('google-identity-script')) {
            const script = document.createElement('script');
            script.id = 'google-identity-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                this.showDebug('Script do Google carregado!', 'success');
                setTimeout(() => this.setupGoogleButton(onSuccess, onError), 100);
            };
            
            script.onerror = () => {
                this.showDebug('ERRO ao carregar script do Google', 'error');
                if (onError) onError(new Error('Falha ao carregar Google Identity Services'));
            };
            
            document.head.appendChild(script);
        } else {
            this.showDebug('Script do Google já existe');
            setTimeout(() => {
                if (typeof google !== 'undefined') {
                    this.setupGoogleButton(onSuccess, onError);
                } else {
                    this.showDebug('Aguardando Google ficar disponível...');
                    setTimeout(() => this.setupGoogleButton(onSuccess, onError), 500);
                }
            }, 100);
        }
    },

    setupGoogleButton(onSuccess, onError) {
        this.showDebug('Configurando botão do Google...');
        
        if (typeof google === 'undefined') {
            this.showDebug('Google Identity Services não disponível!', 'error');
            if (onError) onError(new Error('Google não disponível'));
            return;
        }

        const buttonContainer = document.getElementById('google-signin-button');
        if (!buttonContainer) {
            this.showDebug('Container do botão não encontrado!', 'error');
            if (onError) onError(new Error('Container não encontrado'));
            return;
        }

        try {
            // Inicializar Google Identity
            google.accounts.id.initialize({
                client_id: window.CONFIG.GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    this.showDebug('Credencial do Google recebida!', 'success');
                    try {
                        await this.handleGoogleCredential(response.credential);
                        if (onSuccess) onSuccess();
                    } catch (error) {
                        this.showDebug(`Erro no login: ${error.message}`, 'error');
                        if (onError) onError(error);
                    }
                },
                use_fedcm_for_prompt: true,
                auto_select: false,
                cancel_on_tap_outside: true,
                itp_support: true
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
                customButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    this.showDebug('Botão clicado! Iniciando login...');
                    
                    // Em mobile, usar SEMPRE o redirect (mais confiável)
                    this.showDebug('Redirecionando para Google OAuth...', 'success');
                    await this.loginWithRedirect();
                });
                
                this.showDebug('Botão configurado com sucesso!', 'success');
            } else {
                this.showDebug('Falha ao criar botão customizado!', 'error');
                if (onError) onError(new Error('Falha ao criar botão'));
            }
        } catch (error) {
            this.showDebug(`Erro ao configurar: ${error.message}`, 'error');
            if (onError) onError(error);
        }
    },

    async handleGoogleCredential(idToken) {
        this.showDebug('Processando credencial do Google...');
        
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
                this.showDebug('Tokens recebidos do servidor!', 'success');
                
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

                this.showDebug('Login concluído! Redirecionando em 2s...', 'success');
                
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
            this.showDebug(`ERRO: ${error.message}`, 'error');
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
    googleAuth.showDebug('Página de login detectada!');
    
    document.addEventListener('DOMContentLoaded', () => {
        googleAuth.showDebug('DOM carregado! Inicializando...');
        
        // Processar callback se houver
        try {
            const hasTokens = googleAuth.handleCallback();
            if (hasTokens) {
                googleAuth.showDebug('Callback processado! Redirecionando...', 'success');
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
            googleAuth.showDebug(`Erro no callback: ${error.message}`, 'error');
            networkMonitor.error(
                "Erro no Login",
                error.message,
                5000
            );
        }
        
        // Inicializar botão do Google
        googleAuth.initGoogleIdentityServices(
            () => {
                googleAuth.showDebug('Login bem-sucedido!', 'success');
            },
            (error) => {
                googleAuth.showDebug(`Erro: ${error.message}`, 'error');
                networkMonitor.error(
                    "Erro no Login",
                    "Não foi possível carregar o login com Google.",
                    5000
                );
            }
        );
    });
}
