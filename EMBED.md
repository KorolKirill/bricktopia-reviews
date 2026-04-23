# Вбудована форма відгуків (iframe / popup)

Форму можна вбудувати на будь-який сайт (напр. bricktopia.store) як iframe
без шапки і футера — для поп-апа після доставки, дякуючого модала тощо.

## URL

```
https://bricktopia-reviews.vercel.app/embed
```

Аліас: `?embed=1` до будь-якого URL, або просто iframe — embed-режим
вмикається автоматично, коли сторінка відкрита не в top-вікні.

Параметри URL (опціональні, ті самі що й у звичайної сторінки):

- `order` — номер замовлення
- `name` — ім'я клієнта
- `email` — email/телефон (підставиться в форму)
- `product` — handle товару (для авто-прив'язки відгуку)
- `product_title` — назва товару (для відображення)

Приклад з параметрами:

```
https://bricktopia-reviews.vercel.app/embed?order=%23BBCDBR1234&name=Ольга&email=olga%40mail.com
```

## Shopify-тема: простий поп-ап

```html
<!-- Кнопка, яка відкриває поп-ап -->
<button id="leave-review" class="btn">Залишити відгук</button>

<!-- Поп-ап -->
<div id="review-modal" class="review-modal" hidden>
  <div class="review-modal-backdrop"></div>
  <div class="review-modal-body">
    <button class="review-modal-close" aria-label="Закрити">&times;</button>
    <iframe
      id="review-iframe"
      src="https://bricktopia-reviews.vercel.app/embed"
      title="Залишити відгук"
      style="width:100%; height:720px; border:0; border-radius:16px;"
    ></iframe>
  </div>
</div>

<style>
  .review-modal { position: fixed; inset: 0; z-index: 9999; display: flex;
    align-items: center; justify-content: center; }
  .review-modal[hidden] { display: none; }
  .review-modal-backdrop { position: absolute; inset: 0;
    background: rgba(0,0,0,.55); backdrop-filter: blur(4px); }
  .review-modal-body { position: relative; max-width: 560px; width: 92%;
    max-height: 90vh; overflow: hidden; background: #fff; border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,.35); }
  .review-modal-close { position: absolute; top: 8px; right: 10px;
    background: transparent; border: 0; font-size: 26px; line-height: 1;
    cursor: pointer; z-index: 1; }
</style>

<script>
  const modal = document.getElementById('review-modal');
  const iframe = document.getElementById('review-iframe');
  const closeBtn = document.querySelector('.review-modal-close');
  const backdrop = document.querySelector('.review-modal-backdrop');
  const openBtn = document.getElementById('leave-review');

  function openModal(params = {}) {
    const url = new URL('https://bricktopia-reviews.vercel.app/embed');
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
    iframe.src = url.toString();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    iframe.src = 'about:blank';
  }

  openBtn?.addEventListener('click', () => {
    openModal({
      // Передай параметри з замовлення, якщо є:
      // order: '#BBCDBR1234',
      // name: customerFirstName,
      // email: customerEmail,
      // product: 'cow-figurine',
      // product_title: 'Корова-фігурка',
    });
  });
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // Повідомлення від iframe — закриваємо поп-ап через 3 сек після успіху
  window.addEventListener('message', (e) => {
    if (e.data?.source !== 'bricktopia-reviews') return;
    // Only close when the user explicitly indicates they're done
    // (clicks "Перейти до магазину"). "review-submitted" and
    // "survey-submitted" are NOT close signals — the user might still
    // want to subscribe to the newsletter, take the survey for a bigger
    // promo, etc.
    if (e.data.type === 'user-done') {
      closeModal();
    }
  });
</script>
```

## postMessage події

Iframe надсилає events в `window.parent`:

| type | payload | коли |
|---|---|---|
| `ready` | `{}` | iframe завантажився |
| `resize` | `{ height }` | контент змінив висоту (кожен крок) — use to auto-fit iframe |
| `review-submitted` | `{ rating, promoCode, hasMedia }` | відгук збережено (НЕ закривай поп-ап — клієнт може ще підписатися або пройти опитування) |
| `survey-submitted` | `{ promoCode, promoPercent }` | опитування пройшов → промо підвищено до 10% (НЕ закривай — клієнт читає промокод) |
| `user-done` | `{ reason: 'go-to-store' }` | клієнт явно натиснув "Перейти до магазину" — можна закривати |

Усі містять `source: "bricktopia-reviews"` — фільтруй по ньому.

### Авто-ресайз iframe

Щоб iframe підлаштовувався під висоту контенту і не мав прокрутки зсередини:

```js
window.addEventListener('message', (e) => {
  if (e.data?.source !== 'bricktopia-reviews') return;
  if (e.data.type === 'resize' && typeof e.data.height === 'number') {
    iframe.style.height = (e.data.height + 20) + 'px'; // +20 for padding
  }
});
```

Якщо цим не користуватися — в iframe все одно фіксована `min-height: 520px` на кожному кроці, тож контент не стрибатиме всередині iframe з висотою `~640-720px`.
