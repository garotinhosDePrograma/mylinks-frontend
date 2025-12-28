class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = new Set();
        this.currentNotification = null;
        this.notificationQueue = [];
        this.isShowingNotification = false;
        this.init();
        this.injectStyles();
    }

    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyListeners('online');
            this.showNotification({
                title: '✅ Conexão Restaurada',
                message: 'Você está online novamente',
                type: 'success',
                duration: 4000,
                icon: '🌐'
            });
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyListeners('offline');
            this.showNotification({
                title: '⚠️ Sem Conexão',
                message: 'Verifique sua internet',
                type: 'warning',
                duration: 6000,
                icon: '📡'
            });
        });
    }

    injectStyles() {
        if (document.getElementById('network-monitor-styles')) return;

        const style = document.createElement('style');
        style.id = 'network-monitor-styles';
        style.textContent = `
            .network-notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            }

            .network-notification {
                pointer-events: all;
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(20px);
                border-radius: 16px;
                padding: 16px 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15),
                           0 2px 8px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                min-width: 300px;
                border-left: 4px solid;
                position: relative;
                overflow: hidden;
                animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            .network-notification::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, currentColor, transparent);
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .network-notification.success {
                border-left-color: #4caf50;
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(255, 255, 255, 0.98) 50%);
            }

            .network-notification.success::before {
                color: #4caf50;
            }

            .network-notification.warning {
                border-left-color: #ff9800;
                background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 255, 255, 0.98) 50%);
            }

            .network-notification.warning::before {
                color: #ff9800;
            }

            .network-notification.error {
                border-left-color: #f44336;
                background: linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(255, 255, 255, 0.98) 50%);
            }

            .network-notification.error::before {
                color: #f44336;
            }

            .network-notification.info {
                border-left-color: #2196f3;
                background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(255, 255, 255, 0.98) 50%);
            }

            .network-notification.info::before {
                color: #2196f3;
            }

            .network-notification-icon {
                font-size: 28px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.8);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                animation: bounce 0.6s ease;
            }

            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }

            .network-notification-content {
                flex: 1;
                min-width: 0;
            }

            .network-notification-title {
                font-size: 15px;
                font-weight: 700;
                color: #1a1a1a;
                margin: 0 0 4px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .network-notification-message {
                font-size: 13px;
                color: #666;
                margin: 0;
                line-height: 1.4;
            }

            .network-notification-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 20px;
                line-height: 1;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .network-notification-close:hover {
                background: rgba(0, 0, 0, 0.05);
                color: #333;
                transform: rotate(90deg);
            }

            .network-notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: currentColor;
                width: 100%;
                transform-origin: left;
                animation: progressBar linear forwards;
            }

            .network-notification.success .network-notification-progress {
                color: #4caf50;
            }

            .network-notification.warning .network-notification-progress {
                color: #ff9800;
            }

            .network-notification.error .network-notification-progress {
                color: #f44336;
            }

            .network-notification.info .network-notification-progress {
                color: #2196f3;
            }

            @keyframes progressBar {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .network-notification.closing {
                animation: slideOutRight 0.3s ease forwards;
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px) scale(0.9);
                    opacity: 0;
                }
            }

            @media (prefers-color-scheme: dark) {
                .network-notification {
                    background: rgba(30, 30, 46, 0.98);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                               0 2px 8px rgba(0, 0, 0, 0.2);
                }

                .network-notification.success {
                    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(30, 30, 46, 0.98) 50%);
                }

                .network-notification.warning {
                    background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(30, 30, 46, 0.98) 50%);
                }

                .network-notification.error {
                    background: linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(30, 30, 46, 0.98) 50%);
                }

                .network-notification.info {
                    background: linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(30, 30, 46, 0.98) 50%);
                }

                .network-notification-title {
                    color: #e0e0e0;
                }

                .network-notification-message {
                    color: #b0b0b0;
                }

                .network-notification-icon {
                    background: rgba(255, 255, 255, 0.1);
                }

                .network-notification-close {
                    color: #999;
                }

                .network-notification-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #e0e0e0;
                }
            }

            @media (max-width: 768px) {
                .network-notification-container {
                    left: 10px;
                    right: 10px;
                    top: 10px;
                    max-width: none;
                }

                .network-notification {
                    min-width: auto;
                    width: 100%;
                    padding: 14px 16px;
                }

                .network-notification-icon {
                    font-size: 24px;
                    width: 36px;
                    height: 36px;
                }

                .network-notification-title {
                    font-size: 14px;
                }

                .network-notification-message {
                    font-size: 12px;
                }
            }

            .network-notification.warning .network-notification-icon {
                animation: bounce 0.6s ease, pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { 
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                50% { 
                    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.4),
                               0 0 0 8px rgba(255, 152, 0, 0.1);
                }
            }

            .network-notification.success .network-notification-icon {
                animation: bounce 0.6s ease, checkmark 0.8s ease;
            }

            @keyframes checkmark {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }

            @media (prefers-reduced-motion: reduce) {
                .network-notification,
                .network-notification-icon,
                .network-notification-close {
                    animation: none !important;
                    transition: none !important;
                }

                .network-notification::before {
                    animation: none !important;
                }
            }
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'network-notification-container';
        container.className = 'network-notification-container';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-label', 'Notificações do sistema');
        document.body.appendChild(container);
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(status) {
        this.listeners.forEach(callback => callback(status));
    }

    showNotification(options) {
        const {
            title = 'Notificação',
            message = '',
            type = 'info',
            duration = 5000,
            icon = 'ℹ️'
        } = options;

        if (this.isShowingNotification && this.currentNotification) {
            this.notificationQueue.push(options);
            return;
        }

        this.isShowingNotification = true;

        const container = document.getElementById('network-notification-container');
        if (!container) {
            console.error('Container de notificações não encontrado');
            return;
        }

        const notification = document.createElement('div');
        notification.className = `network-notification ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');

        notification.innerHTML = `
            <div class="network-notification-icon">${icon}</div>
            <div class="network-notification-content">
                <h4 class="network-notification-title">${title}</h4>
                ${message ? `<p class="network-notification-message">${message}</p>` : ''}
            </div>
            <button 
                class="network-notification-close" 
                aria-label="Fechar notificação"
                title="Fechar">
                ×
            </button>
            ${duration > 0 ? `<div class="network-notification-progress" style="animation-duration: ${duration}ms;"></div>` : ''}
        `;

        this.currentNotification = notification;
        container.appendChild(notification);

        const closeBtn = notification.querySelector('.network-notification-close');
        closeBtn.addEventListener('click', () => {
            this.closeNotification(notification);
        });

        if (duration > 0) {
            setTimeout(() => {
                this.closeNotification(notification);
            }, duration);
        }

        this.playNotificationSound(type);
    }

    closeNotification(notification) {
        if (!notification || !notification.parentElement) return;

        notification.classList.add('closing');
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
            
            this.currentNotification = null;
            this.isShowingNotification = false;

            if (this.notificationQueue.length > 0) {
                const next = this.notificationQueue.shift();
                setTimeout(() => this.showNotification(next), 300);
            }
        }, 300);
    }

    playNotificationSound(type) {
        if (!window.AudioContext && !window.webkitAudioContext) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const frequencies = {
                success: 800,
                warning: 600,
                error: 400,
                info: 700
            };

            oscillator.frequency.value = frequencies[type] || 700;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            
        }
    }

    success(title, message, duration = 4000) {
        this.showNotification({
            title,
            message,
            type: 'success',
            duration,
            icon: '✅'
        });
    }

    error(title, message, duration = 6000) {
        this.showNotification({
            title,
            message,
            type: 'error',
            duration,
            icon: '❌'
        });
    }

    warning(title, message, duration = 6000) {
        this.showNotification({
            title,
            message,
            type: 'warning',
            duration,
            icon: '⚠️'
        });
    }

    info(title, message, duration = 5000) {
        this.showNotification({
            title,
            message,
            type: 'info',
            duration,
            icon: 'ℹ️'
        });
    }
}

window.networkMonitor = new NetworkMonitor();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkMonitor;
}
