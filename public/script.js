// ========================
// Bricktopia Review Page
// ========================

(function () {
  'use strict';

  // --- Config ---
  const API_BASE = window.REVIEW_API_URL || 'https://platizhka-back.vercel.app';
  // New public review API (product reviews — replaces Judge.me).
  // Points to the lost-orders Next.js deployment (dashboard).
  const REVIEW_API = window.PRODUCT_REVIEW_API || 'https://lost-orders.vercel.app';
  const DEFAULT_STORE_ID = 1;

  const STAR_LABELS = {
    1: 'Дуже погано 😞',
    2: 'Погано 😕',
    3: 'Нормально 😐',
    4: 'Добре 😊',
    5: 'Чудово! 🤩',
  };

  const TOTAL_SURVEY_PAGES = 7;
  const TOTAL_REVIEW_PAGES = 4;
  const MAX_FILES = 3;
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

  const STORAGE_KEY = 'bricktopia_promo_v1';

  // --- Validation helpers (mirror server-side validation in submit route) ---
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\+?[\d\s\-()]{9,20}$/;

  function validateContact(value) {
    const v = (value || '').trim();
    // Optional — empty is valid (we just won't send the promo then).
    if (!v) return null;
    if (EMAIL_RE.test(v)) return null;
    if (PHONE_RE.test(v)) return null;
    return "Введіть коректний Email або телефон (або залиште поле порожнім)";
  }

  function validateName(value) {
    const v = (value || '').trim();
    if (!v) return "Вкажіть ваше ім'я";
    if (v.length < 2) return "Ім'я занадто коротке";
    if (/(.)\1{6,}/.test(v)) return "Ім'я виглядає як випадковий набір символів";
    if (/https?:\/\/|www\./i.test(v)) return "Посилання в імені не дозволені";
    return null;
  }

  function validateReviewBody(value) {
    const v = (value || '').trim();
    if (!v) return "Напишіть текст відгуку";
    if (v.length < 5) return "Відгук занадто короткий (мінімум 5 символів)";
    if (/(.)\1{6,}/.test(v)) return "Відгук виглядає як випадковий набір символів";
    if (/^\d+$/.test(v)) return "Відгук має містити текст, а не лише цифри";
    if (/https?:\/\/|www\.[a-z]/i.test(v)) return "Посилання в тексті не дозволені";
    return null;
  }

  // --- DOM refs ---
  const steps = {
    rating: document.getElementById('step-rating'),
    negative: document.getElementById('step-negative'),
    positive: document.getElementById('step-positive'),
    survey: document.getElementById('step-survey'),
    review: document.getElementById('step-review'),
    successNeg: document.getElementById('step-success-negative'),
    successSurvey: document.getElementById('step-success-survey'),
    successReview: document.getElementById('step-success-review'),
  };

  const starBtns = document.querySelectorAll('#step-rating .star-btn');
  const starLabel = document.getElementById('star-label');
  const btnSendNeg = document.getElementById('btn-send-negative');
  const btnShowReview = document.getElementById('btn-show-review');
  const btnShowSurveyAfterReview = document.getElementById('btn-show-survey-after-review');
  const reviewForm = document.getElementById('review-form');
  const reviewStarBtns = document.querySelectorAll('#review-stars .star-btn');
  const reviewRatingLabel = document.getElementById('review-rating-label');
  const reviewProgressBar = document.getElementById('review-progress-bar');
  const reviewStepLabel = document.getElementById('review-step-label');
  const reviewFilesInput = document.getElementById('review-files');
  const filePreviewGrid = document.getElementById('file-preview-grid');
  const surveyForm = document.getElementById('survey-form');
  const surveyProgressBar = document.getElementById('survey-progress-bar');
  const surveyStepLabel = document.getElementById('survey-step-label');

  let selectedRating = 0;
  let reviewRating = 0;
  let currentSurveyPage = 1;
  let currentReviewPage = 1;
  let uploadedMedia = []; // [{ url, contentType, name }]
  // true once the user enters the survey from the review success step —
  // means the survey "Назад" button should return them to the success
  // (promo) screen, not to the positive/rating screen.
  let surveyEnteredFromReview = false;
  // Mirrors localStorage so we don't hit storage on every keystroke
  let storedPromo = null; // { code, percent, savedName, savedContact }

  // --- Helpers ---
  function showStep(name) {
    Object.values(steps).forEach((s) => s.classList.remove('active'));
    const target = steps[name];
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      orderId: params.get('order') || '',
      customerName: params.get('name') || '',
      customerEmail: params.get('email') || '',
      storeId: params.get('store') || '',
      productHandle: params.get('product') || '',
      productTitle: params.get('product_title') || '',
    };
  }

  function getStoreId() {
    const params = getUrlParams();
    return params.storeId ? Number(params.storeId) : DEFAULT_STORE_ID;
  }

  function setLoading(btn, loading) {
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  // --- Survey pagination ---
  function showSurveyPage(page) {
    currentSurveyPage = page;
    document.querySelectorAll('.survey-page').forEach((p) => {
      p.classList.toggle('active', parseInt(p.dataset.page, 10) === page);
    });
    const pct = Math.round((page / TOTAL_SURVEY_PAGES) * 100);
    surveyProgressBar.style.width = pct + '%';
    surveyStepLabel.textContent = `Крок ${page} з ${TOTAL_SURVEY_PAGES}`;
  }

  // --- Pre-fill from URL params ---
  function prefill() {
    const { orderId, customerName, customerEmail, productTitle, productHandle } = getUrlParams();

    if (customerName) {
      ['neg-name', 'survey-name', 'review-name'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = customerName;
      });
    }

    if (customerEmail) {
      const negContact = document.getElementById('neg-contact');
      const surveyContact = document.getElementById('survey-contact');
      const reviewContact = document.getElementById('review-contact');
      if (negContact) negContact.value = customerEmail;
      if (surveyContact) surveyContact.value = customerEmail;
      if (reviewContact) reviewContact.value = customerEmail;
    }

    if (orderId) {
      const negOrder = document.getElementById('neg-order');
      const revOrder = document.getElementById('review-order');
      if (negOrder) negOrder.value = orderId;
      if (revOrder) revOrder.value = orderId;
    }

    // Pre-fill product from URL
    const productInput = document.getElementById('review-product');
    const productGroup = document.getElementById('review-product-group');
    if (productTitle && productInput) {
      productInput.value = productTitle;
    }
    if (productHandle && productTitle && productGroup) {
      // If product is known from URL, hide the field (we already know what they bought)
      productGroup.style.display = 'none';
    }
  }

  // --- Stars interaction ---
  function initStars() {
    starBtns.forEach((btn) => {
      const rating = parseInt(btn.dataset.rating, 10);

      btn.addEventListener('mouseenter', () => highlightStars(rating));
      btn.addEventListener('mouseleave', () => highlightStars(selectedRating));
      btn.addEventListener('click', () => selectRating(rating));
    });
  }

  function highlightStars(upTo) {
    starBtns.forEach((btn) => {
      const r = parseInt(btn.dataset.rating, 10);
      btn.classList.toggle('hover', r <= upTo);
    });

    if (upTo > 0 && upTo !== selectedRating) {
      starLabel.textContent = STAR_LABELS[upTo] || '';
    } else if (selectedRating > 0) {
      starLabel.textContent = STAR_LABELS[selectedRating];
    } else {
      starLabel.textContent = 'Оберіть оцінку';
    }
  }

  function selectRating(rating) {
    selectedRating = rating;

    starBtns.forEach((btn) => {
      const r = parseInt(btn.dataset.rating, 10);
      btn.classList.toggle('active', r <= rating);
    });

    starLabel.textContent = STAR_LABELS[rating];

    setTimeout(() => {
      if (rating <= 3) {
        showStep('negative');
      } else {
        showStep('positive');
      }
    }, 500);
  }

  // --- Review-form stars ---
  function paintReviewStars(upTo) {
    reviewStarBtns.forEach((btn) => {
      const r = parseInt(btn.dataset.rating, 10);
      btn.classList.toggle('active', r <= upTo);
    });
    if (reviewRatingLabel) {
      reviewRatingLabel.textContent = upTo > 0 ? (STAR_LABELS[upTo] || '') : 'Оберіть оцінку';
    }
  }

  function initReviewStars() {
    reviewStarBtns.forEach((btn) => {
      const rating = parseInt(btn.dataset.rating, 10);
      btn.addEventListener('mouseenter', () => paintReviewStars(Math.max(rating, reviewRating)));
      btn.addEventListener('mouseleave', () => paintReviewStars(reviewRating));
      btn.addEventListener('click', () => {
        reviewRating = rating;
        paintReviewStars(rating);
      });
    });
  }

  // --- Review multi-step pagination ---
  function showReviewPage(page) {
    currentReviewPage = page;
    document.querySelectorAll('.review-page').forEach((p) => {
      p.classList.toggle('active', parseInt(p.dataset.page, 10) === page);
    });
    const pct = Math.round((page / TOTAL_REVIEW_PAGES) * 100);
    if (reviewProgressBar) reviewProgressBar.style.width = pct + '%';
    if (reviewStepLabel) reviewStepLabel.textContent = `Крок ${page} з ${TOTAL_REVIEW_PAGES}`;
  }

  function openReviewForm() {
    // Carry over the rating chosen on step 1 (should be 4 or 5)
    reviewRating = selectedRating || 5;
    paintReviewStars(reviewRating);
    showReviewPage(1);
    showStep('review');
  }

  // --- File uploads ---
  function humanSize(bytes) {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' КБ';
    return (bytes / 1024 / 1024).toFixed(1) + ' МБ';
  }

  // Enable/disable the "Далі →" button on the media step based on
  // whether any file is still uploading. Also dims the dropzone label
  // so the state is visible.
  function updateUploadBlockingState() {
    const uploading = uploadedMedia.some((m) => m.uploading);
    const nextBtn = document.querySelector('.review-page[data-page="3"] .btn-review-next');
    if (nextBtn) {
      nextBtn.disabled = uploading;
      nextBtn.classList.toggle('is-uploading', uploading);
      nextBtn.textContent = uploading ? 'Завантаження...' : 'Далі →';
    }
    const drop = document.querySelector('.file-upload-drop');
    if (drop) drop.classList.toggle('is-busy', uploading);
  }

  function renderFilePreview() {
    if (!filePreviewGrid) return;
    filePreviewGrid.innerHTML = '';
    uploadedMedia.forEach((m, i) => {
      const item = document.createElement('div');
      item.className = 'file-preview-item';

      if (m.contentType && m.contentType.startsWith('video/')) {
        const v = document.createElement('video');
        v.src = m.url;
        v.muted = true;
        v.playsInline = true;
        item.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.src = m.url;
        img.alt = '';
        item.appendChild(img);
      }

      if (m.uploading) {
        const spinner = document.createElement('div');
        spinner.className = 'file-preview-spinner';
        item.appendChild(spinner);
      }

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'file-preview-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', 'Видалити');
      remove.addEventListener('click', () => {
        uploadedMedia.splice(i, 1);
        renderFilePreview();
        updateUploadBlockingState();
      });
      item.appendChild(remove);

      filePreviewGrid.appendChild(item);
    });
  }

  async function uploadFile(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${REVIEW_API}/api/public/reviews/upload`, {
      method: 'POST',
      body: form,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[upload]', res.status, body);
      const detail = [body.error, body.hint].filter(Boolean).join(' — ');
      throw new Error(detail || `HTTP ${res.status}`);
    }
    return body;
  }

  function initFileUpload() {
    if (!reviewFilesInput) return;
    reviewFilesInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = ''; // allow re-selecting same file

      for (const file of files) {
        if (uploadedMedia.length >= MAX_FILES) {
          alert(`Максимум ${MAX_FILES} файлів`);
          break;
        }
        if (file.size > MAX_FILE_SIZE) {
          alert(`Файл "${file.name}" завеликий (${humanSize(file.size)}). Макс. ${humanSize(MAX_FILE_SIZE)}.`);
          continue;
        }

        // Local preview while uploading
        const localUrl = URL.createObjectURL(file);
        const placeholder = { url: localUrl, contentType: file.type, name: file.name, uploading: true };
        uploadedMedia.push(placeholder);
        renderFilePreview();
        updateUploadBlockingState();

        try {
          const result = await uploadFile(file);
          const idx = uploadedMedia.indexOf(placeholder);
          if (idx !== -1) {
            uploadedMedia[idx] = { url: result.url, contentType: result.contentType || file.type, name: file.name };
            renderFilePreview();
        updateUploadBlockingState();
          }
        } catch (err) {
          console.error('Upload error:', err);
          alert('Не вдалось завантажити файл: ' + (err && err.message ? err.message : 'невідома помилка'));
          const idx = uploadedMedia.indexOf(placeholder);
          if (idx !== -1) uploadedMedia.splice(idx, 1);
          renderFilePreview();
        updateUploadBlockingState();
        }
      }
    });
  }

  // --- Promo storage ---
  function loadStoredPromo() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.code) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveStoredPromo(patch) {
    storedPromo = Object.assign({}, storedPromo || {}, patch);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPromo));
    } catch {
      // quota / privacy mode — just ignore; banner lasts for the session
    }
  }

  function bindCopyButton(btn, codeEl) {
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    const original = btn.textContent;
    btn.addEventListener('click', async () => {
      const value = codeEl.textContent || '';
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const range = document.createRange();
        range.selectNode(codeEl);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
      }
      btn.textContent = 'Скопійовано ✓';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('copied');
      }, 2000);
    });
  }

  // --- Floating promo bar (visible on every page load once issued) ---
  function renderPromoBar() {
    const bar = document.getElementById('promo-bar');
    const codeEl = document.getElementById('promo-bar-code');
    const percentEl = document.getElementById('promo-bar-percent');
    const copyBtn = document.getElementById('promo-bar-copy');
    const closeBtn = document.getElementById('promo-bar-close');
    if (!bar || !codeEl) return;

    if (!storedPromo || !storedPromo.code) {
      bar.style.display = 'none';
      return;
    }

    codeEl.textContent = storedPromo.code;
    if (percentEl) percentEl.textContent = (storedPromo.percent || 5) + '%';
    bar.style.display = 'block';

    bindCopyButton(copyBtn, codeEl);

    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = '1';
      closeBtn.addEventListener('click', () => {
        bar.style.display = 'none';
      });
    }
  }

  // --- Fill the promo cards on the success screens ---
  function renderPromoCard(which) {
    // which = 'review' | 'survey'
    const ids = {
      review: { card: 'review-promo-card', code: 'review-promo-code', copy: 'review-promo-copy', percent: 'review-promo-percent' },
      survey: { card: 'survey-promo-card', code: 'survey-promo-code', copy: 'survey-promo-copy' },
    }[which] || {};
    const card = document.getElementById(ids.card);
    const codeEl = document.getElementById(ids.code);
    const copyBtn = document.getElementById(ids.copy);
    if (!card || !codeEl) return;

    if (!storedPromo || !storedPromo.code) {
      card.style.display = 'none';
      return;
    }

    codeEl.textContent = storedPromo.code;
    if (ids.percent) {
      const pEl = document.getElementById(ids.percent);
      if (pEl) pEl.textContent = (storedPromo.percent || 5) + '%';
    }
    card.style.display = 'block';
    bindCopyButton(copyBtn, codeEl);

    // Swap the "improve promo" offer for an "already upgraded" badge
    // once we've upgraded to 10%.
    if (which === 'review') {
      const offerCard = document.getElementById('offer-survey-card');
      const upgradedBadge = document.getElementById('promo-upgraded-badge');
      const upgraded = Number(storedPromo.percent) >= 10;
      if (offerCard) offerCard.style.display = upgraded ? 'none' : 'block';
      if (upgradedBadge) upgradedBadge.style.display = upgraded ? 'block' : 'none';
    }
  }

  // Entry point after submit: save + update all three spots
  function setPromoFromReview(code) {
    if (!code) return;
    saveStoredPromo({ code, percent: 5 });
    renderPromoBar();
    renderPromoCard('review');
  }

  async function upgradeStoredPromo() {
    if (!storedPromo || !storedPromo.code) return;
    try {
      const res = await fetch(`${REVIEW_API}/api/public/reviews/upgrade-promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: getStoreId(), code: storedPromo.code }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('[upgrade-promo]', res.status, body);
        return;
      }
      if (body.discountValue) {
        saveStoredPromo({ percent: Number(body.discountValue) });
        renderPromoBar();
        renderPromoCard('review');
        renderPromoCard('survey');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
    }
  }

  // --- Marketing opt-in on the success screen ---
  // The checkbox asks if the customer wants to subscribe to launches/sales.
  // If they tick yes and we already have their email (from the review),
  // subscribe silently. If not, reveal an email input so they can type one.
  let optinSubmittedReviewId = null;

  function initOptin() {
    const consent = document.getElementById('optin-consent');
    const emailWrap = document.getElementById('optin-email-wrap');
    const emailInput = document.getElementById('optin-email');
    const subscribeBtn = document.getElementById('btn-optin-subscribe');
    const doneMsg = document.getElementById('optin-done');
    if (!consent || !emailWrap || !subscribeBtn) return;

    async function doSubscribe(email) {
      const clean = (email || '').trim();
      if (!EMAIL_RE.test(clean)) {
        alert('Введіть коректний Email');
        if (emailInput) emailInput.focus();
        return;
      }
      subscribeBtn.disabled = true;
      try {
        const res = await fetch(`${REVIEW_API}/api/public/subscribers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: getStoreId(),
            email: clean,
            name: (document.getElementById('review-name') || {}).value || (storedPromo && storedPromo.savedName) || null,
            reviewId: optinSubmittedReviewId,
            source: 'review_page',
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error('[subscribe]', res.status, body);
          alert('Не вдалось підписати: ' + ((body.error || '') + (body.hint ? ' — ' + body.hint : '')));
          return;
        }
        consent.disabled = true;
        emailWrap.style.display = 'none';
        if (doneMsg) doneMsg.style.display = 'block';
      } catch (err) {
        console.error(err);
        alert('Помилка мережі. Спробуйте ще раз.');
      } finally {
        subscribeBtn.disabled = false;
      }
    }

    consent.addEventListener('change', () => {
      if (!consent.checked) {
        emailWrap.style.display = 'none';
        return;
      }
      // Already have email from review? Subscribe silently.
      const reviewContact = ((document.getElementById('review-contact') || {}).value || '').trim();
      if (EMAIL_RE.test(reviewContact)) {
        doSubscribe(reviewContact);
        return;
      }
      // No email — ask for one.
      emailWrap.style.display = 'flex';
      if (emailInput) {
        if (!emailInput.value && storedPromo && storedPromo.savedContact && EMAIL_RE.test(storedPromo.savedContact)) {
          emailInput.value = storedPromo.savedContact;
        }
        emailInput.focus();
      }
    });

    subscribeBtn.addEventListener('click', () => {
      doSubscribe(emailInput ? emailInput.value : '');
    });
  }

  function resetOptin() {
    const consent = document.getElementById('optin-consent');
    const emailWrap = document.getElementById('optin-email-wrap');
    const doneMsg = document.getElementById('optin-done');
    if (consent) { consent.checked = false; consent.disabled = false; }
    if (emailWrap) emailWrap.style.display = 'none';
    if (doneMsg) doneMsg.style.display = 'none';
  }

  // --- Review pagination nav ---
  function initReviewNav() {
    document.querySelectorAll('.btn-review-next').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = parseInt(btn.dataset.next, 10);

        // Validate current page
        if (currentReviewPage === 1 && !reviewRating) {
          alert('Оберіть оцінку');
          return;
        }
        if (currentReviewPage === 2) {
          const err = validateReviewBody(document.getElementById('review-body').value);
          if (err) { alert(err); return; }
        }
        if (currentReviewPage === 3) {
          // Block nav while any file is still uploading
          if (uploadedMedia.some((m) => m.uploading)) {
            alert('Зачекайте поки завантажаться файли');
            return;
          }
        }

        showReviewPage(next);
      });
    });

    document.querySelectorAll('.btn-review-prev').forEach((btn) => {
      btn.addEventListener('click', () => {
        showReviewPage(parseInt(btn.dataset.prev, 10));
      });
    });
  }

  async function submitProductReview(data) {
    const urlP = getUrlParams();
    const payload = {
      storeId: getStoreId(),
      productHandle: urlP.productHandle || null,
      productTitle: data.productTitle || urlP.productTitle || null,
      rating: data.rating,
      body: data.body,
      authorName: data.name,
      authorEmail: data.contact || null,
      orderId: data.orderId || null,
      images: data.images || [],
      urlParams: urlP,
    };

    const response = await fetch(`${REVIEW_API}/api/public/reviews/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[submit review]', response.status, body);
      const detail = [body.error, body.hint].filter(Boolean).join(' — ');
      throw new Error(detail || `HTTP ${response.status}`);
    }

    return body;
  }

  // --- Submit to platizhka-back API ---
  async function submitReview(data) {
    const payload = {
      storeId: getStoreId(),
      type: data.type,
      rating: data.rating,
      name: data.name,
      contact: data.contact,
      orderId: data.orderId || data.order || null,
      problem: data.problem || null,
      source: data.source || null,
      reorder: data.reorder || null,
      deliverySpeed: data.delivery_speed || null,
      quality: data.quality || null,
      packaging: data.packaging || null,
      improve: data.improve || null,
      wishlist: data.wishlist || null,
      urlParams: getUrlParams(),
    };

    const response = await fetch(`${API_BASE}/reviews/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Server error');
    }

    return response.json();
  }

  // --- Back buttons ---
  function initBackButtons() {
    document.querySelectorAll('.btn-back').forEach((btn) => {
      btn.addEventListener('click', () => {
        // Survey → if we came from review success, return there (with promo),
        // not to the positive step.
        if (btn.id === 'survey-back-btn' && surveyEnteredFromReview) {
          showStep('successReview');
          return;
        }
        const target = btn.dataset.go;
        if (target) showStep(target);
      });
    });
  }

  // --- Survey page navigation ---
  function initSurveyNav() {
    document.querySelectorAll('.btn-survey-next').forEach((btn) => {
      btn.addEventListener('click', () => {
        showSurveyPage(parseInt(btn.dataset.next, 10));
      });
    });

    document.querySelectorAll('.btn-survey-prev').forEach((btn) => {
      btn.addEventListener('click', () => {
        showSurveyPage(parseInt(btn.dataset.prev, 10));
      });
    });
  }

  // Reveal the free-text field when "Інше" is picked in a radio group.
  function initOtherInputs() {
    document.querySelectorAll('.radio-group[data-other-input]').forEach((group) => {
      const inputId = group.dataset.otherInput;
      const input = document.getElementById(inputId);
      if (!input) return;
      group.querySelectorAll('input[type="radio"]').forEach((radio) => {
        radio.addEventListener('change', () => {
          const isOther = radio.checked && radio.value === 'other';
          input.style.display = isOther ? 'block' : 'none';
          if (isOther) setTimeout(() => input.focus(), 50);
        });
      });
    });
  }

  // --- Event handlers ---
  function initEvents() {
    // Send negative feedback
    btnSendNeg.addEventListener('click', async () => {
      const name = document.getElementById('neg-name').value.trim();
      const contact = document.getElementById('neg-contact').value.trim();
      const problem = document.getElementById('neg-problem').value.trim();

      if (!name || !contact || !problem) {
        alert("Будь ласка, заповніть ім'я, контакт та опис проблеми");
        return;
      }

      setLoading(btnSendNeg, true);
      try {
        await submitReview({
          type: 'complaint',
          rating: selectedRating,
          name,
          contact,
          order: document.getElementById('neg-order').value.trim(),
          problem,
        });
        showStep('successNeg');
      } catch (e) {
        console.error('Submit error:', e);
        alert('Помилка відправки. Спробуйте ще раз.');
      } finally {
        setLoading(btnSendNeg, false);
      }
    });

    // Show our product-review form (replaces Judge.me link)
    if (btnShowReview) {
      btnShowReview.addEventListener('click', openReviewForm);
    }

    // Offer the survey AFTER a positive review is submitted
    if (btnShowSurveyAfterReview) {
      btnShowSurveyAfterReview.addEventListener('click', () => {
        // Carry name/contact from the review step into the hidden survey
        // fields so the downstream API still gets them without asking again.
        const revName = (document.getElementById('review-name') || {}).value || '';
        const revContact = (document.getElementById('review-contact') || {}).value || '';
        const svName = document.getElementById('survey-name');
        const svContact = document.getElementById('survey-contact');
        if (svName) svName.value = revName || (storedPromo && storedPromo.savedName) || '';
        if (svContact) svContact.value = revContact || (storedPromo && storedPromo.savedContact) || '';

        surveyEnteredFromReview = true;
        showStep('survey');
        showSurveyPage(1);
      });
    }

    // Submit product review (triggered from page 4)
    if (reviewForm) {
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('review-name').value.trim();
        const contact = document.getElementById('review-contact').value.trim();
        const body = document.getElementById('review-body').value.trim();
        const orderId = document.getElementById('review-order').value.trim();
        const productTitle = document.getElementById('review-product').value.trim();

        if (!reviewRating) {
          alert('Оберіть оцінку');
          showReviewPage(1);
          return;
        }
        const bodyErr = validateReviewBody(body);
        if (bodyErr) {
          alert(bodyErr);
          showReviewPage(2);
          return;
        }
        const nameErr = validateName(name);
        if (nameErr) {
          alert(nameErr);
          showReviewPage(4);
          return;
        }
        const contactErr = validateContact(contact);
        if (contactErr) {
          alert(contactErr);
          showReviewPage(4);
          return;
        }

        // Block submit while any file is still uploading
        if (uploadedMedia.some((m) => m.uploading)) {
          alert('Зачекайте поки завантажаться файли');
          return;
        }

        const submitBtn = document.getElementById('btn-send-review');
        setLoading(submitBtn, true);
        try {
          const result = await submitProductReview({
            rating: reviewRating,
            name,
            contact,
            body,
            orderId,
            productTitle,
            images: uploadedMedia.map((m) => m.url),
          });
          if (result && result.promoCode) {
            saveStoredPromo({ savedName: name, savedContact: contact });
            setPromoFromReview(result.promoCode);
          }
          optinSubmittedReviewId = (result && result.id) || null;
          resetOptin();
          postToHost('review-submitted', {
            rating: reviewRating,
            promoCode: result && result.promoCode,
            hasMedia: uploadedMedia.length > 0,
          });
          showStep('successReview');
        } catch (err) {
          console.error('Review submit error:', err);
          alert('Помилка відправки: ' + (err && err.message ? err.message : 'невідома помилка'));
        } finally {
          setLoading(submitBtn, false);
        }
      });
    }

    // Submit survey
    surveyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Name/contact are carried over from the review step (hidden inputs).
      // Fall back to stored values if somehow missing.
      const name = (document.getElementById('survey-name').value.trim()) ||
        (storedPromo && storedPromo.savedName) || '';
      const contact = (document.getElementById('survey-contact').value.trim()) ||
        (storedPromo && storedPromo.savedContact) || '';

      const getRadio = (radioName) => {
        const el = document.querySelector(`input[name="${radioName}"]:checked`);
        return el ? el.value : '';
      };

      // Inline other-field values are appended to the chosen radio value
      const withOther = (radioName, otherInputId) => {
        const v = getRadio(radioName);
        if (v !== 'other') return v;
        const txt = (document.getElementById(otherInputId) || {}).value || '';
        return txt.trim() ? `other: ${txt.trim()}` : 'other';
      };

      // Human-readable labels for the extra rating answers so admins
      // reading the dashboard aren't guessing what "very_easy" means.
      const CONV_LABELS = {
        very_easy: 'Дуже зручно',
        ok: 'Нормально',
        hard: 'Було складно',
        didnt_use: 'Не користувався',
      };
      const PARTS_LABELS = {
        yes: 'Так, все було',
        mostly: 'Здебільшого так',
        no: 'Ні, не вистачило',
      };
      const WEB_LABELS = {
        excellent: 'Дуже зручний',
        good: 'Добрий',
        ok: 'Нормальний',
        bad: 'Важко користуватись',
      };
      const labeledLine = (label, raw, map) => {
        if (!raw) return '';
        const pretty = (map && map[raw]) || raw;
        return `${label}: ${pretty}`;
      };

      const constructorConvenience = getRadio('constructor_convenience');
      const partsFound = getRadio('parts_found');
      const websiteConvenience = getRadio('website_convenience');
      const constructorChange = (document.getElementById('survey-constructor-change').value || '').trim();
      const partsMissing = (document.getElementById('survey-parts-missing').value || '').trim();
      const accessories = (document.getElementById('survey-accessories').value || '').trim();
      const generalImprove = (document.getElementById('survey-improve').value || '').trim();
      const generalWishlist = (document.getElementById('survey-wishlist').value || '').trim();

      // Backend schema only has `improve` / `wishlist` text columns. Pack
      // the new structured answers into them as labeled lines so every
      // answer survives to the admin dashboard without a schema change.
      const improveParts = [
        labeledLine('Конструктор', constructorConvenience, CONV_LABELS),
        labeledLine('Сайт', websiteConvenience, WEB_LABELS),
        constructorChange ? `Що змінити в конструкторі: ${constructorChange}` : '',
        generalImprove ? `Інше: ${generalImprove}` : '',
      ].filter(Boolean).join('\n');

      const wishlistParts = [
        labeledLine('Знайдено деталей', partsFound, PARTS_LABELS),
        partsMissing ? `Бракує деталей: ${partsMissing}` : '',
        accessories ? `Аксесуари: ${accessories}` : '',
        generalWishlist ? `Бажані товари: ${generalWishlist}` : '',
      ].filter(Boolean).join('\n');

      const submitBtn = surveyForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);
      try {
        await submitReview({
          type: 'survey',
          rating: selectedRating,
          name,
          contact,
          source: withOther('source', 'source-other'),
          reorder: getRadio('reorder'),
          delivery_speed: withOther('delivery_speed', 'delivery-other'),
          quality: getRadio('quality'),
          packaging: withOther('packaging', 'packaging-other'),
          improve: improveParts,
          wishlist: wishlistParts,
        });
        // Upgrade the stored promo from 5% → 10% as the reward for
        // completing the survey, then render the survey-success card.
        await upgradeStoredPromo();
        renderPromoCard('survey');
        postToHost('survey-submitted', {
          promoCode: storedPromo && storedPromo.code,
          promoPercent: storedPromo && storedPromo.percent,
        });
        showStep('successSurvey');
      } catch (e) {
        console.error('Submit error:', e);
        alert('Помилка відправки. Спробуйте ще раз.');
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  // --- Embed mode (iframe on Shopify) ---
  function isEmbedMode() {
    if (location.pathname === '/embed' || location.pathname === '/embed.html') return true;
    const params = new URLSearchParams(location.search);
    return params.get('embed') === '1' || window.self !== window.top;
  }

  // Notify the host page when something meaningful happens, so it can
  // e.g. close the popup after a successful submit.
  function postToHost(type, payload) {
    if (window.self === window.top) return;
    try {
      window.parent.postMessage({ source: 'bricktopia-reviews', type, ...payload }, '*');
    } catch {
      /* ignore — cross-origin postMessage failures are non-fatal */
    }
  }

  // --- Init ---
  function init() {
    if (isEmbedMode()) {
      document.body.classList.add('is-embed');
      postToHost('ready', {});
    }

    storedPromo = loadStoredPromo();
    renderPromoBar();

    prefill();
    initStars();
    initReviewStars();
    initReviewNav();
    initFileUpload();
    initBackButtons();
    initSurveyNav();
    initOtherInputs();
    initOptin();
    initEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
