/*
  <res-footer-menus> — sanfonas das colunas do rodapé no mobile.

  Progressive enhancement pelo avesso: o estado padrão do HTML é "tudo aberto".
  O JS é quem *fecha* as colunas no mobile. Sem JS, o mobile mostra todos os
  links expandidos — feio, mas navegável; o caminho contrário (fechado por
  padrão no CSS) deixaria os links inalcançáveis se o script falhasse.

  No desktop as sanfonas são desligadas: tudo aberto e o botão vira texto
  inerte (o CSS já esconde o ícone de + / −).
*/

const MOBILE_QUERY = '(max-width: 749px)';

class ResFooterMenus extends HTMLElement {
  connectedCallback() {
    this.toggles = Array.from(this.querySelectorAll('[data-footer-toggle]'));
    if (this.toggles.length === 0) return;

    this.mediaQuery = window.matchMedia(MOBILE_QUERY);

    this.onToggleClick = this.onToggleClick.bind(this);
    this.syncMode = this.syncMode.bind(this);

    this.toggles.forEach((toggle) => toggle.addEventListener('click', this.onToggleClick));
    this.mediaQuery.addEventListener('change', this.syncMode);

    this.syncMode();
  }

  disconnectedCallback() {
    this.toggles?.forEach((toggle) => toggle.removeEventListener('click', this.onToggleClick));
    this.mediaQuery?.removeEventListener('change', this.syncMode);
  }

  panelFor(toggle) {
    return document.getElementById(toggle.getAttribute('aria-controls'));
  }

  syncMode() {
    const isMobile = this.mediaQuery.matches;

    this.toggles.forEach((toggle, index) => {
      const panel = this.panelFor(toggle);
      if (!panel) return;

      if (isMobile) {
        // Só a primeira coluna nasce aberta, como no layout.
        const expanded = index === 0;
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        panel.hidden = !expanded;
      } else {
        // No desktop o botão não controla nada: some do fluxo de acessibilidade
        // para o leitor de tela não anunciar um controle que não faz efeito.
        toggle.removeAttribute('aria-expanded');
        panel.hidden = false;
      }
    });
  }

  onToggleClick(event) {
    if (!this.mediaQuery.matches) return;

    const toggle = event.currentTarget;
    const panel = this.panelFor(toggle);
    if (!panel) return;

    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    panel.hidden = expanded;
  }
}

if (!customElements.get('res-footer-menus')) {
  customElements.define('res-footer-menus', ResFooterMenus);
}
