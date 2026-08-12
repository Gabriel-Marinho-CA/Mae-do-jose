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
