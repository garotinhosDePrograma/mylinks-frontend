# mylinks-frontend

Frontend da aplicação **MyLinks**, responsável pela interface web para gerenciar e exibir links personalizados.

## 🧩 Tecnologias e stack

- HTML / CSS / JavaScript
- (Se aplicável: frameworks ou bibliotecas — por exemplo, React, Vue, Angular — adicione aqui)
- (Se aplicável: ferramentas de build / bundlers / preprocessadores — ex: Webpack, Vite, Sass — especifique aqui)

## 📂 Organização do projeto

Estrutura de arquivos principal:

```

/
├── assets/
│   ├── css/
│   └── js/
├── dashboard.html
├── index.html
├── profile.html
├── register.html
└── upload.html

````

- `assets/css/` — folhas de estilo  
- `assets/js/` — scripts JavaScript  
- Páginas principais da aplicação: dashboard, perfil, cadastro, upload, etc.

## 🚀 Como executar localmente

1. Clone este repositório:

   ```bash
   git clone https://github.com/garotinhosDePrograma/mylinks-frontend.git
````

2. Entre na pasta do projeto:

   ```bash
   cd mylinks-frontend
   ```

3. (Se o projeto depender de um servidor local ou Live Server) Inicie um servidor local. Por exemplo:

   ```bash
   # usando Python 3
   python3 -m http.server 8000

   # ou usando o Live Server no VS Code
   # ou outra ferramenta de sua preferência
   ```

4. Acesse no navegador:

   ```
   http://localhost:8000/index.html
   ```

## ⚙ Integração com backend

O frontend espera comunicação com o backend da aplicação MyLinks. Certifique-se de que o backend esteja rodando e corretamente configurado (endereços, rotas, API endpoints) para que as páginas funcionem corretamente.

Você deverá configurar no frontend:

* URLs das APIs (ex: login, cadastro, obter links, upload, etc)
* Autenticação (token JWT, sessões ou outro método)
* Tratamento de erros / estados de carregamento nas páginas

## 🧪 Testes

(Se houver testes: unitários, de integração ou E2E) Coloque aqui instruções de como executar os testes do frontend.

## 📝 Contribuições

Se você quiser contribuir com este projeto, siga as etapas:

1. Faça um *fork* deste repositório
2. Crie uma nova *branch* para sua feature ou correção (`git checkout -b feature/nome-da-feature`)
3. Faça seus commits
4. Envie para o repositório remoto (`git push origin feature/nome-da-feature`)
5. Abra um *Pull Request* para revisão

Por favor, siga as convenções de estilo já existentes (indentação, nomeação de arquivos, padrão de código).

## 📄 Licença

Este projeto está sob a licença **MIT** (ou outra licença que você utilizar). Veja o arquivo `LICENSE` para mais detalhes.

---
