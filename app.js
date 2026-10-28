"use strict";
const entry = document.getElementById('entry');
const boot = document.getElementById('boot');
const main = document.getElementById('main');
const enter = document.getElementById('enter');
const skip = document.getElementById('skip-boot');
const video = document.querySelector('.dream-video');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let state = 'entry', timer, audio, master;

// Development preview is enabled only by the sound lab's explicit URL.
const soundParams = new URLSearchParams(window.location.search);
const requestedSound = Number(soundParams.get('sound'));
const devSound = soundParams.get('debug') === 'audio' && Number.isInteger(requestedSound) && requestedSound >= 1 && requestedSound <= 10 ? requestedSound : 0;
let devVoice;
const devReady = devSound ? new Promise(resolve => {
  const script = document.createElement('script');
  script.src = 'dev/sounds.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.head.append(script);
  const link = document.createElement('a');
  link.href = 'dev/sound-lab.html';
  link.textContent = 'sound ' + devSound + ' preview · back to sound lab';
  link.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:5;background:#000;padding:8px 12px;font:13px Georgia,serif;color:#fff;border:1px solid #444';
  document.body.append(link);
}) : null;


function initAudio() {
  try {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    master = audio.createGain();
    master.gain.value = devSound && soundParams.has('volume') ? Math.max(0,Math.min(1,Number(soundParams.get('volume'))/100 || 0)) : .35;
    master.connect(audio.destination);
    audio.resume().catch(() => {});
  } catch { audio = null; }
}
function tone(freq, duration, delay = 0, type = 'sine', level = .12) {
  if (!audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(level, start + .015);
  gain.gain.exponentialRampToValueAtTime(.001, start + duration);
  osc.connect(gain); gain.connect(master);
  osc.start(start); osc.stop(start + duration + .02);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}
function bootSound(){
  if (devSound && window.SlogSounds && audio) {
    devVoice = window.SlogSounds.play(devSound, audio, master);
    return;
  }
  // A low foundation, slowly opening fifths, and faint delayed upper harmonics.
  tone(65.41,3.6,0,'sine',.14);tone(130.81,3.2,.15,'sine',.09);
  tone(196,2.8,.4,'sine',.065);tone(261.63,2.7,.7,'sine',.07);
  tone(392,2.1,1.1,'sine',.055);tone(523.25,1.9,1.4,'sine',.045);
  tone(783.99,1.6,1.7,'sine',.025);tone(784.8,1.6,1.72,'sine',.018);
  tone(523.25,1.5,1.95,'sine',.022);tone(783.99,1.25,2.25,'sine',.012);
}
function finish(skipped = false) {
  if (state !== 'loading' && state !== 'revealing') return;
  clearTimeout(timer);
  if (!skipped && !reducedMotion.matches && state === 'loading') {
    state = 'revealing';
    document.body.classList.add('entered', 'revealing');
    boot.classList.add('fade-out');
    timer = setTimeout(() => finish(false), 650);
    return;
  }
  state = 'content';
  document.body.classList.remove('revealing');
  boot.hidden = true;
  document.body.classList.add('entered');
  main.focus({preventScroll:true});
  if (video) video.play().catch(() => {});
  if (audio && master) {
    if (skipped) { if(devVoice)devVoice.stop(); master.gain.setTargetAtTime(0, audio.currentTime, .15); }
    else if (!devSound) { tone(523.25,.4,0,'sine',.04); tone(783.99,.6,.1,'sine',.025); }
    setTimeout(() => audio.close().catch(() => {}), 800);
  }
}
async function start() {
  if (state !== 'entry') return;
  state = 'loading';
  initAudio();
  if (devReady) await devReady;
  if (state !== 'loading') return;
  entry.hidden = true;
  boot.hidden = false;
  bootSound();
  timer = setTimeout(finish, reducedMotion.matches ? 450 : 4300);
  skip.focus({preventScroll:true});
}
enter.addEventListener('click', start);
skip.addEventListener('click', () => finish(true));
document.addEventListener('keydown', event => {
  if ((state === 'loading' || state === 'revealing') && event.key === 'Escape') { event.preventDefault(); finish(true); }
});
entry.hidden = false;
