/*
  Cardápio — grade da coleção com filtros.

  Os filtros são links normais: sem este script a página filtra recarregando.
  Com ele, o clique é interceptado, a própria section é buscada com
  ?section_id= e só a coluna de filtros, a barra mobile e os resultados são
  trocados — o scroll e a gaveta aberta são preservados.

  A gaveta mobile é um <details>. A entrada é animada por CSS; o fechamento
  passa por aqui, que segura o open=false até a animação de saída terminar.
*/

const CP_CLOSE_DURATION = 220;
const CP_BODY_CLASS = 'cp-sheet-open';

class CollectionProducts extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.handleClick = this.handleClick.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    this.handleToggle = this.handleToggle.bind(this);

    this.addEventListener('click', this.handleClick);
    // O evento toggle não borbulha: só chega aqui na fase de captura.
    this.addEventListener('toggle', this.handleToggle, true);
    window.addEventListener('popstate', this.handlePopState);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.handlePopState);
    document.body.classList.remove(CP_BODY_CLASS);
  }

  get prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  handleToggle(event) {
    const sheet = event.target;
    if (!(sheet instanceof HTMLDetailsElement) || !sheet.hasAttribute('data-cp-sheet')) return;

    this.syncBodyScroll();
  }

  syncBodyScroll() {
    const open = this.querySelector('[data-cp-sheet][open]') !== null;
    document.body.classList.toggle(CP_BODY_CLASS, open);
  }

  handleClick(event) {
    if (event.defaultPrevented) return;

    // Fechar a gaveta pelo próprio botão de filtros ou pelo fundo escurecido.
    const trigger = event.target.closest('.cp-sheet__trigger');
    if (trigger && this.contains(trigger)) {
      const sheet = trigger.closest('[data-cp-sheet]');
      if (sheet && sheet.open) {
        event.preventDefault();
        this.closeSheet();
      }
      return;
    }

    const closeTrigger = event.target.closest('[data-cp-close]');
    if (closeTrigger && this.contains(closeTrigger)) {
      event.preventDefault();
      this.closeSheet().then(() => this.scrollToResults());
      return;
    }

    const link = event.target.closest('a[data-cp-link]');
    if (!link || !this.contains(link)) return;

    // Deixa o navegador cuidar de abrir em nova aba, baixar etc.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    this.navigate(link.href, link.hasAttribute('data-cp-scroll'));
  }

  handlePopState() {
    this.render(window.location.href).then(() => this.scrollToResults());
  }

  navigate(url, scroll) {
    return this.render(url).then((ok) => {
      if (!ok) return;
      window.history.pushState({ collectionProducts: true }, '', url);
      if (scroll) this.scrollToResults();
    });
  }

  render(url) {
    this.classList.add('is-loading');

    return fetch(this.withSectionId(url))
      .then((response) => {
        if (!response.ok) throw new Error(response.statusText);
        return response.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        this.swap(doc);
        return true;
      })
      .catch(() => {
        // Se o fetch falhar, cai para a navegação normal — o link é real.
        window.location.href = url;
        return false;
      })
      .finally(() => {
        this.classList.remove('is-loading');
      });
  }

  withSectionId(url) {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('section_id', this.sectionId);
    return parsed.toString();
  }

  swap(doc) {
    const state = this.captureState();

    ['[data-cp-facets]', '[data-cp-toolbar]', '[data-cp-mobile]', '[data-cp-results]'].forEach((selector) => {
      const current = this.querySelector(selector);
      if (!current) return;

      const next = doc.querySelector(selector);
      current.innerHTML = next ? next.innerHTML : '';
    });

    this.restoreState(state);
  }

  captureState() {
    const open = [];
    this.querySelectorAll('details[data-cp-details]').forEach((details) => {
      if (details.open && details.id) open.push(details.id);
    });

    const categories = this.querySelector('.cp-categories');

    return { open: open, scrollTop: categories ? categories.scrollTop : 0 };
  }

  restoreState(state) {
    state.open.forEach((id) => {
      const details = this.querySelector(`details[id="${id}"]`);
      if (!details || details.open) return;

      // Reabre sem reanimar: a gaveta já estava na tela antes da troca.
      details.classList.add('is-restoring');
      details.open = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => details.classList.remove('is-restoring'));
      });
    });

    const categories = this.querySelector('.cp-categories');
    if (categories) categories.scrollTop = state.scrollTop;

    this.syncBodyScroll();
  }

  closeSheet() {
    const sheet = this.querySelector('[data-cp-sheet][open]');
    if (!sheet) return Promise.resolve();

    const panel = sheet.querySelector('.cp-sheet__panel');

    if (!panel || this.prefersReducedMotion) {
      sheet.open = false;
      this.syncBodyScroll();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;

        panel.removeEventListener('animationend', finish);
        sheet.classList.remove('is-closing');
        sheet.open = false;
        this.syncBodyScroll();
        resolve();
      };

      panel.addEventListener('animationend', finish);
      sheet.classList.add('is-closing');

      // Rede de segurança: se a animação não rodar, fecha assim mesmo.
      setTimeout(finish, CP_CLOSE_DURATION + 120);
    });
  }

  scrollToResults() {
    const results = this.querySelector('[data-cp-results]');
    if (!results) return;

    results.scrollIntoView({ behavior: this.prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

if (!customElements.get('collection-products')) {
  customElements.define('collection-products', CollectionProducts);
}
