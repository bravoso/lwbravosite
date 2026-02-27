# LW Bravo Site

Site estático leve para:
- Hub principal (`/`)
- Link na bio (`/bio/`)
- Página de vendas (`/desafio-7d/`)

## Rodar localmente

```bash
python3 -m http.server 8080
```

Acesse `http://localhost:8080`.

## Deploy no Netlify

1. Conecte o repositório no Netlify.
2. Build command: *(deixe vazio)*
3. Publish directory: `/`

## Deploy no GitHub Pages

O workflow `.github/workflows/pages.yml` publica automaticamente o site na branch `gh-pages` em push para `main` ou `work`.

No repositório GitHub, configure em **Settings → Pages** a fonte como **Deploy from a branch** e selecione **gh-pages / root**.

## Como adicionar imagens nas páginas de venda

1. Envie os arquivos para `assets/images/`.
2. Referencie no HTML com caminho relativo absoluto, por exemplo:

```html
<img src="/assets/images/minha-oferta.webp" alt="Descrição da imagem" width="1200" height="630" loading="lazy" decoding="async">
```

> Dica de performance: prefira `.webp`, sempre defina `width` e `height` para evitar layout shift.


## Web Editor (editar páginas sem mexer no código local)

Acesse `/editor/` para usar o editor visual/técnico com:
- Edição de qualquer arquivo `.html`, `.css`, `.js` ou `.md` do repositório
- Preview ao vivo da página
- Blocos rápidos (imagem, vídeo, botão, seção)
- Upload de imagens/vídeos por **drag & drop** para `assets/images`
- Salvar direto no GitHub via token (gera commit)
- Botão para disparar deploy (`workflow_dispatch`)

### Como usar
1. Gere um GitHub Personal Access Token com escopo de repositório (`contents` e `actions`).
2. Em `/editor/`, preencha: `owner`, `repo`, `branch`, `token` e workflow (`pages.yml`).
3. Clique em **Atualizar Arquivos** e escolha a página.
4. Edite o HTML/CSS/JS, use os blocos rápidos e salve com **Salvar no GitHub**.
5. Faça upload de mídia no bloco de drag-and-drop e o editor já insere a tag no código.
6. Clique em **Disparar Deploy** (ou aguarde o deploy automático em push).
