class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = new Set();
        this.currentNotification = null;
        this.notificationQueue = [];
        this.init();
        this.injectStyles();
    }

    init() {
        window.addEventListener('online', () => {
            
        })
    }
}
