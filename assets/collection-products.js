/*
  Cardápio — grade da coleção com filtros.

  Os filtros são links normais: sem este script a página filtra recarregando.
  Com ele, o clique é interceptado, a própria section é buscada com
  ?section_id= e só a coluna de filtros, a barra mobile e os resultados são
  trocados — o scroll e a gaveta aberta são preservados.
*/

class CollectionProducts extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.handleClick = this.handleClick.bind(this);
    this.handlePopState = this.handlePopState.bind(this);

    this.addEventListener('click', this.handleClick);
    window.addEventListener('popstate', this.handlePopState);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.handlePopState);
  }

  handleClick(event) {
    if (event.defaultPrevented) return;

    const closeTrigger = event.target.closest('[data-cp-close]');
    if (closeTrigger && this.contains(closeTrigger)) {
      event.preventDefault();
      this.closeSheet();
      this.scrollToResults();
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
      if (details) details.open = true;
    });

    const categories = this.querySelector('.cp-categories');
    if (categories) categories.scrollTop = state.scrollTop;
  }

  closeSheet() {
    const sheet = this.querySelector('[data-cp-sheet]');
    if (sheet) sheet.open = false;
  }

  scrollToResults() {
    const results = this.querySelector('[data-cp-results]');
    if (!results) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    results.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

if (!customElements.get('collection-products')) {
  customElements.define('collection-products', CollectionProducts);
}
