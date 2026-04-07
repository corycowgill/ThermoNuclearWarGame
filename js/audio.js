// ========== AUDIO ENGINE ==========
// Generates retro synth sounds via Web Audio API

const AudioEngine = {
  ctx: null,

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },

  ensure() {
    if (!this.ctx) this.init();
  },

  beep(freq = 800, dur = 0.08, vol = 0.15) {
    this.ensure();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.ctx.destination);
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  },

  alarm() {
    this.ensure();
    for (let i = 0; i < 6; i++) {
      setTimeout(() => this.beep(i % 2 === 0 ? 600 : 900, 0.2, 0.2), i * 250);
    }
  },

  explosion() {
    this.ensure();
    const bufSize = this.ctx.sampleRate * 0.8;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    }
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    src.connect(g);
    g.connect(this.ctx.destination);
    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    src.start();
  },

  type() {
    this.beep(400 + Math.random() * 200, 0.03, 0.05);
  }
};

export default AudioEngine;
