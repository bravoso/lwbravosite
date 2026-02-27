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
