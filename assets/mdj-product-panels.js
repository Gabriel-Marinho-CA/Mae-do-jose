/*
  Painéis da página de produto (Ingredientes / Especificações / Informação
  Nutricional).

  O HTML sai do servidor com <details open>, então sem JS o conteúdo continua
  visível e indexável. Este componente apenas fecha os painéis no mobile,
  onde o Figma pede sanfona, e os reabre no desktop.

  Também sincroniza o bloco "Modo de Preparo" quando a variante muda, já que
  o texto vem de um metacampo de variante.
*/

if (!customElements.get('mdj-panel')) {
  customElements.define(
    'mdj-panel',
    class MdjPanel extends HTMLElement {
      constructor() {
        super();
        this.query = window.matchMedia('(max-width: 749px)');
        this.onBreakpointChange = this.onBreakpointChange.bind(this);
      }

      connectedCallback() {
        this.details = this.querySelector('details');
        if (!this.details) return;

        this.sync();
        this.query.addEventListener('change', this.onBreakpointChange);
      }

      disconnectedCallback() {
        this.query.removeEventListener('change', this.onBreakpointChange);
      }

      onBreakpointChange() {
        this.sync();
      }

      sync() {
        // No desktop o painel é sempre um cartão aberto; no mobile começa fechado.
        this.details.open = !this.query.matches;
      }
    }
  );
}

/*
  Pontinhos do slider da galeria no mobile.

  O SliderComponent do Dawn só sabe lidar com o contador "1 / 5" — os dots são
  do SlideshowComponent, que arrasta autoplay e loop junto. Aqui só ligamos os
  botões ao setSlidePosition e ouvimos o evento 'slideChanged' que o próprio
  SliderComponent já dispara.
*/
if (!customElements.get('mdj-gallery-dots')) {
  customElements.define(
    'mdj-gallery-dots',
    class MdjGalleryDots extends HTMLElement {
      connectedCallback() {
        this.sliderComponent = this.closest('slider-component');
        this.dots = Array.from(this.querySelectorAll('[data-slide-index]'));
        if (!this.sliderComponent || this.dots.length === 0) return;

        this.dots.forEach((dot) => {
          dot.addEventListener('click', () => {
            const index = Number(dot.dataset.slideIndex);
            const offset = this.sliderComponent.sliderItemOffset;
            if (!offset) return;
            this.sliderComponent.setSlidePosition(index * offset);
          });
        });

        this.sliderComponent.addEventListener('slideChanged', (event) => {
          this.setActive(event.detail.currentPage);
        });

        this.setActive(this.sliderComponent.currentPage || 1);
      }

      setActive(page) {
        this.dots.forEach((dot, index) => {
          const isActive = index === page - 1;
          dot.classList.toggle('slider-counter__link--active', isActive);
          if (isActive) {
            dot.setAttribute('aria-current', 'true');
          } else {
            dot.removeAttribute('aria-current');
          }
        });
      }
    }
  );
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;

  subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
    if (!data || !data.html || !data.sectionId) return;

    const source = data.html.getElementById(`MdjPrep-${data.sectionId}`);
    const destination = document.getElementById(`MdjPrep-${data.sectionId}`);
    if (!source || !destination) return;

    destination.innerHTML = source.innerHTML;
    destination.hidden = source.hidden;
  });
});
