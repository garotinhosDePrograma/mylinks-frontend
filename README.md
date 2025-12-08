# 🌐 MyLinks - Frontend

Frontend da aplicação **MyLinks**, um agregador de links pessoal (estilo Linktree) onde usuários podem gerenciar e compartilhar seus links em uma página pública.

🔗 **Deploy**: [mylinks-352x.onrender.com](https://mylinks-352x.onrender.com)

---

## 🚀 Tecnologias

- **HTML5** (semântico e acessível)
- **CSS3** (responsivo, mobile-first)
- **JavaScript ES6+** (vanilla, modular)
- **PWA** (Progressive Web App - instalável)
- **Service Worker** (cache offline)
- **Fetch API** (integração com backend)

---

## 📂 Estrutura do Projeto

```
mylinks-frontend/
│
├── index.html              # Login
├── register.html           # Cadastro
├── dashboard.html          # Dashboard autenticado
├── profile.html            # Perfil público (/user?username=xxx)
├── settings.html           # Configurações da conta
├── upload.html             # Upload de foto
├── download.html           # Página de instalação PWA
│
├── css/                    # Estilos por página
│   ├── index.css
│   ├── register.css
│   ├── dashboard.css
│   ├── profile.css
│   ├── settings.css
│   └── upload.css
│
├── js/                     # Scripts modulares
│   ├── config.js           # Configurações centralizadas
│   ├── auth.js             # Autenticação JWT
│   ├── dashboard.js        # CRUD de links
│   ├── profile.js          # Exibição pública
│   ├── settings.js         # Edição de conta
│   └── upload.js           # Upload de foto
│
├── assets/
│   └── default-avatar.png  # Avatar padrão
│
├── icons/                  # Ícones PWA
│   ├── icon-192x192.png
│   └── icon-512x512.png
│
├── manifest.json           # Manifest PWA
├── service-worker.js       # Cache offline
└── render.yaml             # Configuração deploy Render
```

---

## 🎨 Funcionalidades

### **🔓 Públicas (Sem Login)**
- ✅ Visualizar perfil público de qualquer usuário (`/profile.html?user=username`)
- ✅ Clicar nos links e ser redirecionado

### **🔐 Autenticadas (Com Login)**
- ✅ **Cadastro** e **Login** com JWT
- ✅ **Dashboard** com CRUD completo de links
- ✅ **Reordenar** links (drag & drop visual)
- ✅ **Upload** de foto de perfil (Cloudinary)
- ✅ **Configurações**:
  - Alterar username
  - Alterar e-mail
  - Alterar senha
  - Excluir conta
- ✅ **Buscar** outros usuários no header
- ✅ **Copiar** link do perfil público
- ✅ **Logout** seguro

---

## 🔐 Autenticação

### **JWT com Refresh Token**
- **Access Token**: expira em 1 hora
- **Refresh Token**: expira em 7 dias
- Renovação automática transparente ao usuário

### **Fluxo de Autenticação**
```javascript
// 1. Login
POST /auth/login → { access_token, refresh_token, user }

// 2. Requisições protegidas
GET /links
Headers: { Authorization: "Bearer <access_token>" }

// 3. Renovação automática (quando access expira)
POST /auth/refresh → { access_token }
```

---

## 📱 PWA (Progressive Web App)

### **Instalável em Dispositivos Móveis**
- ✅ Manifest.json configurado
- ✅ Service Worker para cache
- ✅ Ícones adaptativos (192x192, 512x512)
- ✅ Funciona offline (páginas em cache)

### **Como Instalar**
1. Acesse [mylinks-352x.onrender.com](https://mylinks-352x.onrender.com)
2. No menu do navegador, clique em "Instalar MyLinks"
3. O app será adicionado à tela inicial do seu dispositivo

---

## 🎯 Responsividade

### **Breakpoints**
- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: 480px - 768px
- **Small Mobile**: < 480px

### **Abordagem Mobile-First**
```css
/* Base: Mobile */
.header { padding: 10px; }

/* Tablet+ */
@media (min-width: 768px) {
  .header { padding: 20px; }
}

/* Desktop+ */
@media (min-width: 1024px) {
  .header { padding: 40px; }
}
```

---

## ♿ Acessibilidade (WCAG 2.1)

- ✅ **ARIA Labels** (`aria-label`, `aria-live`, `aria-expanded`)
- ✅ **Roles semânticos** (`role="main"`, `role="alert"`)
- ✅ **Focus visível** (`:focus-visible`)
- ✅ **Textos alternativos** em imagens
- ✅ **Contraste adequado** (WCAG AA)
- ✅ **Redução de movimento** (`prefers-reduced-motion`)

---

## 🔧 Configuração Local

### **1. Clone o Repositório**
```bash
git clone https://github.com/seu-usuario/mylinks-frontend.git
cd mylinks-frontend
```

### **2. Configure o Backend**
Edite `js/config.js`:
```javascript
const CONFIG = {
    API_URL: "http://localhost:5000",  // Backend local
    // ou
    API_URL: "https://pygre.onrender.com"  // Backend em produção
};
```

### **3. Sirva os Arquivos**
```bash
# Opção 1: Python
python -m http.server 8000

# Opção 2: Node.js
npx http-server -p 8000

# Opção 3: Live Server (VS Code)
# Clique com botão direito em index.html → "Open with Live Server"
```

### **4. Acesse**
```
http://localhost:8000
```

---

## 🚀 Deploy (Render)

### **Automático via GitHub**
1. Conecte o repositório no [Render](https://render.com)
2. Escolha "Static Site"
3. Configure:
   - **Build Command**: `(deixe vazio)`
   - **Publish Directory**: `.`
4. Deploy automático a cada push

### **Arquivo render.yaml**
```yaml
services:
  - type: web
    name: mylinks
    env: static
    staticPublishPath: .
    buildCommand: ""
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

---

## 📡 Integração com Backend

### **Configuração da API**
Arquivo `js/config.js`:
```javascript
const CONFIG = {
    API_URL: "https://pygre.onrender.com",
    DEFAULT_AVATAR: "assets/default-avatar.png",
    TOKEN_EXP_TIME: 60 * 60 * 1000,  // 1 hora
    
    VALIDATION: {
        MIN_USERNAME_LENGTH: 3,
        MAX_USERNAME_LENGTH: 20,
        MIN_PASSWORD_LENGTH: 6,
        MAX_FILE_SIZE: 15 * 1024 * 1024,  // 15MB
        ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg']
    }
};
```

### **Exemplo de Requisição**
```javascript
// Listar links do usuário autenticado
const response = await auth.fetchAutenticado(`${API_URL}/links`);
const links = await response.json();
```

---

## 🎨 Design System

### **Paleta de Cores**
```css
:root {
  --primary: #667eea;      /* Roxo vibrante */
  --secondary: #764ba2;    /* Roxo escuro */
  --background: #0f0f23;   /* Azul muito escuro */
  --card: rgba(255,255,255,0.05);
  --text: #e0e0e0;
  --success: #4caf50;
  --error: #ff6b6b;
}
```

### **Tipografia**
- **Família**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Títulos**: 2-3rem, peso 700
- **Corpo**: 0.95-1rem, peso 400-500

---

## 🔍 Funcionalidades Avançadas

### **Busca de Usuários**
- Busca em tempo real no header
- Debounce de 300ms
- Exibe foto, username e preview de links
- Click para visitar perfil

### **Validações Client-Side**
```javascript
// URL
if (!isValidUrl(url)) {
  throw new Error("URL inválida. Use: https://exemplo.com");
}

// Username
if (username.length < 3 || username.length > 20) {
  throw new Error("Username deve ter entre 3 e 20 caracteres");
}

// Imagem
if (file.size > 15 * 1024 * 1024) {
  throw new Error("Imagem muito grande. Máximo: 15MB");
}
```

---

## 🐛 Tratamento de Erros

### **Mensagens de Erro Amigáveis**
```javascript
const ERRORS = {
    NETWORK: "Erro de conexão. Verifique sua internet.",
    UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
    SERVER: "Erro no servidor. Tente novamente mais tarde.",
    OFFLINE: "Você está offline. Conecte-se à internet."
};
```

### **Estados de Loading**
- Botões mostram "Salvando..." / "Enviando..."
- Spinners visuais durante requisições
- Desabilitação temporária de inputs

---

## 📊 Performance

### **Otimizações**
- ✅ **Lazy loading** em imagens (`loading="lazy"`)
- ✅ **Service Worker** para cache de assets
- ✅ **Debounce** em buscas e validações
- ✅ **Minificação** CSS (em produção)
- ✅ **Compressão** de imagens

### **Lighthouse Score (Objetivo)**
- Performance: 90+
- Acessibilidade: 95+
- Melhores Práticas: 95+
- SEO: 90+

---

## 🔗 Links Úteis

- **API Backend**: [pygre.onrender.com](https://pygre.onrender.com)
- **Repositório API**: [mylinks-api](https://github.com/seu-usuario/mylinks-api)
- **Repositório DB**: [mylinks-db](https://github.com/seu-usuario/mylinks-db)
- **Deploy Frontend**: [mylinks-352x.onrender.com](https://mylinks-352x.onrender.com)

---

## 📄 Licença

Este projeto foi desenvolvido como parte do **Curso Técnico em Desenvolvimento de Sistemas - SENAI Cabo**.

**Projeto Final**: O Senhor dos Projetos  
**Docente**: Givanio José de Melo  
**Data de Entrega**: 10/12/2025

---

## 🤝 Contribuindo

Este é um projeto acadêmico, mas sugestões são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/melhoria`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/melhoria`)
5. Abra um Pull Request

---

## 👨‍💻 Desenvolvedores

**[Luiz, Thalis, Diego, Renan e João]**  
---

**"É como nas grandes histórias, Sr. Frodo. As que realmente importavam."** 🌟
