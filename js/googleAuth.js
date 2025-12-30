// js/googleAuth.js - VERSÃO CORRIGIDA

const googleAuth = {
    // ❌ REMOVER: Este método redireciona para o backend (causando o erro)
    // async loginWithRedirect() { ... }
    
    // ✅ MANTER: Este é o método correto para SPAs
    initGoogleIdentityServices(onSuccess, onError) {
        if (!document.getElementById('google-identity-script')) {
            const script = document.createElement('script');
            script.id = 'google-identity-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                setTimeout(() => this.setupGoogleButton(onSuccess, onError), 100);
            };
            
            script.onerror = () => {
                if (onError) onError(new Error('Falha ao carregar Google Identity Services'));
            };
            
            document.head.appendChild(script);
        } else {
            setTimeout(() => {
                if (typeof google !== 'undefined') {
                    this.setupGoogleButton(onSuccess, onError);
                } else {
                    setTimeout(() => this.setupGoogleButton(onSuccess, onError), 500);
                }
            }, 100);
        }
    },

    setupGoogleButton(onSuccess, onError) {
        if (typeof google === 'undefined') {
            if (onError) onError(new Error('Google não disponível'));
            return;
        }

        const buttonContainer = document.getElementById('google-signin-button');
        if (!buttonContainer) {
            if (onError) onError(new Error('Container não encontrado'));
            return;
        }

        try {
            // Inicializa o Google Identity Services
            google.accounts.id.initialize({
                client_id: window.CONFIG.GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    try {
                        await this.handleGoogleCredential(response.credential);
                        if (onSuccess) onSuccess();
                    } catch (error) {
                        if (onError) onError(error);
                    }
                },
                use_fedcm_for_prompt: true,
                auto_select: false,
                cancel_on_tap_outside: true,
                itp_support: true
            });

            // Cria o botão personalizado
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

            const customButton = document.getElementById('customGoogleButton');
            if (customButton) {
                customButton.addEventListener('click', () => {
                    // ✅ Usa o prompt do Google (popup) em vez de redirect
                    google.accounts.id.prompt((notification) => {
                        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            console.log('Google One Tap não foi exibido:', notification.getNotDisplayedReason());
                        }
                    });
                });
            }
        } catch (error) {
            if (onError) onError(error);
        }
    },

    async handleGoogleCredential(idToken) {
        try {
            // Envia o token para o endpoint mobile da API
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
            console.error('Erro ao processar credencial:', error);
            networkMonitor.error(
                "Erro no Login",
                error.message || "Falha ao autenticar com Google",
                5000
            );
            throw error;
        }
    }
};

window.googleAuth = googleAuth;

// Inicializa quando a página carrega
if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        googleAuth.initGoogleIdentityServices(
            () => {
                console.log("Login com Google bem-sucedido");
            },
            (error) => {
                console.error("Erro no login com Google:", error);
                networkMonitor.error(
                    "Erro no Login",
                    "Não foi possível carregar o login com Google. Tente novamente mais tarde.",
                    5000
                );
            }
        );
    });
}
