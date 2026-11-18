// WebAudio synthesized sound: no audio files, no network. Engine hum, siren,
// gunshot, punch, pickup chime, and a small looping bassline melody.
export class AudioSys {
  constructor() {
    this.ctx = null; this.master = null; this.muted = false;
    this.engineOsc = null; this.engineGain = null;
    this.sirenOn = false; this._sirenTimer = 0; this._musicTimer = 0;
    this._musicStep = 0;
    // A-minor-ish bassline, one note per step.
    this._bass = [55, 0, 55, 65.41, 49, 0, 55, 82.41, 55, 0, 55, 65.41, 49, 58.27, 65.41, 73.42];
  }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 50;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 320;
      this.engineOsc.connect(filt); filt.connect(this.engineGain); this.engineGain.connect(this.master);
      this.engineOsc.start();
    } catch (e) { this.ctx = null; }
  }
  toggleMute() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.35; return this.muted; }
  setEngine(running, speedNorm) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(running ? 0.05 + 0.06 * speedNorm : 0, t, 0.1);
    this.engineOsc.frequency.setTargetAtTime(48 + 90 * speedNorm, t, 0.1);
  }
  _tone(freq, dur, type, vol, when = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  _noise(dur, vol, freq = 1200) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t);
  }
  shoot() { this._noise(0.12, 0.5, 900); this._tone(160, 0.08, 'square', 0.2); }
  punch() { this._noise(0.09, 0.4, 300); }
  pickup() { this._tone(660, 0.12, 'sine', 0.3); this._tone(880, 0.18, 'sine', 0.3, 0.1); }
  missionDone() { [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.22, 'triangle', 0.3, i * 0.11)); }
  busted() { this._tone(220, 0.5, 'sawtooth', 0.25); this._tone(174, 0.7, 'sawtooth', 0.25, 0.3); }
  steal() { this._tone(330, 0.1, 'square', 0.2); this._tone(392, 0.14, 'square', 0.2, 0.09); }
  update(dt, wanted) {
    if (!this.ctx || this.muted) return;
    // Siren two-tone while wanted.
    this._sirenTimer -= dt;
    if (wanted > 0 && this._sirenTimer <= 0) {
      this._sirenTimer = 0.55;
      this._tone(this.sirenOn ? 660 : 880, 0.5, 'sine', 0.08);
      this.sirenOn = !this.sirenOn;
    }
    // Bassline loop, one step every 0.24 s.
    this._musicTimer -= dt;
    if (this._musicTimer <= 0) {
      this._musicTimer = 0.24;
      const f = this._bass[this._musicStep % this._bass.length];
      this._musicStep++;
      if (f > 0) this._tone(f, 0.22, 'triangle', 0.12);
    }
  }
}
