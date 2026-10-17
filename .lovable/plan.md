# Plano — Compatibilidade: Chromecast, Smart TVs, navegadores antigos e controle remoto

## 1. Diagnóstico

### 1.1 CSS — o problema mais grave (quebra em Smart TVs antigas)
- **Cores em `oklch()` e `color-mix()`** (`src/styles.css`): todo o tema (fundo, cards, botões, gradientes, sombras) usa `oklch()`. Navegadores de Smart TVs (Tizen/webOS até ~2021, Chromium < 111, Safari < 15.4) **não suportam `oklch()`** → o site fica sem cor nenhuma (texto preto sobre fundo branco, botões invisíveis). `color-mix()` (gradientes, sombras) também falha.
- **Cascade layers (`@layer`)** geradas pelo Tailwind v4: navegadores antigos ignoram `@layer` → a ordem dos estilos quebra e utilitários sobrescrevem o reset. O Tailwind v4 oficialmente mira Chrome 111+/Safari 16.4+.
- **`aspect-ratio`** (utilitário `aspect-video` nos cards de canal): Chrome 88+ → em TVs antigas os cards colapsam (altura zero).
- **`gap` em flexbox** (Chrome 84+): em navegadores antigos o espaçamento entre itens desaparece (menu, botões, grades).
- **`inset` (atalho), `backdrop-filter`, `scroll-snap`, `:focus-visible`, `@property`**: sem suporte/parciais em TVs antigas — degradam, mas alguns afetam usabilidade.

### 1.2 Navegação por controle remoto / teclado
- Vários elementos interativos **não têm foco visível**: links do menu (Header/Footer), seletor de canal, filtros de categoria, botões do carrossel, cards.
- Setas do carrossel aparecem só em `hover` (inexistente em TV); no teclado aparecem via `focus-visible`, mas o próprio botão pode ficar inacessível na ordem de tabulação.
- Botão "Voltar" do controle remoto (back físico) dispara a navegação do navegador — hoje só o Player trata `Escape`; falta tratamento global consistente.
- Efeitos de `hover` (elevação dos cards) não existem em TV — não quebram, mas o feedback de foco precisa substituí-los.

### 1.3 Chromecast
- O player usa **iframes de terceiros** (`embedtv.lat`) — a Google Cast SDK **não consegue transmitir conteúdo dentro de um iframe de terceiro** (restrição de segurança do navegador). Não existe solução técnica que envie esse iframe para a TV.
- O que é viável e útil: (a) botão "Transmitir para TV" que detecta um Chromecast/display conectado via **Remote Playback API** e, quando o conteúdo for um `<video>` nativo, transmite de verdade; para iframes, oferece o caminho alternativo (abrir o link do canal direto na TV, com instruções claras); (b) garantir tela cheia, controles e foco funcionando bem no modo TV.

### 1.4 Build / JavaScript
- O build atual (Vite 7) mira navegadores modernos (Chrome 107+). TVs antigas (Chromium 38–69) podem falhar ao interpretar a sintaxe gerada. É preciso baixar o alvo do build.

## 2. Correções

### 2.1 Camada de compatibilidade CSS (sem perder a identidade visual)
- Manter `oklch()` como padrão (navegadores modernos continuam idênticos) e adicionar **valores de fallback em `rgb()`/hex** declarados antes de cada token no `:root` — navegadores antigos usam o fallback, modernos usam o `oklch()`.
- Criar `src/compat.css` carregado **depois** do CSS principal, com:
  - Cores fixas em hex/rgb para todos os tokens (fundo, texto, cards, primária, live etc.).
  - Fallback para `aspect-ratio`: técnica de `padding-top: 56.25%` + `position:absolute` nos containers de vídeo/card (`@supports not (aspect-ratio: 1/1)`).
  - Fallback para `gap` em flex: margens negativas/positivas nos itens do menu e grades (`@supports not (gap: 1px)`).
  - `-webkit-` prefixos onde necessário (backdrop, flex).
- Ajustar o `@source`/tema para evitar `@layer` crítico onde possível e testar a ordem de cascata.

### 2.2 Foco visível e navegação por controle remoto
- Regra global de foco: `:focus { outline: 3px solid var(--ring); outline-offset: 2px }` em todos os elementos interativos (não só `:focus-visible`), para TVs que não suportam `focus-visible`.
- Foco inicial gerenciado na troca de página; links/botões em ordem de DOM lógica (setas do controle seguem o fluxo).
- Setas do carrossel acessíveis por teclado/TV: visíveis ao receber foco, `tabIndex` correto.
- Botão "Voltar" do controle: tratar `popstate`/`Escape` para voltar de páginas de canal/evento, com fallback para `/canais`.
- Feedback de foco nos cards (anel + elevação) substituindo o efeito de hover.

### 2.3 Chromecast / transmissão para TV
- Botão "Transmitir" no Player:
  - Se o navegador suportar Remote Playback API e houver destino conectado → tenta transmitir.
  - Para streams em iframe (caso atual): abre o link direto do canal e mostra instruções em português para assistir na TV (Smart TV com navegador, Chromecast via espelhamento de tela, etc.), sem quebrar o fluxo de "Liberar acesso".
- Manter tela cheia e controles funcionando no modo TV (já existentes, ajustados para foco).

### 2.4 Build
- Baixar o alvo de build no `vite.config.ts` para `es2015`/`chrome69` (legado) via esbuild, sem afetar recursos modernos em navegadores atuais.

## 3. O que NÃO será alterado
- Funcionalidades atuais (Liberar acesso, sem tela de carregamento, canais, esportes, programação, busca).
- Identidade visual (tema escuro, cores, fontes Sora/Manrope) em navegadores modernos.
- Estrutura de dados (server functions + TanStack Query).

## 4. Limitações honestas
- Smart TVs muito antigas (Tizen/webOS anteriores a ~2018) podem não renderizar o Tailwind v4 por completo mesmo com os fallbacks — nesses casos o site cairá para o CSS de compatibilidade (legível e utilizável, mas com visual simplificado).
- Transmissão real via Chromecast do player em iframe de terceiros não é tecnicamente possível; o botão oferecerá o melhor caminho alternativo.

## 5. Verificação
- Testes existentes continuam passando (`bunx vitest`), typecheck limpo.
- Simulação de navegador antigo: renderizar a página com as features modernas desabilitadas (verificação via Playwright + checagem dos fallbacks no CSS gerado).
- Navegação por teclado: percorrer home → canal → voltar apenas com Tab/Enter/Escape no Playwright.
- Layout em telas 1280x720 (TV), tablet e celular.
