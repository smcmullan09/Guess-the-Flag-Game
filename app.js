(() => {
  'use strict';
  const { countries, regions } = FlagData;
  const { Quiz, formatTime } = FlagEngine;
  const $ = id => document.getElementById(id);
  const samples = { World: ['jp','br','gb'], Africa: ['za','ke','ng'], Asia: ['jp','in','kr'], Europe: ['fr','it','gb'], 'North America': ['us','mx','ca'], 'South America': ['br','ar','cl'], Oceania: ['au','fj','nz'] };
  const notes = { World: 'The ultimate geography challenge.', Africa: 'Explore', Asia: 'Discover', Europe: 'Explore', 'North America': 'Discover', 'South America': 'Explore', Oceania: 'Discover' };
  let quiz = null;
  let region = 'World';
  let feedbackTimeout;
  let clockInterval;
  let loading = false;
  const imageCache = new Map();
  const bestKey = name => `smm-flag-quiz:v1:best:${name}`;
  function getBest(name) {
    try { const value = Number(localStorage.getItem(bestKey(name))); return Number.isFinite(value) && value > 0 ? value : null; }
    catch { return null; }
  }
  function buildRegions() {
    $('region-grid').replaceChildren();
    for (const name of regions) {
      const total = name === 'World' ? countries.length : countries.filter(c => c.region === name).length;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `region-card${name === 'World' ? ' world' : ''}`;
      button.setAttribute('aria-label', `${name}, ${total} countries. Start quiz`);
      button.innerHTML = `<div class="card-heading"><div><h3>${name}</h3><span class="card-count">${total} countries</span></div><span class="card-arrow" aria-hidden="true">↗</span></div><span class="card-note">${notes[name]}</span><div class="card-flags" aria-hidden="true">${samples[name].map(code => `<img src="assets/flags/${code}.svg" alt="" loading="lazy">`).join('')}</div>`;
      const best = getBest(name);
      if (best) { const label = document.createElement('span'); label.className = 'card-best'; label.textContent = `Best ${formatTime(best)}`; button.append(label); }
      button.addEventListener('click', () => start(name));
      $('region-grid').append(button);
    }
  }
  function showScreen(name) {
    for (const id of ['setup','game','complete']) $(`${id}-screen`).hidden = id !== name;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function preload(country) {
    if (imageCache.has(country.code)) return imageCache.get(country.code);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => { imageCache.delete(country.code); reject(new Error('Flag image unavailable')); };
      image.src = `assets/flags/${country.code}.svg`;
    });
    imageCache.set(country.code, promise);
    return promise;
  }
  async function start(name) {
    if (loading) return;
    loading = true;
    clearTimeout(feedbackTimeout);
    clearInterval(clockInterval);
    region = name;
    const selected = countries.filter(c => name === 'World' || c.region === name);
    document.querySelectorAll('.region-card, #play-again').forEach(button => { button.disabled = true; });
    $('loading-status').textContent = 'Getting your flags ready…';
    try {
      // Cache every image before the stopwatch starts, so slow image loads never
      // cost a player time, and every in-game transition is immediate.
      await Promise.all(selected.map(preload));
      $('game-region').textContent = name;
      const best = getBest(name);
      $('game-best').textContent = best ? `Personal best ${formatTime(best)}` : 'Your next personal best starts here';
      $('total-count').textContent = selected.length;
      $('progress-track').setAttribute('aria-valuemax', selected.length);
      $('answer').value = '';
      $('answer').readOnly = false;
      $('skip-button').disabled = false;
      $('feedback').className = 'feedback';
      $('feedback').textContent = 'You know this one. Start typing.';
      showScreen('game');
      quiz = new Quiz(selected);
      renderFlag();
      renderProgress();
      tick();
      clockInterval = setInterval(tick, 100);
      $('answer').focus({ preventScroll: true });
    } catch {
      showScreen('setup');
      $('loading-status').textContent = 'A flag could not load. Check that assets/flags is present, then choose a region to try again.';
      return;
    } finally {
      loading = false;
      document.querySelectorAll('.region-card, #play-again').forEach(button => { button.disabled = false; });
    }
    $('loading-status').textContent = '';
  }
  function tick() { if (quiz) $('timer').textContent = formatTime(quiz.elapsed); }
  function renderFlag() {
    const flag = $('quiz-flag');
    flag.src = `assets/flags/${quiz.current.code}.svg`;
    flag.getAnimations().forEach(animation => animation.cancel());
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) flag.animate([{ opacity: .5, transform: 'scale(.98)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 150 });
    $('flag-panel').className = 'flag-panel';
  }
  function renderProgress() {
    const count = quiz.completed.size;
    $('correct-count').textContent = count;
    $('progress-fill').style.width = `${count / quiz.total * 100}%`;
    $('progress-track').setAttribute('aria-valuenow', count);
    const remaining = quiz.total - count;
    $('remaining-count').textContent = `${remaining} ${remaining === 1 ? 'flag' : 'flags'} to go`;
  }
  function respond(value, submit) {
    if (!quiz) return;
    const result = quiz.answer(value, submit);
    if (!result) return;
    clearTimeout(feedbackTimeout);
    $('answer').value = '';
    const feedback = $('feedback');
    feedback.className = `feedback ${result.kind}`;
    feedback.replaceChildren();
    const countryName = document.createElement('strong');
    countryName.textContent = result.country.name;
    if (result.kind === 'correct') {
      feedback.append('✓ Correct — ', countryName);
      renderProgress();
      if (quiz.phase === 'complete') { complete(); return; }
      renderFlag();
      $('flag-panel').classList.add('success');
      feedbackTimeout = setTimeout(() => { feedback.className = 'feedback'; feedback.textContent = 'Keep the momentum going.'; }, 1000);
    } else {
      feedback.append(result.kind === 'skip' ? '↻ Skipped — ' : 'Not quite — ', countryName, '. You’ll see this flag again.');
      $('flag-panel').classList.add(result.kind === 'skip' ? 'skipped' : 'incorrect');
      $('answer').readOnly = true;
      $('skip-button').disabled = true;
      feedbackTimeout = setTimeout(() => {
        quiz.advance();
        renderFlag();
        $('answer').readOnly = false;
        $('answer').value = '';
        $('skip-button').disabled = false;
        feedback.className = 'feedback';
        feedback.textContent = 'A fresh flag. You’ve got this.';
        $('answer').focus({ preventScroll: true });
      }, 1400);
    }
    $('answer').focus({ preventScroll: true });
  }
  function complete() {
    clearInterval(clockInterval);
    tick();
    const previousBest = getBest(region);
    const newBest = previousBest === null || quiz.elapsed < previousBest;
    if (newBest) { try { localStorage.setItem(bestKey(region), String(quiz.elapsed)); } catch { /* The game also works with storage disabled. */ } }
    $('complete-title').replaceChildren(`${region}, conquered`);
    const dot = document.createElement('span'); dot.className = 'accent'; dot.textContent = '.'; $('complete-title').append(dot);
    $('complete-region').textContent = `${region} challenge`;
    $('record-badge').textContent = newBest ? 'NEW PERSONAL BEST' : 'ALL FLAGS CLEARED';
    $('final-time').textContent = formatTime(quiz.elapsed);
    $('result-flags').textContent = `${quiz.completed.size} / ${quiz.total} Flags`;
    $('stat-correct').textContent = quiz.completed.size;
    $('stat-incorrect').textContent = quiz.incorrect;
    $('stat-skips').textContent = quiz.skips;
    showScreen('complete');
    $('play-again').focus({ preventScroll: true });
  }
  $('answer').addEventListener('input', event => { if (!event.isComposing) respond(event.target.value, false); });
  $('answer').addEventListener('compositionend', event => respond(event.target.value, false));
  $('answer-form').addEventListener('submit', event => { event.preventDefault(); respond($('answer').value, true); });
  $('answer').addEventListener('keydown', event => { if (event.isComposing && event.key === 'Enter') event.preventDefault(); });
  $('skip-button').addEventListener('click', () => respond('', true));
  $('play-again').addEventListener('click', () => start(region));
  $('change-region').addEventListener('click', () => { clearTimeout(feedbackTimeout); clearInterval(clockInterval); quiz = null; buildRegions(); showScreen('setup'); $('region-grid').querySelector('button').focus({ preventScroll: true }); });
  $('how-button').addEventListener('click', () => $('how-dialog').showModal());
  function closeInstructions() { $('how-dialog').close(); }
  $('close-dialog').addEventListener('click', closeInstructions);
  $('got-it').addEventListener('click', closeInstructions);
  $('how-dialog').addEventListener('close', () => { if (quiz?.phase === 'answering') $('answer').focus({ preventScroll: true }); });
  $('how-dialog').addEventListener('click', event => { if (event.target === $('how-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeInstructions(); } });
  document.addEventListener('keydown', event => {
    if (!quiz || quiz.phase !== 'answering' || $('how-dialog').open || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    if (document.activeElement === $('answer') || document.activeElement?.tagName === 'BUTTON') return;
    if (event.key.length === 1) { event.preventDefault(); $('answer').focus(); $('answer').value += event.key; respond($('answer').value, false); }
  });
  document.addEventListener('visibilitychange', tick);
  buildRegions();
})();
