(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');
  const dateKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;
  const byId = id => document.getElementById(id);
  const normalURL = (value, fallback) => {
    if (typeof value !== 'string') return fallback;
    try {
      const parsed = new URL(value, window.location.href);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return fallback;
      return parsed.href;
    } catch { return fallback; }
  };
  const imagePath = value => typeof value === 'string' && /^(\/assets\/|assets\/)[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..') ? value : null;

  // Elementos entram em cena delicadamente, sem ocultação para quem prefere movimento reduzido.
  const revealObserver = !reduceMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
      }), { threshold: .06, rootMargin: '0px 0px 45px 0px' }) : null;
  const observe = root => {
    root.querySelectorAll?.('.reveal').forEach(node => {
      if (revealObserver) revealObserver.observe(node);
      else node.classList.add('is-visible');
    });
  };
  observe(document);

  const menuToggle = byId('menu-toggle');
  const nav = byId('main-nav');
  const setMenuOpen = open => {
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  menuToggle.addEventListener('click', () => setMenuOpen(!document.body.classList.contains('menu-open')));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenuOpen(false); });
  window.addEventListener('resize', () => { if (innerWidth > 850) setMenuOpen(false); });

  // Parallax suave sobre a fotografia (sem carregar biblioteca 3D).
  if (!reduceMotion) {
    const hero = document.querySelector('.hero');
    const heroImage = document.querySelector('.hero-image');
    let waiting = false;
    window.addEventListener('scroll', () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(() => {
        if (scrollY < hero.offsetHeight + 150) heroImage.style.transform = `scale(1.045) translate3d(0,${Math.min(18, scrollY * .022)}px,0)`;
        waiting = false;
      });
    }, { passive: true });
    const stage = byId('terrain-stage');
    const model = byId('terrain-model');
    if (stage && model && matchMedia('(pointer:fine)').matches) {
      let raf = 0;
      stage.addEventListener('pointermove', event => {
        const r = stage.getBoundingClientRect();
        const px = (event.clientX - r.left) / r.width - .5;
        const py = (event.clientY - r.top) / r.height - .5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          model.style.setProperty('--pointer-y', `${px * 9}deg`);
          model.style.setProperty('--pointer-x', `${-py * 6}deg`);
        });
      });
      stage.addEventListener('pointerleave', () => {
        model.style.setProperty('--pointer-y', '0deg');
        model.style.setProperty('--pointer-x', '0deg');
      });
    }
  }

  // Toda a área pública é alimentada por site/data/site.json, editado no Pages CMS.
  function applyContent(data) {
    if (!data || typeof data !== 'object') return;
    const nested = path => path.split('.').reduce((part, key) => part?.[key], data);
    document.querySelectorAll('[data-copy]').forEach(element => {
      const text = nested(element.dataset.copy);
      if (typeof text === 'string') element.textContent = text;
    });
    if (imagePath(data.hero?.image)) document.querySelector('.hero-image').src = imagePath(data.hero.image);
    if (imagePath(data.statement?.image)) document.querySelector('.statement-photo img').src = imagePath(data.statement.image);
    document.querySelectorAll('.pillar').forEach((node, index) => {
      const pillar = data.impact?.pillars?.[index];
      if (!pillar) return;
      if (typeof pillar.title === 'string') node.querySelector('h3').textContent = pillar.title;
      if (typeof pillar.description === 'string') node.querySelector('p').textContent = pillar.description;
    });
    if (Array.isArray(data.projects)) renderProjects(data.projects);
    if (Array.isArray(data.gallery)) renderGallery(data.gallery);
    for (const social of ['instagram', 'facebook']) {
      const link = normalURL(data.contact?.[social], null);
      if (link) document.querySelectorAll(`[data-social="${social}"]`).forEach(node => node.href = link);
    }
  }
  function renderProjects(projects) {
    const grid = byId('project-grid');
    grid.replaceChildren();
    projects.slice(0, 18).forEach((project, index) => {
      if (!project?.title) return;
      const card = document.createElement('article'); card.className = 'project-card reveal';
      const visual = document.createElement('div'); visual.className = 'project-visual';
      const img = document.createElement('img'); img.loading = 'lazy'; img.alt = project.alt || project.title;
      img.src = imagePath(project.image) || 'assets/serra-verde.webp';
      const badge = document.createElement('span'); badge.className = 'project-badge';
      badge.textContent = `${pad(index + 1)} / ${project.category || 'PROJETO'}`;
      visual.append(img, badge);
      const copy = document.createElement('div'); copy.className = 'project-copy';
      const title = document.createElement('h3'); title.textContent = project.title;
      const paragraph = document.createElement('p'); paragraph.textContent = project.description || '';
      const link = document.createElement('a'); link.href = '#contato'; link.className = 'text-link'; link.textContent = 'Saiba como participar ↗';
      copy.append(title, paragraph, link); card.append(visual, copy); grid.append(card);
    });
    observe(grid);
  }

  // Carrossel acessível e atualizável pelo CMS.
  let slides = [];
  let activeSlide = 0;
  const track = byId('gallery-track');
  const viewport = byId('gallery-viewport');
  const counter = byId('gallery-counter');
  const progress = byId('gallery-progress');
  function showSlide(index) {
    slides = [...track.querySelectorAll('.gallery-slide')];
    if (!slides.length) { counter.textContent = '00 / 00'; progress.style.width = '0%'; return; }
    activeSlide = (index + slides.length) % slides.length;
    const shift = slides[activeSlide].offsetLeft - slides[0].offsetLeft;
    track.style.transform = `translate3d(${-shift}px, 0, 0)`;
    counter.replaceChildren();
    counter.append(document.createTextNode(pad(activeSlide + 1) + ' '));
    const sub = document.createElement('span'); sub.textContent = '/ ' + pad(slides.length); counter.append(sub);
    progress.style.width = `${((activeSlide + 1) / slides.length) * 100}%`;
    slides.forEach((slide, i) => slide.setAttribute('aria-label', `Foto ${i + 1} de ${slides.length}${i === activeSlide ? ', selecionada' : ''}`));
  }
  function renderGallery(gallery) {
    track.replaceChildren();
    gallery.slice(0, 30).forEach((item, index) => {
      const src = imagePath(item.image);
      if (!src) return;
      const figure = document.createElement('figure'); figure.className = 'gallery-slide';
      const image = document.createElement('img'); image.src = src; image.alt = item.alt || item.title || 'Foto da associação'; image.loading = 'lazy';
      const caption = document.createElement('figcaption');
      const ordinal = document.createElement('span'); ordinal.textContent = `${pad(index + 1)} / ${pad(gallery.length)}`;
      caption.append(ordinal, document.createTextNode(item.title || 'Amigos do Mestre Álvaro'));
      figure.append(image, caption); track.append(figure);
    });
    showSlide(0);
  }
  byId('gallery-prev').addEventListener('click', () => showSlide(activeSlide - 1));
  byId('gallery-next').addEventListener('click', () => showSlide(activeSlide + 1));
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showSlide(activeSlide - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showSlide(activeSlide + 1); }
  });
  let touchStartX = 0, touchStartY = 0;
  viewport.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].screenX; touchStartY = event.changedTouches[0].screenY; }, { passive: true });
  viewport.addEventListener('touchend', event => {
    const dx = event.changedTouches[0].screenX - touchStartX;
    const dy = event.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) showSlide(activeSlide + (dx < 0 ? 1 : -1));
  }, { passive: true });
  window.addEventListener('resize', () => showSlide(activeSlide));
  showSlide(0);

  // Calendário REAL: integra Google Calendar público; sem credenciais, usa os eventos manuais do CMS.
  const calendarGrid = byId('calendar-grid');
  const calendarMonth = byId('calendar-month');
  const eventDay = byId('event-day');
  const eventTitle = byId('event-title');
  const eventDescription = byId('event-description');
  const eventContact = byId('event-contact');
  const eventPill = byId('event-pill');
  const eventOptions = byId('event-options');
  const external = byId('event-external');
  let manualEvents = [];
  let monthEvents = [];
  let viewMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let selectedEvent = null;
  let renderToken = 0;
  const monthKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  function formatDateLabel(iso) {
    const [year, month, day] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
  }
  function setCalendarNote(message) { byId('calendar-note-text').textContent = message; }
  function eventMatchesMonth(event, month) {
    return typeof event.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.date) && event.date.startsWith(month) && typeof event.title === 'string' && event.title.trim();
  }
  function selectEvent(event) {
    selectedEvent = event;
    const [, month, day] = event.date.split('-').map(Number);
    eventDay.replaceChildren();
    eventDay.append(document.createTextNode(pad(day)));
    const shortMonth = document.createElement('span');
    shortMonth.textContent = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(2026, month - 1, 1)).replace('.', '').toUpperCase();
    eventDay.append(shortMonth);
    eventTitle.textContent = event.title;
    eventDescription.textContent = `${event.startTime ? `Horário: ${event.startTime}. ` : ''}${event.description || 'Entre em contato com a associação para saber como participar.'}`;
    eventPill.textContent = 'ATIVIDADE DIVULGADA';
    eventContact.disabled = false;
    const eventUrl = normalURL(event.link, null);
    external.hidden = !eventUrl;
    if (eventUrl) external.href = eventUrl;
    calendarGrid.querySelectorAll('button[data-date]').forEach(button => {
      const selected = button.dataset.date === event.date;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    eventOptions.replaceChildren();
    const sameDay = monthEvents.filter(candidate => candidate.date === event.date);
    if (sameDay.length > 1) {
      const helper = document.createElement('p'); helper.textContent = 'Outras atividades nesta data:';
      eventOptions.append(helper);
      sameDay.forEach((item, index) => {
        const button = document.createElement('button'); button.type = 'button';
        button.textContent = item.startTime ? `${item.startTime} · ${item.title}` : item.title;
        button.className = item === event ? 'active' : '';
        button.addEventListener('click', () => selectEvent(monthEvents.find(e => e === item) || sameDay[index]));
        eventOptions.append(button);
      });
    }
  }
  function resetEventPanel() {
    selectedEvent = null;
    eventDay.replaceChildren(document.createTextNode('—'));
    const label = document.createElement('span'); label.textContent = 'AGENDA'; eventDay.append(label);
    eventTitle.textContent = 'Nenhuma atividade divulgada neste mês';
    eventDescription.textContent = 'Quando a associação cadastrar ou sincronizar eventos, eles aparecerão aqui. Você também pode perguntar sobre novas programações.';
    eventPill.textContent = 'AGUARDANDO PROGRAMAÇÃO';
    eventOptions.replaceChildren(); external.hidden = true;
    eventContact.disabled = false;
  }
  async function getCalendarEvents(month) {
    const local = manualEvents.filter(e => eventMatchesMonth(e, month));
    // No HTML de pré-visualização e num servidor simples local, os dados manuais são suficientes.
    if (location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname)) {
      return { events: local, note: 'Programação cadastrada pela associação. A sincronização com o Google Calendar é ativada na hospedagem Netlify.' };
    }
    try {
      const response = await fetch(`/.netlify/functions/calendar?month=${encodeURIComponent(month)}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('O serviço de agenda não está disponível');
      const data = await response.json();
      if (data.configured && data.source === 'google') return { events: data.events || [], note: 'Programação oficial sincronizada com a agenda pública da associação no Google Calendar.' };
      return { events: local, note: 'Programação cadastrada diretamente pela associação. Para sincronização automática, configure o Google Calendar.' };
    } catch {
      return { events: local, note: 'A sincronização está indisponível no momento. Confira a programação cadastrada ou fale com a associação para confirmar os eventos.' };
    }
  }
  function paintCalendar() {
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewMonth);
    calendarMonth.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    calendarGrid.replaceChildren();
    const year = viewMonth.getFullYear(), month = viewMonth.getMonth() + 1;
    const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month, 0).getDate();
    for (let i = 0; i < offset; i++) {
      const blank = document.createElement('span'); blank.className = 'day empty'; blank.setAttribute('aria-hidden', 'true'); calendarGrid.append(blank);
    }
    for (let day = 1; day <= totalDays; day++) {
      const date = dateKey(year, month, day);
      const events = monthEvents.filter(item => item.date === date);
      const node = document.createElement(events.length ? 'button' : 'span'); node.className = 'day';
      if (events.length) {
        node.classList.add('has-event'); node.type = 'button'; node.dataset.date = date;
        node.setAttribute('aria-label', `${formatDateLabel(date)}: ${events.map(e => e.title).join(', ')}`);
        node.setAttribute('aria-pressed', 'false');
        node.addEventListener('click', () => selectEvent(events[0]));
      }
      if (new Date().toDateString() === new Date(year, month - 1, day).toDateString()) node.classList.add('today');
      const number = document.createElement('span'); number.textContent = day; node.append(number);
      if (events.length) { const dot = document.createElement('i'); dot.className = 'day-mark'; dot.setAttribute('aria-hidden', 'true'); node.append(dot); }
      calendarGrid.append(node);
    }
    if (monthEvents.length) selectEvent(monthEvents.find(e => selectedEvent && e.date === selectedEvent.date && e.title === selectedEvent.title) || monthEvents[0]);
    else resetEventPanel();
  }
  async function renderCalendar() {
    const token = ++renderToken;
    const month = monthKey(viewMonth);
    setCalendarNote('Consultando a programação…');
    const result = await getCalendarEvents(month);
    if (token !== renderToken) return;
    monthEvents = (result.events || []).filter(item => eventMatchesMonth(item, month)).sort((a,b) => a.date.localeCompare(b.date) || String(a.startTime || '').localeCompare(String(b.startTime || '')));
    setCalendarNote(result.note);
    paintCalendar();
  }
  byId('calendar-prev').addEventListener('click', () => { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1); renderCalendar(); });
  byId('calendar-next').addEventListener('click', () => { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1); renderCalendar(); });
  eventContact.addEventListener('click', () => {
    const subject = byId('contact-subject');
    const message = byId('contact-message');
    subject.value = selectedEvent?.type && [...subject.options].some(o => o.value === selectedEvent.type) ? selectedEvent.type : 'Eventos e ações ambientais';
    message.value = selectedEvent
      ? `Olá! Tenho interesse na atividade "${selectedEvent.title}", prevista para ${formatDateLabel(selectedEvent.date)}${selectedEvent.startTime ? ` às ${selectedEvent.startTime}` : ''}. Como posso participar?`
      : 'Olá! Gostaria de saber quais são as próximas atividades da associação e como participar.';
    byId('contato').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => byId('contact-name').focus({ preventScroll: true }), reduceMotion ? 0 : 500);
  });

  // Recebimento de mensagens por Netlify Forms; não simula sucesso em arquivo/local.
  const form = byId('contact-form');
  const status = byId('form-status');
  const submitButton = byId('contact-submit');
  const isLocalPreview = location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (isLocalPreview) {
      status.textContent = 'Pré-visualização: publique o site pelo Netlify e ative a detecção de formulários para receber mensagens reais.';
      return;
    }
    submitButton.disabled = true;
    status.textContent = 'Enviando sua mensagem...';
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      });
      if (!response.ok) throw new Error('Falha de envio');
      status.textContent = 'Mensagem enviada. Obrigado! A associação poderá responder ao e-mail informado.';
      form.reset();
    } catch {
      status.textContent = 'Não foi possível enviar. Tente novamente ou entre em contato pelo Instagram da associação.';
    } finally { submitButton.disabled = false; }
  });

  async function loadData(path, fallback) {
    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) throw new Error('Não foi possível carregar ' + path);
      return await response.json();
    } catch (error) { console.warn('Conteúdo não carregado:', path, error.message); return fallback; }
  }
  async function init() {
    const [site, events] = await Promise.all([
      window.__SITE_CONTENT || loadData('data/site.json', null),
      window.__MANUAL_EVENTS || loadData('data/events.json', [])
    ]);
    applyContent(site);
    manualEvents = Array.isArray(events) ? events : [];
    await renderCalendar();
  }
  byId('footer-year').textContent = new Date().getFullYear();
  init();
})();
