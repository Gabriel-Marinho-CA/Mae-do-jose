# Mãe do José — regras do tema

Tema Shopify baseado no Dawn. **Leia este arquivo antes de criar ou alterar qualquer section.**

## Regras obrigatórias

### 1. CSS que não depende do schema vai em arquivo separado

Todo CSS estático mora em `assets/`:

- Section → `assets/section-<nome>.css`
- Componente/snippet → `assets/component-<nome>.css`

No `{% style %}` da section fica **apenas** o que depende de `section.settings` (cores, paddings configuráveis, número de colunas). Sempre escopado por instância, com um `uid` derivado do `section.id`:

```liquid
{%- assign uid = 'minha-secao-' | append: section.id -%}

{{ 'section-minha-secao.css' | asset_url | stylesheet_tag }}

{% style %}
  .{{ uid }} { padding-top: {{ section.settings.padding_top_mobile }}px; }
{% endstyle %}
```

Referência pronta: `sections/collection-tabs.liquid` + `assets/section-collection-tabs.css`.

### 2. `page-width` e `scroll-trigger`

- O container da section usa a classe `page-width` do Dawn (`max-width: var(--page-width)`, padding `1.5rem` mobile / `5rem` desktop).
- Os elementos revelados usam `scroll-trigger animate--slide-in`, **sempre** condicionados a `settings.animations_reveal_on_scroll`:

```liquid
<div class="minha-secao__header{% if settings.animations_reveal_on_scroll %} scroll-trigger animate--slide-in{% endif %}">
```

Em listas, cascatear com `data-cascade` e `style="--animation-order: {{ forloop.index }};"`.

### 3. Paddings sempre desktop e mobile, top e bottom

Toda section personalizada expõe os quatro settings:

| id | Default sugerido |
|---|---|
| `padding_top` | 100 |
| `padding_bottom` | 100 |
| `padding_top_mobile` | 48 |
| `padding_bottom_mobile` | 48 |

Aplicados mobile-first no `{% style %}`, com o desktop em `@media screen and (min-width: 750px)`.

### 4. Imagens sempre desktop e mobile

Todo `image_picker` no schema vem em par: `image` (desktop) e `image_mobile`. Se `image_mobile` estiver vazio, cai no desktop — nunca deixe a section quebrar por falta da imagem mobile.

Toda `<img>` precisa de `alt`, `width`, `height` (contra CLS), `loading` explícito, `srcset` e `sizes`.

### 5. Padrões de SEO

Para não gerar reclamação no Search Console:

- Hierarquia de headings correta: um `h2` por section, `h3` nos cards. Nunca pular nível.
- Links reais `<a href>`, crawláveis. Nada de `<div>` clicável com JS.
- Conteúdo de abas/carrosséis renderizado no HTML (escondido com `[hidden]`), não carregado por fetch.
- Progressive enhancement: sem JS a section continua navegável.
- Nada de markup de review falso ou duplicado. Estrela decorativa é `aria-hidden` e **sem** schema.org.
- JSON-LD só com dado que existe de verdade.

## Convenções do projeto

- **JS**: Web Components (`customElements.define`), um arquivo por componente em `assets/`. Transições suaves, sempre respeitando `prefers-reduced-motion`.
- **Textos**: tudo que aparece na tela é editável pelo theme editor — títulos, eyebrows, labels de botão.
- **Fontes**: Outfit (corpo/UI) e Marcellus (display), carregadas **uma única vez** em `snippets/theme-fonts.liquid` (renderizado no `<head>` do `layout/theme.liquid`). Consuma via `var(--mdj-font-body)` / `var(--mdj-font-display)`. Sections **não** repetem o `<link>` das fontes.
- **Swiper**: já carregado globalmente em `layout/theme.liquid`. Não recarregar.
- **Idioma**: comentários e labels do schema em português.

### Paleta

| Uso | Cor |
|---|---|
| Verde escuro / CTA | `#043c39` |
| Texto de título | `#1a2e2d` |
| Texto de corpo | `#6b7e7d` |
| Muted / eyebrow | `#a89880` |
| Bordas | `#f0ede8` e `#e8e4dc` |
| Fundo suave | `#f7f5f2` |
| Status "pronto" | `#2ecc71` |
| Status "encomenda" / estrelas | `#ff8204` |

### Metafields e apps

- `product.metafields.custom.categoria` — rótulo acima do título no card
- `product.metafields.custom.pequena_descricao` — descrição curta do card
- **Judge.me** (`product.metafields.judgeme.badge`) — avaliações; as estrelas do Figma são só fallback decorativo

## Validação

Antes de dar uma section por concluída, rode:

```
shopify theme check
```

Meta: **0 erros**. Os warnings restantes são herdados do Dawn.

> Nota: a Shopify CLI exige Node 22+. Se o `nvm` estiver no Node 20, o comando falha com
> `SyntaxError: ... does not provide an export named 'enableCompileCache'`.
