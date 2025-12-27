class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = new Set();
        this.init();
    }

    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyListeners('online');
            this.showNotification('Conexão restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyListeners('offline');
            this.showNotification('Sem conexão', 'warning');
        });
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(status) {
        this.listeners.forEach(callback => callback(status));
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `network-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            background: ${type === 'success' ? '#4caf50' : '#ff9800'};
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

window.networkMonitor = new NetworkMonitor();