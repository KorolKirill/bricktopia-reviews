// ========================
// Bricktopia Review Page
// ========================

(function () {
  'use strict';

  // --- Config ---
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
    };
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

  // --- Collect form data ---
  function collectNegativeData() {
    return {
      type: 'complaint',
      rating: selectedRating,
      name: document.getElementById('neg-name').value.trim(),
      contact: document.getElementById('neg-contact').value.trim(),
      order: document.getElementById('neg-order').value.trim(),
      problem: document.getElementById('neg-problem').value.trim(),
      timestamp: new Date().toISOString(),
      url_params: getUrlParams(),
    };
  }

  function collectSurveyData() {
    const getRadio = (name) => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : '';
    };

    return {
      type: 'survey',
      rating: selectedRating,
      name: document.getElementById('survey-name').value.trim(),
      contact: document.getElementById('survey-contact').value.trim(),
      source: getRadio('source'),
      reorder: getRadio('reorder'),
      delivery_speed: getRadio('delivery_speed'),
      quality: getRadio('quality'),
      packaging: getRadio('packaging'),
      improve: document.getElementById('survey-improve').value.trim(),
      wishlist: document.getElementById('survey-wishlist').value.trim(),
      timestamp: new Date().toISOString(),
      url_params: getUrlParams(),
    };
  }

  // --- Submit data ---
  // For now we store in localStorage and log; replace with real API later
  async function submitData(data) {
    console.log('Review data:', JSON.stringify(data, null, 2));

    // Store locally
    const stored = JSON.parse(localStorage.getItem('bricktopia_reviews') || '[]');
    stored.push(data);
    localStorage.setItem('bricktopia_reviews', JSON.stringify(stored));

    // TODO: Replace with actual API call
    // await fetch('/api/reviews', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });

    return true;
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
        await submitData(collectNegativeData());
        showStep('successNeg');
      } catch (e) {
        console.error(e);
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

      const submitBtn = surveyForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);
      try {
        await submitData(collectSurveyData());
        showStep('successSurvey');
      } catch (e) {
        console.error(e);
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
