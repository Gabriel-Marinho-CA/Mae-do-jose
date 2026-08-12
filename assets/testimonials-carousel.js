/*
  <testimonials-carousel> — trilha de depoimentos com indicadores.

  A rolagem em si é nativa (scroll-snap no CSS): o componente só cuida dos
  indicadores. Isso mantém o carrossel funcional sem JS — a trilha continua
  arrastável e todos os depoimentos seguem no HTML, visíveis para o rastreador.

  Uma "página" equivale à largura visível da trilha. No desktop cabem N cards
  por página, no mobile um; o número de indicadores sai daí, então o mesmo
  código serve aos dois layouts sem breakpoint em JS.
*/

class TestimonialsCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-track]');
    this.dotsContainer = this.querySelector('[data-dots]');

    if (!this.track || !this.dotsContainer) return;

    this.dots = [];
    this.activeIndex = 0;
    this.scrollRaf = null;

    this.onScroll = this.onScroll.bind(this);
    this.render = this.render.bind(this);

    this.track.addEventListener('scroll', this.onScroll, { passive: true });

    this.resizeObserver = new ResizeObserver(this.render);
    this.resizeObserver.observe(this.track);

    this.render();
  }

  disconnectedCallback() {
    this.track?.removeEventListener('scroll', this.onScroll);
    this.resizeObserver?.disconnect();
    if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
  }

  get prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  get pageCount() {
    const { scrollWidth, clientWidth } = this.track;
    if (clientWidth === 0) return 1;
    // Tolerância de 1px: arredondamento de layout não pode inventar uma página
    // extra que ninguém consegue alcançar.
    return Math.max(1, Math.round((scrollWidth - 1) / clientWidth));
  }

  render() {
    const pages = this.pageCount;

    if (pages !== this.dots.length) {
      this.buildDots(pages);
    }

    this.dotsContainer.hidden = pages <= 1;
    this.updateActiveDot();
  }

  buildDots(pages) {
    this.dotsContainer.textContent = '';
    this.dots = [];

    if (pages <= 1) return;

    for (let i = 0; i < pages; i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'testimonials__dot';
      dot.setAttribute('aria-label', this.dotsContainer.dataset.dotLabel.replace('%d', i + 1));
      dot.addEventListener('click', () => this.goToPage(i));
      this.dotsContainer.appendChild(dot);
      this.dots.push(dot);
    }
  }

  goToPage(index) {
    this.track.scrollTo({
      left: index * this.track.clientWidth,
      behavior: this.prefersReducedMotion ? 'auto' : 'smooth',
    });
  }

  onScroll() {
    if (this.scrollRaf) return;
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = null;
      this.updateActiveDot();
    });
  }

  updateActiveDot() {
    if (this.dots.length === 0) return;

    const { scrollLeft, clientWidth } = this.track;
    const index = Math.min(this.dots.length - 1, Math.round(scrollLeft / clientWidth));

    if (index === this.activeIndex && this.dots[index].getAttribute('aria-current') === 'true') {
      return;
    }

    this.activeIndex = index;
    this.dots.forEach((dot, i) => {
      dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }
}

if (!customElements.get('testimonials-carousel')) {
  customElements.define('testimonials-carousel', TestimonialsCarousel);
}
