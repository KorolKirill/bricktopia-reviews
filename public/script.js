// ========================
// Bricktopia Review Page
// ========================

(function () {
  'use strict';

  // --- Config ---
  // API URL: use defined window var, or auto-detect from URL params, or default
  const API_BASE = window.REVIEW_API_URL || 'https://platizhka-back.vercel.app';
  const DEFAULT_STORE_ID = 1; // Bricktopia store ID in platizhka

  const JUDGE_ME_URL =
    'https://judge.me/product_reviews/5d10bc62-b28b-4e1e-9cbb-81ae0d86919a/new?store-review-only=true&source=shareable-link';

  const STAR_LABELS = {
    1: 'Дуже погано 😞',
    2: 'Погано 😕',
    3: 'Нормально 😐',
    4: 'Добре 😊',
    5: 'Чудово! 🤩',
  };

  // --- DOM refs ---
  const steps = {
    rating: document.getElementById('step-rating'),
    negative: document.getElementById('step-negative'),
    positive: document.getElementById('step-positive'),
    survey: document.getElementById('step-survey'),
    successNeg: document.getElementById('step-success-negative'),
    successSurvey: document.getElementById('step-success-survey'),
  };

  const starBtns = document.querySelectorAll('.star-btn');
  const starLabel = document.getElementById('star-label');
  const btnSendNeg = document.getElementById('btn-send-negative');
  const btnShowSurvey = document.getElementById('btn-show-survey');
  const surveyForm = document.getElementById('survey-form');

  let selectedRating = 0;

  // --- Helpers ---
  function showStep(name) {
    Object.values(steps).forEach((s) => s.classList.remove('active'));
    const target = steps[name];
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      orderId: params.get('order') || '',
      customerName: params.get('name') || '',
      customerEmail: params.get('email') || '',
      storeId: params.get('store') || '',
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

  // --- Pre-fill from URL params ---
  function prefill() {
    const { orderId, customerName, customerEmail } = getUrlParams();

    if (customerName) {
      const negName = document.getElementById('neg-name');
      const surveyName = document.getElementById('survey-name');
      if (negName) negName.value = customerName;
      if (surveyName) surveyName.value = customerName;
    }

    if (customerEmail) {
      const negContact = document.getElementById('neg-contact');
      const surveyContact = document.getElementById('survey-contact');
      if (negContact) negContact.value = customerEmail;
      if (surveyContact) surveyContact.value = customerEmail;
    }

    if (orderId) {
      const negOrder = document.getElementById('neg-order');
      if (negOrder) negOrder.value = orderId;
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

    // Delay to let user see their selection
    setTimeout(() => {
      if (rating <= 3) {
        showStep('negative');
      } else {
        showStep('positive');
      }
    }, 500);
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

    // Show survey
    btnShowSurvey.addEventListener('click', () => {
      showStep('survey');
    });

    // Submit survey
    surveyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('survey-name').value.trim();
      const contact = document.getElementById('survey-contact').value.trim();

      if (!name || !contact) {
        alert("Будь ласка, заповніть ім'я та контакт");
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
    initEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
