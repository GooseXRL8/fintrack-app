
(() => {
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const hasGsap = () => typeof window.gsap !== 'undefined';
  const hasScrollTrigger = () => typeof window.ScrollTrigger !== 'undefined';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initMobileMenu() {
    const menu = qs('#mobileMenu');
    const button = qs('#mobileMenuBtn');
    if (!menu || !button) return;

    const lines = qsa('span', button);
    const links = qsa('a', menu);

    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      menu.setAttribute('aria-hidden', String(!open));
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.body.classList.toggle('menu-open', open);

      if (lines[0]) lines[0].style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : '';
      if (lines[1]) lines[1].style.opacity = open ? '0' : '1';
      if (lines[2]) lines[2].style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : '';

      if (open && links[0]) links[0].focus();
    };

    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    links.forEach((link) => link.addEventListener('click', () => setOpen(false)));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  function initFaq() {
    const buttons = qsa('.faq-question');
    if (!buttons.length) return;

    buttons.forEach((button) => {
      const item = button.closest('.faq-item');
      const answer = item ? qs('.faq-answer', item) : null;
      if (!item || !answer) return;

      button.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        qsa('.faq-item').forEach((otherItem) => {
          const otherButton = qs('.faq-question', otherItem);
          const otherAnswer = qs('.faq-answer', otherItem);
          otherItem.classList.remove('open');
          if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
          if (otherAnswer) {
            otherAnswer.style.maxHeight = null;
            otherAnswer.setAttribute('aria-hidden', 'true');
          }
        });

        if (!isOpen) {
          item.classList.add('open');
          button.setAttribute('aria-expanded', 'true');
          answer.setAttribute('aria-hidden', 'false');
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
      });
    });
  }

  function initCounters() {
    if (reducedMotion || !hasGsap() || !hasScrollTrigger()) {
      qsa('.counter').forEach((counter) => {
        const target = Number(counter.dataset.target || 0);
        counter.textContent = target.toLocaleString('pt-BR');
      });
      return;
    }

    qsa('.counter').forEach((counter) => {
      const target = Number(counter.dataset.target || 0);
      ScrollTrigger.create({
        trigger: counter,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to({ value: 0 }, {
            value: target,
            duration: 2,
            ease: 'power2.out',
            onUpdate() {
              counter.textContent = Math.floor(this.targets()[0].value).toLocaleString('pt-BR');
            }
          });
        }
      });
    });
  }

  function initAnimations() {
    if (reducedMotion || !hasGsap() || !hasScrollTrigger()) return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.timeline()
      .from('.nav-logo', { y: -20, opacity: 0, duration: 0.6, ease: 'power2.out' })
      .from('.nav-links li', { y: -15, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, '-=0.3')
      .from('.hero-badge', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.1')
      .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .from('.hero-sub', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
      .from('.hero-actions', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .from('.hero-stats', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .from('.phone-mockup', { x: 60, opacity: 0, rotationY: -20, duration: 1, ease: 'power3.out' }, '-=0.7')
      .from('.float-card', { scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.15, ease: 'back.out(1.7)' }, '-=0.4');

    qsa('.reveal').forEach((el) => {
      gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 85%', once: true }, y: 40, opacity: 0, duration: 0.7, ease: 'power2.out' });
    });

    qsa('.reveal-left').forEach((el) => {
      gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 80%', once: true }, x: -40, opacity: 0, duration: 0.8, ease: 'power2.out' });
    });

    qsa('.reveal-right').forEach((el) => {
      gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 80%', once: true }, x: 40, opacity: 0, duration: 0.8, ease: 'power2.out' });
    });

    gsap.from('.benefit-card', { scrollTrigger: { trigger: '.benefits-grid', start: 'top 80%', once: true }, y: 35, opacity: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out' });
    gsap.from('.testimonial-card', { scrollTrigger: { trigger: '.testimonials-grid', start: 'top 80%', once: true }, y: 35, opacity: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out' });
    gsap.from('.pricing-card', { scrollTrigger: { trigger: '.pricing-grid', start: 'top 80%', once: true }, y: 35, opacity: 0, duration: 0.55, stagger: 0.1, ease: 'power2.out' });

    animateOnEnter('.chart-container', '.chart-bar', { height: 0, duration: 1, stagger: 0.04, ease: 'power3.out' });
    animateOnEnter('.budget-visual', '.budget-bar-fill', { width: 0, duration: 1, stagger: 0.1, ease: 'power3.out' });
    animateOnEnter('.dashboard-preview', '.mini-bar-income, .mini-bar-expense', { height: 0, duration: 0.8, stagger: 0.03, ease: 'power2.out' });
    animateOnEnter('.dashboard-preview', '.dash-cat-bar-fill', { width: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out' });
    animateOnEnter('.goals-visual', '.goal-bar-fill', { width: 0, duration: 1, stagger: 0.1, ease: 'power3.out' });
    animateOnEnter('.goals-visual', '.goal-card-mini', { y: 25, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' });
  }

  function animateOnEnter(trigger, targets, vars) {
    if (!qs(trigger) || !qsa(targets).length) return;
    ScrollTrigger.create({
      trigger,
      start: 'top 80%',
      once: true,
      onEnter: () => gsap.from(targets, vars)
    });
  }

  function initMicroInteractions() {
    if (reducedMotion || !hasGsap()) return;

    qsa('.btn-primary, .btn-secondary, .pricing-btn').forEach((button) => {
      button.addEventListener('mousedown', () => gsap.to(button, { scale: 0.96, duration: 0.1 }));
      button.addEventListener('mouseup', () => gsap.to(button, { scale: 1, duration: 0.2, ease: 'back.out(2)' }));
      button.addEventListener('mouseleave', () => gsap.to(button, { scale: 1, duration: 0.2 }));
    });

    qsa('.benefit-card').forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, { rotateX: y * -6, rotateY: x * 6, duration: 0.3, ease: 'power2.out', transformPerspective: 800 });
      });
      card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' }));
    });

    document.addEventListener('mousemove', (event) => {
      if (window.innerWidth < 1024) return;
      const xPercent = (event.clientX / window.innerWidth - 0.5) * 30;
      const yPercent = (event.clientY / window.innerHeight - 0.5) * 30;
      gsap.to('.hero-glow', { x: xPercent, y: yPercent, duration: 1.5, ease: 'power2.out' });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initFaq();
    initAnimations();
    initCounters();
    initMicroInteractions();
  });
})();
