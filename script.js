const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 3, 2) * 75}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const cards = [...document.querySelectorAll('.interactive-card')];
const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
cursor.setAttribute('aria-hidden', 'true');
cursor.textContent = 'GRAB';
document.body.append(cursor);

cards.forEach((card) => {
  const back = document.createElement('div');
  back.className = 'card-back';
  back.textContent = card.dataset.back || 'A little more about this card.';
  card.append(back);

  const flipButton = card.querySelector('.flip-toggle');
  flipButton?.addEventListener('click', () => {
    const flipped = card.classList.toggle('is-flipped');
    flipButton.setAttribute('aria-label', flipped ? 'Show front of card' : 'Flip card');
  });

  card.addEventListener('pointerenter', () => {
    if (matchMedia('(pointer:fine)').matches) cursor.classList.add('visible');
  });
  card.addEventListener('pointerleave', () => cursor.classList.remove('visible', 'flip'));
  card.addEventListener('pointermove', (event) => {
    if (!matchMedia('(pointer:fine)').matches) return;
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    const onFlip = event.target.closest('.flip-toggle');
    const onGrip = event.target.closest('.card-grip');
    cursor.textContent = onFlip ? 'FLIP' : onGrip ? 'DRAG' : 'GRAB';
    cursor.classList.toggle('flip', Boolean(onFlip));
  });
});

let dragging = null;
document.querySelectorAll('.card-grip').forEach((grip) => {
  grip.addEventListener('pointerdown', (event) => {
    if (innerWidth <= 700 || event.button !== 0) return;
    const card = grip.closest('.interactive-card');
    if (!card || card.classList.contains('is-flipped')) return;
    event.preventDefault();
    dragging = { card, grip, x: event.clientX, y: event.clientY, started: false };
    grip.setPointerCapture(event.pointerId);
  });
  grip.addEventListener('pointermove', (event) => {
    if (!dragging || dragging.grip !== grip) return;
    const dx = event.clientX - dragging.x;
    const dy = event.clientY - dragging.y;
    if (!dragging.started && Math.hypot(dx, dy) < 5) return;
    dragging.started = true;
    dragging.card.classList.add('is-dragging');
    dragging.card.style.transform = `translate3d(${dx}px,${dy}px,0) rotate(1deg) scale(1.025)`;
  });
  const finishDrag = (event) => {
    if (!dragging || dragging.grip !== grip) return;
    const { card, started } = dragging;
    card.classList.remove('is-dragging');
    card.style.transform = '';
    if (started) {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.interactive-card');
      if (target && target !== card) {
        const a = getComputedStyle(card);
        const b = getComputedStyle(target);
        const posA = [a.gridColumn, a.gridRow];
        const posB = [b.gridColumn, b.gridRow];
        card.style.gridColumn = posB[0];
        card.style.gridRow = posB[1];
        target.style.gridColumn = posA[0];
        target.style.gridRow = posA[1];
      }
    }
    dragging = null;
  };
  grip.addEventListener('pointerup', finishDrag);
  grip.addEventListener('pointercancel', finishDrag);
});
