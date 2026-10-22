(() => {
  'use strict';

  const TOTAL_ITEMS = 3;
  const ITEM_NAMES = {
    paint: 'Краски Lavelly Gamma',
    chair: 'Стул «Фирес»',
    level: 'Уровень Bolt',
  };
  const ITEM_ICONS = {
    paint: 'assets/item-paint.png',
    chair: 'assets/item-chair.png',
    level: 'assets/item-level.png',
  };

  const found = new Set();

  const gameScreen = document.getElementById('gameScreen');
  const meterFill = document.getElementById('meterFill');
  const meterCat = document.getElementById('meterCat');
  const popup = document.getElementById('foundPopup');
  const popupImg = document.getElementById('foundPopupImg');
  const popupName = document.getElementById('foundPopupName');
  const startBtn = document.getElementById('startGameBtn');
  const scrollHintBtn = document.getElementById('scrollHintBtn');
  const introSection = document.querySelector('.intro');
  const soundBtn = document.getElementById('soundBtn');
  const itemListBtn = document.getElementById('itemListBtn');
  const helpModal = document.getElementById('helpModal');
  const helpBackdrop = document.getElementById('helpBackdrop');
  const helpCloseBtn = document.getElementById('helpCloseBtn');
  const formScreen = document.getElementById('formScreen');
  const introModal = document.getElementById('introModal');
  const introStep1 = document.getElementById('introStep1');
  const introStep2 = document.getElementById('introStep2');
  const introNextBtn = document.getElementById('introNextBtn');
  const introSearchBtn = document.getElementById('introSearchBtn');
  const gameField = document.getElementById('gameMapScroll');
  const gameFieldInner = document.getElementById('gameFieldInner');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const bonusModal = document.getElementById('bonusModal');
  const claimBonusBtn = document.getElementById('claimBonusBtn');
  const screens = document.querySelectorAll('.screen');

  let briefingDone = false;
  let popupTimer = null;

  function showScreen(screen) {
    screens.forEach((screenElement) => {
      screenElement.classList.toggle('screen-active', screenElement === screen);
    });
    window.scrollTo(0, 0);
  }

  function openIntroModal() {
    if (briefingDone || found.size > 0) return;
    introModal.hidden = false;
    introStep1.hidden = false;
    introStep2.hidden = true;
  }

  const ZOOM_MIN = 1;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = 0.5;
  const isMobileMap = window.matchMedia('(max-width: 900px)');
  let zoomLevel = ZOOM_MIN;

  function setZoom(nextZoom) {
    const oldZoom = zoomLevel;
    zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextZoom));
    if (zoomLevel === oldZoom) return;

    gameField.classList.toggle('is-zoomed', zoomLevel > ZOOM_MIN);

    const rect = gameField.getBoundingClientRect();
    const px = rect.width / 2;
    const py = rect.height / 2;
    const contentX = (gameField.scrollLeft + px) / oldZoom;
    const contentY = (gameField.scrollTop + py) / oldZoom;

    if (isMobileMap.matches) {
      gameFieldInner.style.width = (zoomLevel * 139.61) + 'svh';
      gameFieldInner.style.height = (zoomLevel * 100) + 'svh';
    } else {
      gameFieldInner.style.width = (zoomLevel * 100) + '%';
      gameFieldInner.style.height = (zoomLevel * 100) + '%';
    }
    gameField.scrollLeft = contentX * zoomLevel - px;
    gameField.scrollTop = contentY * zoomLevel - py;

    zoomInBtn.disabled = zoomLevel >= ZOOM_MAX;
    zoomOutBtn.disabled = zoomLevel <= ZOOM_MIN;
  }

  zoomInBtn.addEventListener('click', () => setZoom(zoomLevel + ZOOM_STEP));
  zoomOutBtn.addEventListener('click', () => setZoom(zoomLevel - ZOOM_STEP));

  let isPanning = false;
  let panMoved = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartScrollLeft = 0;
  let panStartScrollTop = 0;

  gameField.addEventListener('pointerdown', (e) => {
    if (!gameField.classList.contains('is-zoomed') || e.target.closest('.hotspot')) return;
    isPanning = true;
    panMoved = false;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartScrollLeft = gameField.scrollLeft;
    panStartScrollTop = gameField.scrollTop;
    gameField.classList.add('is-dragging');
  });

  document.addEventListener('pointermove', (e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) panMoved = true;
    gameField.scrollLeft = panStartScrollLeft - dx;
    gameField.scrollTop = panStartScrollTop - dy;
  });

  function endPan() {
    if (!isPanning) return;
    isPanning = false;
    gameField.classList.remove('is-dragging');
  }
  document.addEventListener('pointerup', endPan);
  document.addEventListener('pointercancel', endPan);

  gameField.addEventListener('click', (e) => {
    if (panMoved) {
      e.stopPropagation();
      e.preventDefault();
      panMoved = false;
    }
  }, true);

  startBtn.addEventListener('click', () => {
    gameScreen.classList.add('is-started');
    showScreen(gameScreen);
    openIntroModal();
  });

  introNextBtn.addEventListener('click', () => {
    introStep1.hidden = true;
    introStep2.hidden = false;
  });

  introSearchBtn.addEventListener('click', () => {
    briefingDone = true;
    introModal.hidden = true;
    mapIntroObserver.disconnect();
  });

  const mapIntroObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) openIntroModal();
  }, { threshold: 0.35 });
  mapIntroObserver.observe(gameScreen);

  scrollHintBtn.addEventListener('click', () => {
    showScreen(introSection);
  });

  itemListBtn.addEventListener('click', () => { helpModal.hidden = false; });
  helpCloseBtn.addEventListener('click', () => { helpModal.hidden = true; });
  helpBackdrop.addEventListener('click', () => { helpModal.hidden = true; });

  let soundOn = true;
  const soundWaves = document.getElementById('soundWaves');
  const soundMuteX = document.getElementById('soundMuteX');
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundWaves.style.display = soundOn ? '' : 'none';
    soundMuteX.style.display = soundOn ? 'none' : '';
    soundBtn.setAttribute('aria-label', soundOn ? 'Звук' : 'Звук выключен');
    soundBtn.setAttribute('aria-pressed', String(soundOn));
  });

  function updateMeter() {
    const pct = (found.size / TOTAL_ITEMS) * 100;
    meterFill.style.width = pct + '%';
    meterCat.style.left = pct + '%';
  }

  function showPopup(itemKey) {
    popupImg.src = ITEM_ICONS[itemKey];
    popupImg.alt = ITEM_NAMES[itemKey];
    popupName.textContent = ITEM_NAMES[itemKey];
    popup.classList.add('show');
    clearTimeout(popupTimer);
    popupTimer = setTimeout(() => popup.classList.remove('show'), 3000);
  }

  function revealTray(itemKey) {
    const trayItem = document.querySelector(`.tray-item[data-item="${itemKey}"]`);
    if (trayItem) trayItem.classList.add('revealed');
  }

  function onHotspotClick(e) {
    const btn = e.currentTarget;
    const itemKey = btn.dataset.item;
    if (!briefingDone) {
      openIntroModal();
      return;
    }
    if (found.has(itemKey)) return;

    found.add(itemKey);
    btn.classList.add('found');
    revealTray(itemKey);
    showPopup(itemKey);
    updateMeter();

    if (found.size === TOTAL_ITEMS) {
      document.querySelector('.form-screen__submit').disabled = false;
      setTimeout(() => {
        bonusModal.hidden = false;
      }, 1600);
    }
  }

  claimBonusBtn.addEventListener('click', () => {
    bonusModal.hidden = true;
    showScreen(formScreen);
  });

  document.querySelectorAll('.hotspot').forEach((btn) => {
    btn.addEventListener('click', onHotspotClick);
  });

  const form = document.getElementById('contactForm');
  const formFields = document.getElementById('formFields');
  const formSubmitModal = document.getElementById('formSubmitModal');
  const formLoading = document.getElementById('formLoading');
  const formResult = document.getElementById('formResult');
  const formResultIcon = document.getElementById('formResultIcon');
  const formResultTitle = document.getElementById('formResultTitle');
  const formResultText = document.getElementById('formResultText');
  const finishGameBtn = document.getElementById('finishGameBtn');
  const formCompleted = document.getElementById('formCompleted');
  const formSubmitBtn = form.querySelector('.form-screen__submit');
  const fName = document.getElementById('fName');
  const fPhone = document.getElementById('fPhone');
  const fieldName = document.getElementById('fieldName');
  const fieldPhone = document.getElementById('fieldPhone');

  const PHONE_RE = /^\+?\d[\d\s()-]{9,}$/;
  const SUBMIT_DELAY = 3000;
  let submissionCompleted = false;

  function validateField(fieldEl, inputEl, isValid) {
    fieldEl.classList.remove('is-invalid', 'is-valid');
    if (inputEl.value.trim() === '') {
      if (inputEl.required) fieldEl.classList.add('is-invalid');
      return !inputEl.required;
    }
    fieldEl.classList.add(isValid ? 'is-valid' : 'is-invalid');
    return isValid;
  }

  fName.addEventListener('blur', () => {
    validateField(fieldName, fName, fName.value.trim().length > 1);
  });
  fPhone.addEventListener('blur', () => {
    validateField(fieldPhone, fPhone, PHONE_RE.test(fPhone.value.trim()));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (found.size !== TOTAL_ITEMS) return;

    const nameOk = validateField(fieldName, fName, fName.value.trim().length > 1);
    const phoneOk = validateField(fieldPhone, fPhone, PHONE_RE.test(fPhone.value.trim()));

    if (!nameOk || !phoneOk) return;

    formFields.hidden = true;
    formSubmitModal.hidden = true;
    formLoading.hidden = false;
    formResult.hidden = true;
    form.classList.add('is-loading');
    formSubmitBtn.disabled = true;
    formSubmitBtn.querySelector('.form-screen__submit-label').textContent = 'Отправка';
    setTimeout(() => {
      form.classList.remove('is-loading');
      showFormResult(submissionCompleted ? 'already-received' : 'success');
      submissionCompleted = true;
    }, SUBMIT_DELAY);
  });

  function showFormResult(result) {
    const resultStates = {
      success: {
        icon: '✓',
        title: 'Ваши бонусы<br>скоро будут начислены',
        text: '',
        className: 'is-success',
      },
      'already-received': {
        icon: '!',
        title: 'Вы уже получили<br>свои бонусы',
        text: '',
        className: 'is-already-received',
      },
      error: {
        icon: '×',
        title: 'Что-то пошло не так',
        text: 'Попробуйте отправить форму еще раз.',
        className: 'is-error',
      },
    };
    const state = resultStates[result] || resultStates.error;
    formLoading.hidden = true;
    formSubmitModal.hidden = false;
    formResult.hidden = false;
    formResult.className = `form-screen__state form-screen__result ${state.className}`;
    formResultIcon.textContent = state.icon;
    formResultTitle.innerHTML = state.title;
    formResultText.textContent = state.text;
  }

  finishGameBtn.addEventListener('click', () => {
    formSubmitModal.hidden = true;
    formScreen.classList.add('is-completed');
    formCompleted.hidden = false;
  });
})();
