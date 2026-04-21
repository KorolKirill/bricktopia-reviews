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

  const TOTAL_SURVEY_PAGES = 3;
  const TOTAL_REVIEW_PAGES = 4;
  const MAX_FILES = 3;
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

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

        try {
          const result = await uploadFile(file);
          const idx = uploadedMedia.indexOf(placeholder);
          if (idx !== -1) {
            uploadedMedia[idx] = { url: result.url, contentType: result.contentType || file.type, name: file.name };
            renderFilePreview();
          }
        } catch (err) {
          console.error('Upload error:', err);
          alert('Не вдалось завантажити файл: ' + (err && err.message ? err.message : 'невідома помилка'));
          const idx = uploadedMedia.indexOf(placeholder);
          if (idx !== -1) uploadedMedia.splice(idx, 1);
          renderFilePreview();
        }
      }
    });
  }

  // --- Show auto-generated promo code on success ---
  function renderPromoCode(code) {
    const card = document.getElementById('review-promo-card');
    const codeEl = document.getElementById('review-promo-code');
    const copyBtn = document.getElementById('review-promo-copy');
    if (!card || !codeEl) return;

    if (!code) {
      card.style.display = 'none';
      return;
    }

    codeEl.textContent = code;
    card.style.display = 'block';

    if (copyBtn && !copyBtn.dataset.bound) {
      copyBtn.dataset.bound = '1';
      copyBtn.addEventListener('click', async () => {
        const value = codeEl.textContent || '';
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // Fallback for older browsers
          const range = document.createRange();
          range.selectNode(codeEl);
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(range);
          document.execCommand('copy');
          window.getSelection().removeAllRanges();
        }
        copyBtn.textContent = 'Скопійовано ✓';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = 'Копіювати';
          copyBtn.classList.remove('copied');
        }, 2000);
      });
    }
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
          const body = document.getElementById('review-body').value.trim();
          if (!body) {
            alert('Напишіть, будь ласка, текст відгуку');
            return;
          }
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
        const target = btn.dataset.go;
        if (target) showStep(target);
      });
    });
  }

  // --- Survey page navigation ---
  function initSurveyNav() {
    document.querySelectorAll('.btn-survey-next').forEach((btn) => {
      btn.addEventListener('click', () => {
        // Validate page 1 required fields
        if (currentSurveyPage === 1) {
          const name = document.getElementById('survey-name').value.trim();
          const contact = document.getElementById('survey-contact').value.trim();
          if (!name || !contact) {
            alert("Будь ласка, заповніть ім'я та контакт");
            return;
          }
        }
        showSurveyPage(parseInt(btn.dataset.next, 10));
      });
    });

    document.querySelectorAll('.btn-survey-prev').forEach((btn) => {
      btn.addEventListener('click', () => {
        showSurveyPage(parseInt(btn.dataset.prev, 10));
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
        if (!body) {
          alert('Напишіть, будь ласка, текст відгуку');
          showReviewPage(2);
          return;
        }
        if (!name) {
          alert("Вкажіть, як підписати відгук");
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
          renderPromoCode(result && result.promoCode);
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

      const name = document.getElementById('survey-name').value.trim();
      const contact = document.getElementById('survey-contact').value.trim();

      if (!name || !contact) {
        alert("Будь ласка, заповніть ім'я та контакт");
        showSurveyPage(1);
        return;
      }

      const getRadio = (radioName) => {
        const el = document.querySelector(`input[name="${radioName}"]:checked`);
        return el ? el.value : '';
      };

      const submitBtn = surveyForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);
      try {
        await submitReview({
          type: 'survey',
          rating: selectedRating,
          name,
          contact,
          source: getRadio('source'),
          reorder: getRadio('reorder'),
          delivery_speed: getRadio('delivery_speed'),
          quality: getRadio('quality'),
          packaging: getRadio('packaging'),
          improve: document.getElementById('survey-improve').value.trim(),
          wishlist: document.getElementById('survey-wishlist').value.trim(),
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

  // --- Init ---
  function init() {
    prefill();
    initStars();
    initReviewStars();
    initReviewNav();
    initFileUpload();
    initBackButtons();
    initSurveyNav();
    initEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
