/*
  <resultate-recommendations> — carrossel de "Você também pode gostar".

  Usa a mesma API de recomendações do Dawn (routes.product_recommendations_url
  + Section Rendering API): o conteúdo só é buscado quando a section entra na
  viewport. Depois que o HTML chega, o Swiper é inicializado sobre os slides.

  Não dá para inicializar o Swiper com um <script> dentro da section, porque o
  HTML das recomendações é injetado via innerHTML (scripts não executam). Por
  isso a inicialização mora aqui, num componente próprio.

  Swiper é carregado globalmente em layout/theme.liquid.
*/

class ResultateRecommendations extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
    this.intersectionObserver = null;
  }

  connectedCallback() {
    if (this.querySelector('[data-swiper]')) {
      // Conteúdo já veio renderizado (ex.: recarga da section no editor).
      this.initSwiper();
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
        this.loadRecommendations();
      },
      { rootMargin: '0px 0px 400px 0px' }
    );

    this.intersectionObserver.observe(this);
  }

  disconnectedCallback() {
    this.intersectionObserver?.unobserve(this);
    this.destroySwiper();
  }

  loadRecommendations() {
    const url = `${this.dataset.url}&product_id=${this.dataset.productId}&section_id=${this.dataset.sectionId}`;

    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement('div');
        html.innerHTML = text;

        const recommendations = html.querySelector('resultate-recommendations');
        if (!recommendations || !recommendations.innerHTML.trim().length) return;

        this.innerHTML = recommendations.innerHTML;
        this.classList.add('related-products-carousel--loaded');
        this.initSwiper();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  initSwiper() {
    const container = this.querySelector('[data-swiper]');
    if (!container) return;

    this.destroySwiper();

    this.whenSwiperReady(() => {
      const columnsDesktop = parseInt(this.dataset.columnsDesktop, 10) || 4;
      const columnsTablet = Math.min(columnsDesktop, 3);

      const options = {
        // Mobile: 2 colunas x 2 linhas por slide (4 produtos por vez).
        slidesPerView: 2,
        spaceBetween: 12,
        grid: { rows: 2, fill: 'row' },
        watchOverflow: true,
        speed: this.prefersReducedMotion() ? 0 : 500,
        a11y: { enabled: true },
        breakpoints: {
          750: {
            slidesPerView: columnsTablet,
            spaceBetween: 20,
            grid: { rows: 1, fill: 'row' },
          },
          990: {
            slidesPerView: columnsDesktop,
            spaceBetween: 24,
            grid: { rows: 1, fill: 'row' },
          },
        },
      };

      const prevEl = this.querySelector('[data-prev]');
      const nextEl = this.querySelector('[data-next]');
      if (prevEl && nextEl) {
        options.navigation = { prevEl, nextEl };
      }

      const paginationEl = this.querySelector('[data-pagination]');
      if (paginationEl) {
        options.pagination = { el: paginationEl, clickable: true };
      }

      this.swiper = new Swiper(container, options);
    });
  }

  destroySwiper() {
    if (!this.swiper) return;
    this.swiper.destroy(true, true);
    this.swiper = null;
  }

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  whenSwiperReady(callback) {
    if (window.Swiper) {
      callback();
      return;
    }

    let tries = 0;
    const timer = setInterval(() => {
      if (window.Swiper || tries++ > 100) {
        clearInterval(timer);
        if (window.Swiper) callback();
      }
    }, 50);
  }
}

if (!customElements.get('resultate-recommendations')) {
  customElements.define('resultate-recommendations', ResultateRecommendations);
}
