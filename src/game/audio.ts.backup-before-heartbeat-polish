export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;

  get isMuted(): boolean {
    return this.muted;
  }

  initialize(): void {
    if (this.context) return;

    const AudioContextConstructor =
      window.AudioContext ||
      (
        window as Window &
          typeof globalThis & { webkitAudioContext?: typeof AudioContext }
      ).webkitAudioContext;

    if (!AudioContextConstructor) return;

    this.context = new AudioContextConstructor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.18;
    this.masterGain.connect(this.context.destination);
  }

  toggleMute(): void {
    this.muted = !this.muted;

    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.18;
    }
  }

  playHeartbeat(aliveCount: number): void {
    const frequency = aliveCount <= 7 ? 88 : aliveCount <= 14 ? 74 : 62;
    this.playTone(frequency, 0.085, "sawtooth", 0.11);
  }

  playShoot(): void {
    this.playTone(420, 0.06, "square", 0.08);
  }

  playEnemyHit(): void {
    this.playTone(140, 0.09, "triangle", 0.1);
  }

  playPlayerHit(): void {
    this.playTone(70, 0.22, "sawtooth", 0.16);
  }

  playTankHit(): void {
    this.playTone(55, 0.28, "square", 0.16);
    setTimeout(() => this.playTone(110, 0.15, "triangle", 0.1), 90);
  }

  playWaveClear(): void {
    this.playTone(330, 0.08, "square", 0.08);
    setTimeout(() => this.playTone(440, 0.08, "square", 0.08), 110);
    setTimeout(() => this.playTone(660, 0.13, "square", 0.08), 220);
  }

  private playTone(
    frequency: number,
    durationSeconds: number,
    type: OscillatorType,
    volume: number,
  ): void {
    if (!this.context || !this.masterGain || this.muted) return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

    oscillator.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
  }
}
