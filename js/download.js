let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    
    deferredPrompt = e;

    const installBtn = document.getElementById("installBtn");
    
    installBtn.disabled = false;

    installBtn.addEventListener("click", async () => {
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
            alert("MyLinks foi instalado com sucesso!");
        } else {
            alert("Instalação cancelada.");
        }
        
        deferredPrompt = null;
    });
});

const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;

if (isIos && !isInStandaloneMode) {
    setTimeout(() => {
        alert("📲 Para instalar o MyLinks no iPhone:\n\n1. Toque no botão de compartilhar (⬆️)\n2. Escolha 'Adicionar à Tela de Início'.");
    }, 1500);
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/service-worker.js")
            .then(() => console.log("Service Worker registrado com sucesso!"))
            .catch((err) => console.error("Falha ao registrar Service Worker:", err));
    });
}
