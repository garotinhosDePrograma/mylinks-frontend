class StorageManager {
    constructor() {
        this.prefix = "mylinks_";
    }

    set(key, value, expiresIn = null) {
        const data = {
            value: value,
            timestamp: Date.now(),
            expiresAt: expiresIn ? Date.now() + expiresIn : null
        };

        try {
            localStorage.setItem(
                this.prefix + key,
                JSON.stringify(data)
            );
            return true;
        } catch (e) {
            console.error("Storage error:", e);
            if (e.name === 'QuotaExceededError') {
                this.clearOldData();
                return this.set(key, value, expiresIn);
            }
            return false;
        }
    }

    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;

            const data = JSON.parse(item);

            if (data.expiresAt && Date.now() > data.expiresAt) {
                this.remove(key);
                return null;
            }

            return data.value;
        } catch (e) {
            console.error(
            "Storage error:", e);
            return null;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    clearOldData() {
        const keys = Object.keys(localStorage);
        const now = Date.now();

        keys.forEach(key => {
            if (!key.startsWith(this.prefix)) return;

            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data.expiresAt && now > data.expiresAt) {
                    localStorage.remove(key);
                }
            } catch (e) {
                localStorage.removeItem(key);
            }
        });
    }
}

window.storage = new StorageManager();