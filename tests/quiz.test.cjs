const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { countries, regions } = require('../countries.js');
const { Quiz, matches, shuffle, formatTime } = require('../engine.js');
const find = code => countries.find(c => c.code === code);
const expectedCodes = `ad ae af ag al am ao ar at au az ba bb bd be bf bg bh bi bj bn bo br bs bt bw by bz ca cd cf cg ch ci cl cm cn co cr cu cv cy cz de dj dk dm do dz ec ee eg er es et fi fj fm fr ga gb gd ge gh gm gn gq gr gt gw gy hn hr ht hu id ie il in iq ir is it jm jo jp ke kg kh ki km kn kp kr kw kz la lb lc li lk lr ls lt lu lv ly ma mc md me mg mh mk ml mm mn mr mt mu mv mw mx my mz na ne ng ni nl no np nr nz om pa pe pg ph pk pl ps pt pw py qa ro rs ru rw sa sb sc sd se sg si sk sl sm sn so sr ss st sv sy sz td tg th tj tl tm tn to tr tt tv tz ua ug us uy uz va vc ve vn vu ws ye za zm zw`.split(' ');

test('World is exactly the specified 195 sovereign states, with no dependencies', () => {
  assert.equal(countries.length, 195);
  assert.deepEqual(countries.map(c => c.code).sort(), expectedCodes);
  assert.equal(new Set(countries.map(c => c.code)).size, 195);
});
test('Continents partition all countries once using the documented assignment', () => {
  const expected = { Africa: 54, Asia: 48, Europe: 44, 'North America': 23, 'South America': 12, Oceania: 14 };
  assert.equal(regions.length, 7);
  for (const [region, total] of Object.entries(expected)) assert.equal(countries.filter(c => c.region === region).length, total, region);
  assert.equal(find('ru').region, 'Europe');
  for (const code of ['tr','cy','ge','am','az','kz']) assert.equal(find(code).region, 'Asia');
});
test('All country names and aliases match without case sensitivity or surrounding spaces', () => {
  for (const country of countries) for (const answer of [country.name, ...country.aliases]) {
    assert.ok(matches(country, `  ${answer.toUpperCase()}  `), `${country.name}: ${answer}`);
  }
});
test('Recognized punctuation and accent variations are accepted; misspellings are rejected', () => {
  for (const [code, answer] of [['us','U.S.A.'],['gb','U.K.'],['ci','Cote dIvoire'],['st','Sao Tome and Principe'],['tr','Turkiye'],['tl','Timor Leste'],['kn','St. Kitts & Nevis'],['kp',"Democratic Peoples Republic of Korea"]]) assert.ok(matches(find(code), answer), answer);
  for (const [code, answer] of [['fr','frnace'],['co','Columbia'],['au','Austria'],['ne','Nigeria'],['us','United State'],['cd','Congo'],['fr','F rance'],['jp','Japann'],['kr','Korea'],['gb','England']]) assert.equal(matches(find(code), answer), false, answer);
});
test('Correct typing advances immediately, removes the flag and counts it once', () => {
  const quiz = new Quiz(countries.slice(0, 5), { random: () => .4 });
  const first = quiz.current;
  assert.equal(quiz.answer(first.name.slice(0, 2)), null);
  assert.equal(quiz.completed.size, 0);
  assert.equal(quiz.answer(first.name).kind, 'correct');
  assert.equal(quiz.completed.size, 1);
  assert.notEqual(quiz.current.code, first.code);
  assert.ok(!quiz.queue.some(c => c.code === first.code));
  assert.equal(quiz.answer(first.name), null);
});
test('Wrong answers wait for Enter and reveal the country without completing it', () => {
  const quiz = new Quiz(countries.slice(0, 5));
  const country = quiz.current;
  assert.equal(quiz.answer('Definitely wrong'), null);
  assert.equal(quiz.incorrect, 0);
  assert.deepEqual(quiz.answer('Definitely wrong', true), { kind: 'incorrect', country });
  assert.equal(quiz.phase, 'feedback');
  assert.equal(quiz.completed.size, 0);
  assert.equal(quiz.incorrect, 1);
  assert.equal(quiz.answer(country.name), null);
  assert.equal(quiz.answer('', true), null);
  quiz.advance();
  assert.notEqual(quiz.current.code, country.code);
});
test('Skipping forever never completes the game or repeats immediately with alternatives', () => {
  const quiz = new Quiz(countries.slice(0, 7));
  for (let i = 0; i < 300; i++) {
    const previous = quiz.current.code;
    assert.equal(quiz.answer('   ', true).kind, 'skip');
    quiz.advance();
    assert.notEqual(quiz.current.code, previous);
    assert.equal(new Set([quiz.current, ...quiz.queue].map(c => c.code)).size, 7);
  }
  assert.equal(quiz.skips, 300);
  assert.equal(quiz.completed.size, 0);
  assert.equal(quiz.finishedAt, null);
});
test('Missed flags are inserted at different eligible positions, not always at the end', () => {
  for (const random of [0, .25, .5, .999]) {
    const quiz = new Quiz(countries.slice(0, 5), { random: () => random });
    const missed = quiz.current;
    quiz.answer('', true);
    assert.equal(quiz.queue.indexOf(missed), 1 + Math.floor(random * 4));
  }
});
test('Last missed flag repeats until correctly identified; clock runs during feedback and freezes on final answer', () => {
  let now = 0;
  const quiz = new Quiz([find('jp')], { now: () => now });
  now = 1200;
  quiz.answer('', true);
  now = 2600;
  assert.equal(quiz.elapsed, 2600);
  quiz.advance();
  assert.equal(quiz.current.code, 'jp');
  quiz.answer('China', true);
  now = 4000;
  quiz.advance();
  quiz.answer('JAPAN');
  assert.equal(quiz.phase, 'complete');
  assert.equal(quiz.incorrect, 1);
  assert.equal(quiz.skips, 1);
  assert.equal(quiz.completed.size, 1);
  now = 10000;
  assert.equal(quiz.elapsed, 4000);
  assert.equal(quiz.answer('Japan'), null);
});
test('Full World run with repeated misses completes exactly 195 unique flags', () => {
  const quiz = new Quiz(countries);
  const answered = new Set();
  for (let i = 0; i < 195; i++) { quiz.answer(i % 2 ? '' : 'wrong', true); quiz.advance(); }
  while (quiz.phase !== 'complete') {
    assert.ok(!answered.has(quiz.current.code));
    answered.add(quiz.current.code);
    quiz.answer(quiz.current.name);
  }
  assert.equal(answered.size, 195);
  assert.equal(quiz.completed.size, 195);
  assert.equal(quiz.queue.length, 0);
  assert.equal(quiz.incorrect + quiz.skips, 195);
});
test('A new run resets statistics, time, and flags, with independent shuffled order', () => {
  let now = 123;
  const one = new Quiz(countries, { random: () => .1, now: () => now });
  one.answer('', true); one.advance(); one.answer(one.current.name);
  now = 999;
  const two = new Quiz(countries, { random: () => .9, now: () => now });
  assert.equal(two.elapsed, 0); assert.equal(two.completed.size, 0); assert.equal(two.skips, 0); assert.equal(two.incorrect, 0);
  assert.equal(two.queue.length, 194);
  assert.notDeepEqual([one.current, ...one.queue], [two.current, ...two.queue]);
  assert.equal(new Set(shuffle(countries).map(c => c.code)).size, 195);
});
test('Stopwatch formats minute and hour boundaries correctly', () => {
  for (const [time, value] of [[0,'00:00'],[999,'00:00'],[60000,'01:00'],[3599999,'59:59'],[3600000,'01:00:00'],[3723000,'01:02:03']]) assert.equal(formatTime(time), value);
});
test('All 195 flags are real local SVG files, including Palestine and Vatican City', () => {
  for (const country of countries) {
    const svg = fs.readFileSync(path.join(__dirname, '..', 'assets', 'flags', `${country.code}.svg`), 'utf8');
    assert.match(svg, /<svg\b/, country.name);
    assert.doesNotMatch(svg, /<script\b/i, country.name);
  }
});
