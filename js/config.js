const CONFIG = {
    API_URL: "https://pygre.onrender.com",
    DEFAULT_AVATAR: "assets/default-avatar.png",
    TOKEN_EXP_TIME: 15 * 60 * 1000,

    ERRORS: {
        NETWORK: "Erro de conexão. Verifique a internet.",
        UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
        FORBIDDEN: "Você não tem permissão para essa ação.",
        SERVER: "Erro no servidor. Tente novamente mais tarde.",
        NOT_FOUND: "Recurso não encontrado.",
        INVALID_URL: "URL inválida. Use o formato: https://exemplo.com",
        OFFLINE: "Você está offline. Conecte-se à internet."
    },

    SUCCESS: {
        LINK_CREATED: "Link adicionado com sucesso!",
        LINK_UPDATED: "Link atualizado com sucesso!",
        LINK_DELETED: "Link excluído com sucesso!",
        PROFILE_UPDATED: "Perfil atualizado com sucesso!",
        PHOTO_UPLOADED: "Foto enviada com sucesso!",
        LINK_COPIED: "Link copiado para a área de transferência!"
    },

    VALIDATION: {
        MIN_USERNAME_LENGTH: 3,
        MAX_USERNAME_LENGTH: 20,
        MIN_PASSWORD_LENGTH: 6,
        MAX_FILE_SIZE: 15 * 1024 * 1024,
        ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg'],
        BLOCKED_DOMAINS: ['malicious.com', 'spam.com']
    },

    DEBOUNCE_DELAY: 250
};

window.CONFIG = CONFIG;

window.debounce = (() => {
    const timers = new Map();

    return (fn, delay = 300, key = 'default') => {
        return function(...args) {
            if (timers.has(key)) {
                clearTimeout(timers.get(key));
            }

            const timer = setTimeout(() => {
                fn.apply(this, args);
                timers.delete(key);
            }, delay);

            timers.set(key, timer);
        };
    };
})();