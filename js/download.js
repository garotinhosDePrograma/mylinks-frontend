function apertaBotao() {
    let deferredPrompt;

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;

        const installButton = document.getElementById("installBtn");
        document.body.appendChild(installButton);

        installButton.addEventListener("click", async () => {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                alert("App instalado com sucesso!");
            } else {
                alert("App não instalado.");
            }
            installButton.remove();
            deferredPrompt = null;
        });
    });
}