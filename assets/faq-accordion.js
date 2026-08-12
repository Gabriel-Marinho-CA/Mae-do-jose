/*
  <mdj-faq> — acordeão das Perguntas frequentes.

  Progressive enhancement: a marcação usa <details>/<summary>, então sem JS
  cada item ainda abre e fecha normalmente. Este componente apenas melhora a
  experiência — anima a altura e mantém só um item aberto por vez (accordion).
  Respeita prefers-reduced-motion.
*/
class MdjFaq extends HTMLElement {
  connectedCallback() {
    this.items = Array.from(this.querySelectorAll('.faq__item'));
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.items.forEach((item) => {
      const summary = item.querySelector('summary');
      if (summary) {
        summary.addEventListener('click', (event) => this.onSummaryClick(event, item));
      }
    });
  }

  onSummaryClick(event, item) {
    // Assume o controle da transição de estado para poder animar.
    event.preventDefault();

    const answer = item.querySelector('.faq__answer');
    if (!answer) return;

    if (item.open) {
      this.collapse(item, answer);
      return;
    }

    // Accordion: fecha os demais antes de abrir este.
    this.items.forEach((other) => {
      if (other !== item && other.open) {
        this.collapse(other, other.querySelector('.faq__answer'));
      }
    });

    this.expand(item, answer);
  }

  expand(item, answer) {
    item.open = true;

    if (this.reduceMotion) return;

    const target = answer.scrollHeight;
    answer.style.overflow = 'hidden';
    answer.style.height = '0px';

    requestAnimationFrame(() => {
      answer.style.transition = 'height 0.3s ease';
      answer.style.height = `${target}px`;
    });

    this.onEnd(answer, () => {
      answer.style.height = '';
      answer.style.overflow = '';
      answer.style.transition = '';
    });
  }

  collapse(item, answer) {
    if (!answer) {
      item.open = false;
      return;
    }

    if (this.reduceMotion) {
      item.open = false;
      return;
    }

    const start = answer.scrollHeight;
    answer.style.overflow = 'hidden';
    answer.style.height = `${start}px`;

    requestAnimationFrame(() => {
      answer.style.transition = 'height 0.3s ease';
      answer.style.height = '0px';
    });

    this.onEnd(answer, () => {
      item.open = false;
      answer.style.height = '';
      answer.style.overflow = '';
      answer.style.transition = '';
    });
  }

  onEnd(el, callback) {
    const handler = (event) => {
      if (event.target !== el || event.propertyName !== 'height') return;
      el.removeEventListener('transitionend', handler);
      callback();
    };
    el.addEventListener('transitionend', handler);
  }
}

customElements.define('mdj-faq', MdjFaq);
