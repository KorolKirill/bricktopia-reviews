/* Bricktopia / Kloniko review form — i18n + brand runtime.
 *
 * Loaded before script.js. Reads ?store= (ua|pl) and ?locale= (uk|pl|en) from
 * the URL, exposes:
 *   REVIEW_I18N.locale      current locale (uk|pl|en)
 *   REVIEW_I18N.store        current store  (ua|pl)
 *   REVIEW_I18N.brand        { name, url }
 *   REVIEW_I18N.t(key)       translated string (with {brand} substituted)
 *   REVIEW_I18N.applyI18n()  swaps all [data-i18n]/[data-i18n-ph]/[data-i18n-aria]
 *
 * Team copy is deliberately nationality-neutral ("small team"), per brand.
 */
(function () {
  var params = new URLSearchParams(window.location.search);

  function resolveStore(raw) {
    var v = String(raw || '').trim().toLowerCase();
    if (v === 'pl' || v === 'kloniko' || v === '3') return 'pl';
    return 'ua';
  }
  function resolveLocale(store, raw) {
    var v = String(raw || '').trim().toLowerCase().split('-')[0];
    var allowed = store === 'pl' ? ['pl', 'en', 'uk'] : ['uk', 'en'];
    if (allowed.indexOf(v) !== -1) return v;
    return store === 'pl' ? 'pl' : 'uk';
  }

  var store = resolveStore(params.get('store'));
  var locale = resolveLocale(store, params.get('locale'));

  var BRANDS = {
    ua: { name: 'Bricktopia', url: 'https://bricktopia.store/' },
    pl: { name: 'Kloniko', url: 'https://kloniko.store/' }
  };
  var brand = BRANDS[store];

  // Dictionary. {brand} is replaced with the store's brand name at lookup.
  var DICT = {
    // --- common / buttons ---
    copy: { uk: 'Копіювати', pl: 'Kopiuj', en: 'Copy' },
    copied: { uk: 'Скопійовано ✓', pl: 'Skopiowano ✓', en: 'Copied ✓' },
    hide: { uk: 'Сховати', pl: 'Ukryj', en: 'Hide' },
    back: { uk: '← Назад', pl: '← Wstecz', en: '← Back' },
    back_change_rating: { uk: '← Змінити оцінку', pl: '← Zmień ocenę', en: '← Change rating' },
    next: { uk: 'Далі →', pl: 'Dalej →', en: 'Next →' },
    go_to_store: { uk: '🌐 Перейти до магазину', pl: '🌐 Przejdź do sklepu', en: '🌐 Go to the store' },
    site: { uk: '🌐 Сайт', pl: '🌐 Strona', en: '🌐 Website' },
    choose_rating: { uk: 'Оберіть оцінку', pl: 'Wybierz ocenę', en: 'Choose a rating' },
    remove: { uk: 'Видалити', pl: 'Usuń', en: 'Remove' },

    // --- star labels ---
    star1: { uk: 'Дуже погано 😞', pl: 'Bardzo źle 😞', en: 'Very bad 😞' },
    star2: { uk: 'Погано 😕', pl: 'Źle 😕', en: 'Bad 😕' },
    star3: { uk: 'Нормально 😐', pl: 'Może być 😐', en: 'Okay 😐' },
    star4: { uk: 'Добре 😊', pl: 'Dobrze 😊', en: 'Good 😊' },
    star5: { uk: 'Чудово! 🤩', pl: 'Świetnie! 🤩', en: 'Great! 🤩' },

    // --- promo bar ---
    promo_bar_label: { uk: '🎁 Ваш промокод', pl: '🎁 Twój kod rabatowy', en: '🎁 Your promo code' },

    // --- rating step ---
    rating_h1: { uk: 'Дякуємо за замовлення! 🧱', pl: 'Dziękujemy za zamówienie! 🧱', en: 'Thank you for your order! 🧱' },
    rating_h1_embed: { uk: 'Залиште відгук про {brand} 💛', pl: 'Zostaw opinię o {brand} 💛', en: 'Leave a review about {brand} 💛' },
    rating_subtitle: {
      uk: 'Ми — невелика команда, яка створює кожну фігурку з любов\'ю. Ваша оцінка дуже багато для нас значить і допомагає нам ставати кращими!',
      pl: 'Jesteśmy małym zespołem, który tworzy każdą figurkę z miłością. Twoja ocena wiele dla nas znaczy i pomaga nam być lepszymi!',
      en: 'We are a small team that makes every figure with love. Your rating means a lot to us and helps us get better!'
    },
    rating_subtitle_embed: {
      uk: 'Ми — невелика команда, яка створює фігурки з любов\'ю. Ваша думка дуже багато для нас значить і допомагає нам ставати кращими!',
      pl: 'Jesteśmy małym zespołem, który tworzy figurki z miłością. Twoja opinia wiele dla nas znaczy i pomaga nam być lepszymi!',
      en: 'We are a small team that makes figures with love. Your opinion means a lot to us and helps us get better!'
    },

    // --- negative flow ---
    neg_h2: { uk: 'Нам дуже шкода, що так вийшло', pl: 'Bardzo nam przykro, że tak wyszło', en: 'We\'re very sorry it turned out this way' },
    neg_h2_embed: { uk: 'Нам важливо почути вас', pl: 'Ważne jest dla nas Twoje zdanie', en: 'We really want to hear you' },
    neg_subtitle: {
      uk: 'Ваша думка дуже важлива для нас. Кастомні товари зазвичай не підлягають поверненню, але ми завжди намагаємось піти назустріч клієнтам і знайти рішення.',
      pl: 'Twoja opinia jest dla nas bardzo ważna. Produkty personalizowane zwykle nie podlegają zwrotowi, ale zawsze staramy się wyjść klientom naprzeciw i znaleźć rozwiązanie.',
      en: 'Your opinion is very important to us. Custom items usually aren\'t returnable, but we always try to meet our customers halfway and find a solution.'
    },
    neg_subtitle_embed: {
      uk: 'Ваша думка дуже важлива для нас. Розкажіть, що саме вам не сподобалось — ми обов\'язково розберемось.',
      pl: 'Twoja opinia jest dla nas bardzo ważna. Napisz, co dokładnie się nie spodobało — na pewno się tym zajmiemy.',
      en: 'Your opinion is very important to us. Tell us what exactly went wrong — we\'ll definitely look into it.'
    },
    neg_hint: {
      uk: 'Розкажіть, будь ласка, що саме пішло не так — і ми обов\'язково вирішимо ваше питання:',
      pl: 'Napisz proszę, co dokładnie poszło nie tak — na pewno rozwiążemy Twoją sprawę:',
      en: 'Please tell us what exactly went wrong — we\'ll make sure to resolve it:'
    },
    label_name: { uk: 'Ваше ім\'я', pl: 'Twoje imię', en: 'Your name' },
    ph_name: { uk: 'Ім\'я', pl: 'Imię', en: 'Name' },
    label_contact_phone: { uk: 'Телефон або Email', pl: 'Telefon lub Email', en: 'Phone or Email' },
    ph_contact_phone: { uk: '+380... або email', pl: '+48... lub email', en: '+48... or email' },
    // Email-only wording — used by stores without an SMS channel (Kloniko:
    // TurboSMS is Ukrainian and cannot deliver to +48). Asking for a phone we
    // can't write to only loses the promo code.
    label_contact_email: { uk: 'Email', pl: 'Email', en: 'Email' },
    ph_contact_email_only: { uk: 'email@example.com', pl: 'email@example.com', en: 'email@example.com' },
    contact_hint_email: {
      uk: 'Надішлемо промокод на цю пошту 💛',
      pl: 'Wyślemy kod rabatowy na ten adres 💛',
      en: "We'll send the promo code to this address 💛",
    },
    label_order_opt: { uk: 'Номер замовлення (якщо пам\'ятаєте)', pl: 'Numer zamówienia (jeśli pamiętasz)', en: 'Order number (if you remember)' },
    label_problem: { uk: 'Що саме не так?', pl: 'Co dokładnie jest nie tak?', en: 'What exactly is wrong?' },
    ph_problem: {
      uk: 'Опишіть проблему — ми розберемось і зв\'яжемось з вами',
      pl: 'Opisz problem — zajmiemy się tym i skontaktujemy się z Tobą',
      en: 'Describe the problem — we\'ll look into it and get back to you'
    },
    send: { uk: 'Відправити', pl: 'Wyślij', en: 'Send' },

    // --- positive flow ---
    pos_h2: { uk: 'Ви зробили наш день! 🥰', pl: 'Umiliłeś nam dzień! 🥰', en: 'You made our day! 🥰' },
    pos_subtitle: {
      uk: 'Кожен відгук — це величезна підтримка для нашої маленької команди. Ваш відгук з\'явиться на сайті поруч із товаром і допоможе іншим покупцям:',
      pl: 'Każda opinia to ogromne wsparcie dla naszego małego zespołu. Twoja opinia pojawi się na stronie obok produktu i pomoże innym kupującym:',
      en: 'Every review is huge support for our small team. Your review will appear on the site next to the product and help other buyers:'
    },
    pos_card_title: { uk: 'Залишити відгук на сайті', pl: 'Zostaw opinię na stronie', en: 'Leave a review on the site' },
    reward_promo: { uk: 'Отримаєте <strong>промокод на знижку</strong> на наступне замовлення', pl: 'Otrzymasz <strong>kod rabatowy</strong> na następne zamówienie', en: 'You\'ll get a <strong>discount code</strong> for your next order' },
    reward_media: { uk: 'Відгук з <strong>фото або відео</strong> — додатковий бонус 🔥', pl: 'Opinia ze <strong>zdjęciem lub filmem</strong> — dodatkowy bonus 🔥', en: 'A review with a <strong>photo or video</strong> — extra bonus 🔥' },
    btn_leave_review: { uk: '⭐ Залишити відгук', pl: '⭐ Zostaw opinię', en: '⭐ Leave a review' },

    // --- review multi-step ---
    review_h2: { uk: 'Залиште відгук', pl: 'Zostaw opinię', en: 'Leave a review' },
    step_x_of_4: { uk: 'Крок {n} з 4', pl: 'Krok {n} z 4', en: 'Step {n} of 4' },
    review_q_rating: { uk: 'Яка ваша оцінка товару?', pl: 'Jak oceniasz produkt?', en: 'How do you rate the product?' },
    review_q_text: { uk: 'Розкажіть про ваші враження', pl: 'Opowiedz o swoich wrażeniach', en: 'Tell us about your impressions' },
    ph_review_body: {
      uk: 'Що сподобалось? Як прийшла фігурка? Робили подарунок? Як відреагувала людина?',
      pl: 'Co się spodobało? Jak dotarła figurka? Był to prezent? Jak zareagowała obdarowana osoba?',
      en: 'What did you like? How did the figure arrive? Was it a gift? How did the person react?'
    },
    bonus_media_title: { uk: 'Додайте фото або відео!', pl: 'Dodaj zdjęcie lub film!', en: 'Add a photo or video!' },
    bonus_media_text: {
      uk: 'Ви дуже допоможете нам і іншим покупцям побачити реальний результат. Відгуки з медіа — найцінніші для нас 🙏',
      pl: 'Bardzo pomożesz nam i innym kupującym zobaczyć prawdziwy efekt. Opinie z mediami są dla nas najcenniejsze 🙏',
      en: 'You\'ll really help us and other buyers see the real result. Reviews with media are the most valuable to us 🙏'
    },
    file_upload_title: { uk: 'Додати фото або відео', pl: 'Dodaj zdjęcie lub film', en: 'Add a photo or video' },
    file_upload_hint: { uk: 'До 3 файлів, макс. 15 МБ кожен', pl: 'Do 3 plików, maks. 15 MB każdy', en: 'Up to 3 files, max 15 MB each' },
    review_q_contact: { uk: 'Куди надіслати ваш промокод?', pl: 'Gdzie wysłać Twój kod rabatowy?', en: 'Where should we send your promo code?' },
    label_name_req: { uk: 'Ваше ім\'я *', pl: 'Twoje imię *', en: 'Your name *' },
    ph_sign_review: { uk: 'Як підписати відгук', pl: 'Jak podpisać opinię', en: 'How to sign the review' },
    label_contact_optional: { uk: 'Email або телефон', pl: 'Email lub telefon', en: 'Email or phone' },
    optional_suffix: { uk: '— не обов\'язково', pl: '— opcjonalnie', en: '— optional' },
    ph_contact_email: { uk: 'email@example.com або +380...', pl: 'email@example.com lub +48...', en: 'email@example.com or +48...' },
    contact_hint: { uk: 'Якщо залишите — надішлемо промокод туди 💛', pl: 'Jeśli podasz — wyślemy tam kod rabatowy 💛', en: 'If you leave it — we\'ll send the promo code there 💛' },
    label_what_ordered: { uk: 'Що ви замовляли?', pl: 'Co zamawiałeś?', en: 'What did you order?' },
    opt_choose: { uk: '— Оберіть —', pl: '— Wybierz —', en: '— Choose —' },
    opt_frame: { uk: 'Фігурки в рамці', pl: 'Figurki w ramce', en: 'Figures in a frame' },
    opt_keychain: { uk: 'Фігурки на брелку або без', pl: 'Figurki na breloku lub bez', en: 'Figures on a keychain or without' },
    opt_pet: { uk: 'Фігурка-звірятко', pl: 'Figurka-zwierzątko', en: 'Animal figure' },
    opt_other: { uk: 'Інше', pl: 'Inne', en: 'Other' },
    btn_send_review: { uk: '⭐ Надіслати відгук', pl: '⭐ Wyślij opinię', en: '⭐ Submit review' },

    // --- success: review ---
    success_review_h2: { uk: 'Дякуємо за відгук!', pl: 'Dziękujemy za opinię!', en: 'Thank you for your review!' },
    success_review_subtitle: {
      uk: 'Ви неймовірно круті 💛 Тримайте ваш подарунок — промокод на знижку на наступне замовлення:',
      pl: 'Jesteś niesamowity 💛 Oto Twój prezent — kod rabatowy na następne zamówienie:',
      en: 'You\'re amazing 💛 Here\'s your gift — a discount code for your next order:'
    },
    promo_card_label: { uk: 'Ваш промокод', pl: 'Twój kod rabatowy', en: 'Your promo code' },
    promo_card_hint_pre: { uk: 'Діє', pl: 'Ważny', en: 'Valid for' },
    promo_card_hint_dur: { uk: '1 місяць', pl: '1 miesiąc', en: '1 month' },
    promo_card_hint_post: { uk: ', одноразовий. Застосовуй на', pl: ', jednorazowy. Użyj na', en: ', single-use. Apply at' },
    optin_title: { uk: 'Хочете бути в курсі?', pl: 'Chcesz być na bieżąco?', en: 'Want to stay in the loop?' },
    optin_text: {
      uk: 'Ми пишемо <strong>дуже рідко</strong> — тільки коли готуємо щось справді круте (новий дроп фігурок, обмежені колекції) або запускаємо гарну знижку. Жодного спаму 🙏',
      pl: 'Piszemy <strong>bardzo rzadko</strong> — tylko gdy szykujemy coś naprawdę fajnego (nowy drop figurek, limitowane kolekcje) albo dobrą promocję. Żadnego spamu 🙏',
      en: 'We write <strong>very rarely</strong> — only when we\'re preparing something truly cool (a new figure drop, limited collections) or a good discount. No spam 🙏'
    },
    optin_consent: { uk: 'Так, хочу отримувати новини про запуски та знижки', pl: 'Tak, chcę otrzymywać nowości o premierach i promocjach', en: 'Yes, I want to get news about launches and discounts' },
    subscribe: { uk: 'Підписатись', pl: 'Zapisz się', en: 'Subscribe' },
    optin_done: { uk: '✅ Підписано, дякуємо! Скоро надішлемо щось цікаве 💛', pl: '✅ Zapisano, dziękujemy! Wkrótce wyślemy coś ciekawego 💛', en: '✅ Subscribed, thank you! We\'ll send something interesting soon 💛' },
    survey_offer_title: { uk: 'Ще маєте 2 хвилини?', pl: 'Masz jeszcze 2 minuty?', en: 'Got 2 more minutes?' },
    survey_offer_desc: { uk: 'Пройдіть коротке опитування — і ми <strong>збільшимо ваш промокод до 10%</strong> 🚀', pl: 'Wypełnij krótką ankietę — a my <strong>zwiększymy Twój kod rabatowy do 10%</strong> 🚀', en: 'Take a short survey — and we\'ll <strong>bump your promo code to 10%</strong> 🚀' },
    btn_improve_promo: { uk: '🎁 Покращити промокод', pl: '🎁 Ulepsz kod rabatowy', en: '🎁 Improve the promo code' },
    promo_upgraded_badge: { uk: '✅ Ваш промокод вже 10% — дякуємо за опитування!', pl: '✅ Twój kod rabatowy to już 10% — dziękujemy za ankietę!', en: '✅ Your promo code is now 10% — thanks for the survey!' },

    // --- survey ---
    survey_h2: { uk: 'Опитування', pl: 'Ankieta', en: 'Survey' },
    survey_subtitle: { uk: 'За проходження опитування ми <strong>збільшимо ваш промокод до 10%</strong> 🎁', pl: 'Za wypełnienie ankiety <strong>zwiększymy Twój kod rabatowy do 10%</strong> 🎁', en: 'For completing the survey we\'ll <strong>bump your promo code to 10%</strong> 🎁' },
    step_x_of_6: { uk: 'Крок {n} з 6', pl: 'Krok {n} z 6', en: 'Step {n} of 6' },
    q_source: { uk: 'Як ви дізнались про {brand}?', pl: 'Skąd dowiedziałeś się o {brand}?', en: 'How did you hear about {brand}?' },
    src_google: { uk: 'Google пошук', pl: 'Wyszukiwarka Google', en: 'Google search' },
    src_friend: { uk: 'Порада друзів', pl: 'Polecenie znajomych', en: 'Friends\' recommendation' },
    src_ad: { uk: 'Реклама блогера', pl: 'Reklama u blogera', en: 'Blogger ad' },
    ph_source_other: { uk: 'Розкажіть де саме...', pl: 'Napisz gdzie dokładnie...', en: 'Tell us where exactly...' },
    q_gift_for: { uk: 'Для кого було замовлення?', pl: 'Dla kogo było zamówienie?', en: 'Who was the order for?' },
    gf_self: { uk: 'Для себе', pl: 'Dla siebie', en: 'For myself' },
    gf_child: { uk: 'Для дитини', pl: 'Dla dziecka', en: 'For a child' },
    gf_gift: { uk: 'В подарунок', pl: 'Na prezent', en: 'As a gift' },
    gf_couple: { uk: 'Для пари', pl: 'Dla pary', en: 'For a couple' },
    gf_parent: { uk: 'Для батьків', pl: 'Dla rodziców', en: 'For parents' },
    ph_gift_other: { uk: 'Кому саме?', pl: 'Dla kogo dokładnie?', en: 'For whom exactly?' },
    q_quality: { uk: 'Як вам якість фігурки?', pl: 'Jak oceniasz jakość figurki?', en: 'How\'s the quality of the figure?' },
    ql_excellent: { uk: 'Чудова!', pl: 'Świetna!', en: 'Excellent!' },
    ql_good: { uk: 'Добра', pl: 'Dobra', en: 'Good' },
    ql_ok: { uk: 'Нормальна', pl: 'W porządku', en: 'Okay' },
    ql_bad: { uk: 'Не сподобалась', pl: 'Nie podobała się', en: 'Didn\'t like it' },
    q_likeness: { uk: 'Наскільки фігурка схожа на фото?', pl: 'Jak bardzo figurka przypomina zdjęcie?', en: 'How much does the figure resemble the photo?' },
    lk_perfect: { uk: 'Один в один!', pl: 'Jak dwie krople wody!', en: 'Spot on!' },
    lk_good: { uk: 'Дуже схоже', pl: 'Bardzo podobnie', en: 'Very similar' },
    lk_ok: { uk: 'Більш-менш', pl: 'Mniej więcej', en: 'More or less' },
    lk_bad: { uk: 'Не схоже', pl: 'Niepodobne', en: 'Not similar' },
    q_packaging: { uk: 'Як вам пакування?', pl: 'Jak oceniasz opakowanie?', en: 'How\'s the packaging?' },
    pk_excellent: { uk: 'Супер!', pl: 'Super!', en: 'Super!' },
    pk_good: { uk: 'Добре', pl: 'Dobre', en: 'Good' },
    pk_ok: { uk: 'Нормальне', pl: 'W porządku', en: 'Okay' },
    pk_bad: { uk: 'Погане', pl: 'Słabe', en: 'Poor' },
    ph_packaging_other: { uk: 'Що б ви змінили у пакуванні?', pl: 'Co zmieniłbyś w opakowaniu?', en: 'What would you change about the packaging?' },
    q_delivery: { uk: 'Наскільки швидко ви отримали замовлення?', pl: 'Jak szybko otrzymałeś zamówienie?', en: 'How fast did you receive your order?' },
    dl_fast: { uk: 'Дуже швидко', pl: 'Bardzo szybko', en: 'Very fast' },
    dl_normal: { uk: 'Нормально', pl: 'W porządku', en: 'Okay' },
    dl_slow: { uk: 'Довго чекав(ла)', pl: 'Długo czekałem', en: 'Waited a long time' },
    ph_describe: { uk: 'Опишіть...', pl: 'Opisz...', en: 'Describe...' },
    q_constructor: { uk: 'Чи зручно було користуватись конструктором?', pl: 'Czy kreator był wygodny w użyciu?', en: 'Was the builder convenient to use?' },
    cc_very_easy: { uk: 'Дуже зручно 👌', pl: 'Bardzo wygodny 👌', en: 'Very convenient 👌' },
    cc_ok: { uk: 'Нормально', pl: 'W porządku', en: 'Okay' },
    cc_hard: { uk: 'Було складно', pl: 'Było trudno', en: 'It was hard' },
    cc_didnt: { uk: 'Не користувався', pl: 'Nie korzystałem', en: 'Didn\'t use it' },
    q_parts_found: { uk: 'Чи знайшли ви в конструкторі всі деталі, які хотіли?', pl: 'Czy znalazłeś w kreatorze wszystkie części, których chciałeś?', en: 'Did you find all the parts you wanted in the builder?' },
    pf_yes: { uk: 'Так, все було', pl: 'Tak, wszystko było', en: 'Yes, everything was there' },
    pf_mostly: { uk: 'Здебільшого так', pl: 'Przeważnie tak', en: 'Mostly yes' },
    pf_no: { uk: 'Ні, не вистачило', pl: 'Nie, brakowało', en: 'No, something was missing' },
    q_constructor_change: { uk: 'Що б ви змінили або покращили в конструкторі?', pl: 'Co zmieniłbyś lub ulepszył w kreatorze?', en: 'What would you change or improve in the builder?' },
    ph_constructor_change: { uk: 'Напр. розділи, пошук, категорії...', pl: 'Np. sekcje, wyszukiwanie, kategorie...', en: 'E.g. sections, search, categories...' },
    q_website: { uk: 'Наскільки зручний наш сайт в цілому?', pl: 'Jak wygodna jest ogólnie nasza strona?', en: 'How convenient is our site overall?' },
    wc_excellent: { uk: 'Дуже зручний', pl: 'Bardzo wygodna', en: 'Very convenient' },
    wc_good: { uk: 'Добрий', pl: 'Dobra', en: 'Good' },
    wc_ok: { uk: 'Нормальний', pl: 'W porządku', en: 'Okay' },
    wc_bad: { uk: 'Важко користуватись', pl: 'Trudna w obsłudze', en: 'Hard to use' },
    q_parts_missing: { uk: 'Яких деталей нам не вистачає в конструкторі?', pl: 'Jakich części brakuje w kreatorze?', en: 'Which parts are missing in the builder?' },
    ph_parts_missing: { uk: 'Напр. окуляри-авіатори, кашкети, шарфи...', pl: 'Np. okulary aviatory, czapki, szaliki...', en: 'E.g. aviator glasses, caps, scarves...' },
    q_accessories: { uk: 'Які аксесуари ви б хотіли бачити в магазині?', pl: 'Jakie akcesoria chciałbyś widzieć w sklepie?', en: 'What accessories would you like to see in the store?' },
    ph_accessories: { uk: 'Підставки, брелоки, кулони, рамки...', pl: 'Podstawki, breloki, wisiorki, ramki...', en: 'Stands, keychains, pendants, frames...' },
    q_reorder: { uk: 'Чи замовляли б ви у нас знову?', pl: 'Czy zamówiłbyś u nas ponownie?', en: 'Would you order from us again?' },
    ro_yes: { uk: 'Так, обов\'язково!', pl: 'Tak, na pewno!', en: 'Yes, definitely!' },
    ro_maybe: { uk: 'Можливо', pl: 'Może', en: 'Maybe' },
    ro_no: { uk: 'Скоріше ні', pl: 'Raczej nie', en: 'Probably not' },
    q_recommend: { uk: 'Чи порекомендуєте нас друзям?', pl: 'Czy polecisz nas znajomym?', en: 'Would you recommend us to friends?' },
    rc_yes: { uk: 'Так, вже раджу!', pl: 'Tak, już polecam!', en: 'Yes, already do!' },
    rc_maybe: { uk: 'Можливо', pl: 'Może', en: 'Maybe' },
    rc_no: { uk: 'Ні', pl: 'Nie', en: 'No' },
    q_improve: { uk: 'Що ще ми можемо покращити?', pl: 'Co jeszcze możemy poprawić?', en: 'What else can we improve?' },
    ph_improve: { uk: 'Будь-які інші побажання та ідеї...', pl: 'Wszelkie inne życzenia i pomysły...', en: 'Any other wishes and ideas...' },
    q_wishlist: { uk: 'Які нові товари ви хотіли б бачити?', pl: 'Jakie nowe produkty chciałbyś zobaczyć?', en: 'What new products would you like to see?' },
    ph_wishlist: { uk: 'Фігурки, набори...', pl: 'Figurki, zestawy...', en: 'Figures, sets...' },
    btn_improve_to_10: { uk: '🎁 Покращити промокод до 10%', pl: '🎁 Ulepsz kod rabatowy do 10%', en: '🎁 Improve the promo code to 10%' },

    // --- success: negative / survey ---
    success_neg_h2: { uk: 'Дякуємо!', pl: 'Dziękujemy!', en: 'Thank you!' },
    success_neg_subtitle: {
      uk: 'Ми отримали ваше звернення і обов\'язково зв\'яжемось з вами найближчим часом. Ваш досвід важливий для нас — ми зробимо все, щоб все виправити!',
      pl: 'Otrzymaliśmy Twoje zgłoszenie i na pewno wkrótce się z Tobą skontaktujemy. Twoje doświadczenie jest dla nas ważne — zrobimy wszystko, aby to naprawić!',
      en: 'We\'ve received your message and will contact you soon. Your experience matters to us — we\'ll do everything to make it right!'
    },
    success_survey_h2: { uk: 'Промокод покращено!', pl: 'Kod rabatowy ulepszony!', en: 'Promo code upgraded!' },
    success_survey_subtitle: {
      uk: 'Дякуємо за відповіді 💛 Ваш промокод тепер <strong>10%</strong> — зберегли й оновили його для вас:',
      pl: 'Dziękujemy za odpowiedzi 💛 Twój kod rabatowy to teraz <strong>10%</strong> — zapisaliśmy i zaktualizowaliśmy go dla Ciebie:',
      en: 'Thanks for your answers 💛 Your promo code is now <strong>10%</strong> — we\'ve saved and updated it for you:'
    },

    // --- footer ---
    footer_hours: { uk: 'Пн-Нд 9-19', pl: 'Pn-Nd 9-19', en: 'Mon-Sun 9-19' },
    footer_legal: {
      uk: 'Це не продукт LEGO®. LEGO® є торговою маркою LEGO Group, яка не спонсорує, не дозволяє та не схвалює цей продукт.',
      pl: 'To nie jest produkt LEGO®. LEGO® jest znakiem towarowym LEGO Group, która nie sponsoruje, nie autoryzuje ani nie zatwierdza tego produktu.',
      en: 'This is not a LEGO® product. LEGO® is a trademark of the LEGO Group, which does not sponsor, authorize or endorse this product.'
    },

    // --- toasts / validation ---
    err_valid_email: { uk: 'Введіть коректний Email', pl: 'Podaj poprawny Email', en: 'Enter a valid email' },
    err_network: { uk: 'Помилка мережі. Спробуйте ще раз.', pl: 'Błąd sieci. Spróbuj ponownie.', en: 'Network error. Please try again.' },
    err_unknown: { uk: 'невідома помилка', pl: 'nieznany błąd', en: 'unknown error' },
    err_send: { uk: 'Помилка відправки: ', pl: 'Błąd wysyłania: ', en: 'Submit error: ' },
    wait_upload: { uk: 'Зачекайте поки завантажаться файли', pl: 'Poczekaj aż pliki się wgrają', en: 'Please wait for the files to upload' },
    uploading: { uk: 'Завантаження...', pl: 'Wgrywanie...', en: 'Uploading...' },
    err_upload_file: { uk: 'Не вдалось завантажити файл: ', pl: 'Nie udało się wgrać pliku: ', en: 'Failed to upload the file: ' },
    err_subscribe: { uk: 'Не вдалось підписати: ', pl: 'Nie udało się zapisać: ', en: 'Failed to subscribe: ' },
    err_subscribe_later: {
      uk: 'Зараз не можемо підписати — спробуйте пізніше. Промокод вже у вас, нічого не загубилось.',
      pl: 'Teraz nie możemy Cię zapisać — spróbuj później. Kod rabatowy już masz, nic nie przepadło.',
      en: 'We can\'t subscribe you right now — try again later. You already have your promo code, nothing is lost.'
    },
    // --- form validation ---
    err_contact_invalid: {
      uk: 'Введіть коректний Email або телефон (або залиште поле порожнім)',
      pl: 'Podaj poprawny Email lub telefon (albo zostaw pole puste)',
      en: 'Enter a valid email or phone (or leave the field empty)'
    },
    err_name_required: { uk: 'Вкажіть ваше ім\'я', pl: 'Podaj swoje imię', en: 'Enter your name' },
    err_name_short: { uk: 'Ім\'я занадто коротке', pl: 'Imię jest za krótkie', en: 'Name is too short' },
    err_name_long: { uk: 'Ім\'я занадто довге', pl: 'Imię jest za długie', en: 'Name is too long' },
    err_name_garbage: { uk: 'Ім\'я виглядає як випадковий набір символів', pl: 'Imię wygląda na przypadkowy ciąg znaków', en: 'The name looks like random characters' },
    err_text_long: { uk: 'Занадто довгий текст (максимум {n} символів)', pl: 'Tekst jest za długi (maksymalnie {n} znaków)', en: 'Text is too long (max {n} characters)' },
    err_body_required: { uk: 'Напишіть текст відгуку', pl: 'Napisz treść opinii', en: 'Please write your review' },
    err_body_short: { uk: 'Відгук занадто короткий (мінімум 5 символів)', pl: 'Opinia jest za krótka (minimum 5 znaków)', en: 'The review is too short (min 5 characters)' },
    err_body_garbage: { uk: 'Відгук виглядає як випадковий набір символів', pl: 'Opinia wygląda na przypadkowy ciąg znaków', en: 'The review looks like random characters' },
    err_body_digits: { uk: 'Відгук має містити текст, а не лише цифри', pl: 'Opinia musi zawierać tekst, a nie tylko cyfry', en: 'The review must contain text, not just numbers' },
    err_no_links: { uk: 'Посилання не дозволені', pl: 'Linki są niedozwolone', en: 'Links are not allowed' },
    err_bad_content: { uk: 'Некоректний вміст', pl: 'Nieprawidłowa treść', en: 'Invalid content' },
    err_no_html: { uk: 'HTML-теги не дозволені', pl: 'Tagi HTML są niedozwolone', en: 'HTML tags are not allowed' },
    err_max_files: { uk: 'Максимум {n} файлів', pl: 'Maksymalnie {n} plików', en: 'Maximum {n} files' },
    err_file_big: { uk: 'Файл "{name}" завеликий ({size}). Макс. {max}.', pl: 'Plik "{name}" jest za duży ({size}). Maks. {max}.', en: 'File "{name}" is too large ({size}). Max {max}.' },
    err_fill_negative: { uk: 'Будь ласка, заповніть ім\'я, контакт та опис проблеми', pl: 'Uzupełnij proszę imię, kontakt i opis problemu', en: 'Please fill in your name, contact and a description of the problem' },
    err_field_label: { uk: 'Поле "{label}": {err}', pl: 'Pole "{label}": {err}', en: 'Field "{label}": {err}' },
    telegram_fallback: {
      uk: '\n\nЯкщо помилка повторюється — напишіть нам у Telegram, ми вручну зробимо знижку 10%.',
      pl: '\n\nJeśli błąd się powtarza — napisz do nas na Telegramie, ręcznie zrobimy zniżkę 10%.',
      en: '\n\nIf the error persists — message us on Telegram and we\'ll apply the 10% discount manually.'
    }
  };

  function t(key, vars) {
    var entry = DICT[key];
    var s = entry ? (entry[locale] || entry.uk || key) : key;
    s = s.replace(/\{brand\}/g, brand.name);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return s;
  }

  function applyI18n(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (DICT[key]) el.innerHTML = t(key);
    });
    root.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-ph');
      if (DICT[key]) el.setAttribute('placeholder', t(key));
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (DICT[key]) el.setAttribute('aria-label', t(key));
    });
    // Brand-driven bits
    root.querySelectorAll('[data-brand-name]').forEach(function (el) { el.textContent = brand.name; });
    root.querySelectorAll('[data-brand-href]').forEach(function (el) { el.setAttribute('href', brand.url); });
    // Bare domain text (e.g. "kloniko.store") for the promo-hint links.
    var domain = brand.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    root.querySelectorAll('[data-brand-domain]').forEach(function (el) { el.textContent = domain; });
    document.documentElement.setAttribute('lang', locale);
  }

  // Which contact channels this store can actually use. SMS goes through
  // TurboSMS (Ukrainian provider, +380 only), so Kloniko is email-only.
  var emailOnly = store === 'pl';

  window.REVIEW_I18N = {
    locale: locale,
    store: store,
    emailOnly: emailOnly,
    brand: brand,
    t: t,
    applyI18n: applyI18n
  };
})();
