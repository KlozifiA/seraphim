(() => {
  const $ = (s, r = document) => r.querySelector(s);

  $('#year').textContent = new Date().getFullYear();

  // Шапка при прокрутке
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Мобильное меню
  const burger = $('#burger');
  const links = $('#navLinks');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    links.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));

  // Появление блоков при прокрутке
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
        entry.target.style.transitionDelay = `${Math.min(siblings.indexOf(entry.target), 5) * 90}ms`;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Кнопки тарифов подставляют тариф в форму
  const tierSelect = $('#tierSelect');
  document.querySelectorAll('[data-tier]').forEach((btn) =>
    btn.addEventListener('click', () => {
      tierSelect.value = btn.dataset.tier;
      setTimeout(() => $('#orderForm [name="name"]').focus({ preventScroll: true }), 600);
    })
  );

  // Отправка заявки
  const form = $('#orderForm');
  const body = $('.form__body', form);
  const success = $('#formSuccess');
  const errorEl = $('#formError');
  const submitBtn = $('#submitBtn');

  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-invalid'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const data = Object.fromEntries(new FormData(form));
    const invalid = [];
    if ((data.name || '').trim().length < 2) invalid.push('name');
    if ((data.contact || '').trim().length < 3) invalid.push('contact');
    if (invalid.length) {
      invalid.forEach((n) => form.elements[n].closest('.field').classList.add('is-invalid'));
      errorEl.textContent = 'Пожалуйста, укажите имя и контакт для связи.';
      form.elements[invalid[0]].focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Не удалось отправить заявку.');
      form.reset();
      tierSelect.value = data.tier;
      body.hidden = true;
      success.hidden = false;
    } catch (err) {
      errorEl.textContent =
        err instanceof TypeError
          ? 'Нет связи с сервером. Попробуйте ещё раз чуть позже.'
          : err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });

  $('#againBtn').addEventListener('click', () => {
    success.hidden = true;
    body.hidden = false;
    form.elements.name.focus();
  });
})();
