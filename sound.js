// Coffee Darbar — Luxury Micro-Acoustics & Ambient Sound Engine (Web Audio API)
(function() {
  'use strict';

  let audioCtx = null;
  let isMuted = localStorage.getItem('hardiSoundMuted') === 'true';
  let ambientSource = null;
  let ambientGain = null;
  let activeAmbientType = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function unlockAudio() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  }
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });

  // 1. Porcelain Cup & Saucer Clink (Resonant harmonics)
  function playPorcelainClink() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2150, t);
    osc1.frequency.exponentialRampToValueAtTime(1750, t + 0.18);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3450, t);
    osc2.frequency.exponentialRampToValueAtTime(2950, t + 0.12);

    gainNode.gain.setValueAtTime(0.045, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.24);
    osc2.stop(t + 0.24);
  }

  // 2. Brass Tactile Switch Click (Filtered crisp noise burst)
  function playBrassClick() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.02);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.Q.setValueAtTime(4.5, t);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.038, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(t);
  }

  // 3. Card & Paper Velvet Rustle
  function playCardRustle() {
    if (isMuted) return;
    // hover never starts the audio engine (that stalls the page for ~200 ms on Windows);
    // it only plays once a click has already switched sound on
    if (!audioCtx || audioCtx.state !== 'running') return;
    const ctx = audioCtx;

    const t = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.035);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.022, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(t);
  }

  // 4. Procedural Ambient Cafe Soundscapes for Study Focus (Pomodoro)
  function startAmbient(type) {
    if (!type) type = 'rain';
    stopAmbient();
    const ctx = getAudioContext();
    if (!ctx) return;

    activeAmbientType = type;
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut * 0.95) + (white * 0.05);
      data[i] = lastOut;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, t);
    } else if (type === 'jazz') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, t);
      filter.Q.setValueAtTime(1.5, t);
    } else {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.Q.setValueAtTime(2.0, t);
    }

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(0.001, t);
    ambientGain.gain.linearRampToValueAtTime(isMuted ? 0 : 0.065, t + 1.2);

    source.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    source.start(t);
    ambientSource = source;
  }

  function stopAmbient() {
    if (ambientGain && audioCtx) {
      try {
        const t = audioCtx.currentTime;
        ambientGain.gain.linearRampToValueAtTime(0.0001, t + 0.6);
        setTimeout(() => {
          if (ambientSource) {
            ambientSource.stop();
            ambientSource.disconnect();
            ambientSource = null;
          }
        }, 700);
      } catch (e) {
        if (ambientSource) ambientSource = null;
      }
    } else if (ambientSource) {
      try { ambientSource.stop(); } catch(e) {}
      ambientSource = null;
    }
    activeAmbientType = null;
  }

  // 5. Sound Toggle Controller
  function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('hardiSoundMuted', isMuted ? 'true' : 'false');
    updateSoundIcons();
    if (ambientGain && audioCtx) {
      const t = audioCtx.currentTime;
      ambientGain.gain.linearRampToValueAtTime(isMuted ? 0 : 0.065, t + 0.3);
    }
    if (!isMuted) playBrassClick();
  }

  function updateSoundIcons() {
    document.querySelectorAll('.sound-toggle-btn').forEach(btn => {
      btn.innerHTML = isMuted
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';
      btn.classList.toggle('is-muted', isMuted);
      btn.setAttribute('title', isMuted ? 'Unmute Luxury Audio' : 'Mute Luxury Audio');
    });
  }

  window.HardiAudio = {
    playClink: playPorcelainClink,
    playClick: playBrassClick,
    playRustle: playCardRustle,
    startAmbient: startAmbient,
    stopAmbient: stopAmbient,
    toggleMute: toggleMute,
    isMuted: function() { return isMuted; }
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateSoundIcons();

    document.querySelectorAll('.sound-toggle-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        toggleMute();
      });
    });

    document.addEventListener('click', e => {
      if (e.target.closest('.drink-pill, .atmo-btn, .menu-pill, .origin-pill-btn, .cup-order-badge, .fp-table-node, .zone-card-btn, .btn-brass, .btn-ghost')) {
        playBrassClick();
      }
      if (e.target.closest('.drink-pill, .hero-cup-stage, #cupStage')) {
        playPorcelainClink();
      }
    });

    let lastRustleTime = 0;
    document.addEventListener('mouseover', e => {
      if (e.target.closest('.dx-card, .coffee-card, .drink-card, .menu-card, .journey-step, .sanctuary-card-3d, .guild-pass-card')) {
        const now = Date.now();
        if (now - lastRustleTime > 300) {
          lastRustleTime = now;
          playCardRustle();
        }
      }
    });
  });
})();
