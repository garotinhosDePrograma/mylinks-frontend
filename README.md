# mylinks-frontend

Frontend da aplicação **MyLinks**, responsável pela interface web para gerenciar e exibir links personalizados.

## 🧩 Tecnologias e stack

- HTML / CSS / JavaScript
- (Se aplicável: frameworks ou bibliotecas — por exemplo, React, Vue, Angular — adicione aqui)
- (Se aplicável: ferramentas de build / bundlers / preprocessadores — ex: Webpack, Vite, Sass — especifique aqui)

## 📂 Organização do projeto

Estrutura de arquivos principal:

```

mylinks-frontend/
│
├── assets/                      # Recursos estáticos
│   └── default-avatar.png       # Imagem padrão para foto de perfil
│
├── css/                         # Estilos
│   └── profile.css              # CSS dedicado ao perfil (ex: layout de links e avatar)
│
├── js/                          # Scripts JavaScript
│   ├── profile.js               # Lógica para exibição de perfil público
│   ├── dashboard.js             # Funcionalidades do dashboard (CRUD de links)
│   ├── auth.js                  # Autenticação (login/register com API)
│   └── upload.js                # Upload de foto de perfil
│
├── dashboard.html               # Página do dashboard autenticado
├── index.html                   # Página inicial (provavelmente redireciona para login/perfil)
├── profile.html                 # Página pública de perfil (ex: /username)
├── register.html                # Página de cadastro
└── upload.html                  # Página dedicada a upload de avatar

````

- `assets/` — foto de perfil padrão
- `css/` — folhas de estilo  
- `assets/js/` — scripts JavaScript  
- Páginas principais da aplicação: dashboard, perfil, cadastro, upload, etc.
