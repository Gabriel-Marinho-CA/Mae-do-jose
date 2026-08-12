/*
  <collection-tabs> — troca entre as coleções do cardápio.

  Progressive enhancement: sem JS, cada aba continua sendo um <a href> normal
  que leva à página da coleção, e todos os painéis ficam no DOM (bom para
  rastreamento). Com JS, o clique passa a alternar o painel na própria página,
  com fade + animação de altura.

  A transição respeita prefers-reduced-motion: nesse caso a troca é imediata.
*/

const TRANSITION_MS = 280;

class CollectionTabs extends HTMLElement {
  connectedCallback() {
    this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
    this.panels = Array.from(this.querySelectorAll('[role="tabpanel"]'));
    this.panelsWrapper = this.querySelector('[data-panels]');
    this.nav = this.querySelector('[role="tablist"]');

    if (this.tabs.length === 0 || this.panels.length === 0) return;

    this.activeIndex = Math.max(
      0,
      this.tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true')
    );
    this.isAnimating = false;

    this.onClick = this.onClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', this.onClick);
      tab.addEventListener('keydown', this.onKeydown);
    });

    this.syncTabState(this.activeIndex);
  }

  disconnectedCallback() {
    this.tabs?.forEach((tab) => {
      tab.removeEventListener('click', this.onClick);
      tab.removeEventListener('keydown', this.onKeydown);
    });
  }

  get prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  onClick(event) {
    const index = this.tabs.indexOf(event.currentTarget);
    if (index === -1) return;

    // Deixa passar cliques que abrem em nova aba/janela: nesses casos o
    // usuário quer mesmo ir para a página da coleção.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    event.preventDefault();
    this.select(index);
  }

  onKeydown(event) {
    const current = this.tabs.indexOf(event.currentTarget);
    if (current === -1) return;

    const last = this.tabs.length - 1;
    let next = null;

    switch (event.key) {
      case 'ArrowRight':
        next = current === last ? 0 : current + 1;
        break;
      case 'ArrowLeft':
        next = current === 0 ? last : current - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(next);
    this.tabs[next].focus();
  }

  select(index) {
    if (index === this.activeIndex || this.isAnimating) return;

    const previousPanel = this.panels[this.activeIndex];
    const nextPanel = this.panels[index];
    if (!previousPanel || !nextPanel) return;

    this.activeIndex = index;
    this.syncTabState(index);
    this.scrollTabIntoView(this.tabs[index]);

    if (this.prefersReducedMotion) {
      previousPanel.hidden = true;
      nextPanel.hidden = false;
      return;
    }

    this.isAnimating = true;

    // Trava a altura atual para que a animação de altura tenha um ponto de
    // partida concreto (auto não é animável).
    const startHeight = this.panelsWrapper.offsetHeight;
    this.panelsWrapper.style.height = `${startHeight}px`;
    this.panelsWrapper.classList.add('is-animating');

    previousPanel.classList.add('is-transitioning');

    window.setTimeout(() => {
      previousPanel.hidden = true;
      previousPanel.classList.remove('is-transitioning');

      nextPanel.hidden = false;
      nextPanel.classList.add('is-transitioning');

      const endHeight = nextPanel.offsetHeight;

      requestAnimationFrame(() => {
        this.panelsWrapper.style.height = `${endHeight}px`;
        nextPanel.classList.remove('is-transitioning');
      });

      window.setTimeout(() => {
        this.panelsWrapper.style.height = '';
        this.panelsWrapper.classList.remove('is-animating');
        this.isAnimating = false;
      }, TRANSITION_MS + 80);
    }, TRANSITION_MS);
  }

  syncTabState(index) {
    this.tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    });

    this.panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
  }

  scrollTabIntoView(tab) {
    if (!this.nav || this.nav.scrollWidth <= this.nav.clientWidth) return;

    const navBox = this.nav.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();

    if (tabBox.left >= navBox.left && tabBox.right <= navBox.right) return;

    this.nav.scrollTo({
      left: this.nav.scrollLeft + (tabBox.left - navBox.left) - 16,
      behavior: this.prefersReducedMotion ? 'auto' : 'smooth',
    });
  }
}

if (!customElements.get('collection-tabs')) {
  customElements.define('collection-tabs', CollectionTabs);
}
