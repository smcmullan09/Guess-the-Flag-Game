(function (root) {
  'use strict';
  function normalize(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[.'’]/g, '').replace(/[-‐‑–]/g, ' ').replace(/&/g, ' and ')
      .trim().replace(/\s+/g, ' ');
  }
  function matches(country, answer) {
    const normalized = normalize(answer);
    return [country.name, ...country.aliases].some(name => normalize(name) === normalized);
  }
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function formatTime(milliseconds) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const pad = n => String(n).padStart(2, '0');
    const minutes = Math.floor(seconds / 60);
    return seconds >= 3600
      ? `${pad(Math.floor(seconds / 3600))}:${pad(minutes % 60)}:${pad(seconds % 60)}`
      : `${pad(minutes)}:${pad(seconds % 60)}`;
  }
  class Quiz {
    constructor(countries, { random = Math.random, now = () => performance.now() } = {}) {
      if (!countries.length || new Set(countries.map(c => c.code)).size !== countries.length) {
        throw new Error('A quiz needs a nonempty set of unique countries.');
      }
      this.random = random;
      this.now = now;
      this.queue = shuffle(countries, random);
      this.total = countries.length;
      this.completed = new Set();
      this.incorrect = 0;
      this.skips = 0;
      this.phase = 'answering';
      this.current = this.queue.shift();
      this.startedAt = now();
      this.finishedAt = null;
    }
    get elapsed() { return (this.finishedAt ?? this.now()) - this.startedAt; }
    answer(value, submit = false) {
      if (this.phase !== 'answering') return null;
      const country = this.current;
      if (matches(country, value)) {
        this.completed.add(country.code);
        if (this.completed.size === this.total) {
          this.finishedAt = this.now();
          this.phase = 'complete';
          this.current = null;
        } else {
          this.current = this.queue.shift();
        }
        return { kind: 'correct', country };
      }
      if (!submit) return null;
      const kind = value.trim() ? 'incorrect' : 'skip';
      if (kind === 'incorrect') this.incorrect++;
      else this.skips++;
      // Keep queue[0] as a different next flag whenever one exists.
      const position = this.queue.length ? 1 + Math.floor(this.random() * this.queue.length) : 0;
      this.queue.splice(position, 0, country);
      this.phase = 'feedback';
      return { kind, country };
    }
    advance() {
      if (this.phase !== 'feedback') return;
      this.current = this.queue.shift();
      this.phase = 'answering';
    }
  }
  const engine = { normalize, matches, shuffle, formatTime, Quiz };
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
  else root.FlagEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
