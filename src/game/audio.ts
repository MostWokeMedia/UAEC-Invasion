import { readBoolean, writeBoolean } from "./storage";

const MUSIC_MUTED_KEY = "uaec-music-muted";
const SFX_MUTED_KEY = "uaec-sfx-muted";
const MUSIC_TRACKS = [
  "/assets/audio/music_loop.mp3",
  "/assets/audio/music_loop_02.mp3",
  "/assets/audio/music_loop_03.mp3",
];

export class AudioManager {
  private context: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private tankRumbleOscillator: OscillatorNode | null = null;
  private tankRumbleOvertone: OscillatorNode | null = null;
  private tankRumbleGain: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private musicTrackIndex = 0;
  private failedMusicTracks = new Set<number>();
  private unlockHandler: (() => void) | null = null;

  private musicMuted = readBoolean(MUSIC_MUTED_KEY, false);
  private sfxMuted = readBoolean(SFX_MUTED_KEY, false);
  private musicLoadFailed = false;
  private musicPausedForGame = false;
  private musicRequested = false;

  constructor() {
    this.setupAudioUnlock();
  }

  get isMusicMuted(): boolean {
    return this.musicMuted;
  }

  get isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  get hasMusic(): boolean {
    return this.music !== null && !this.musicLoadFailed;
  }

  initialize(): void {
    this.initializeSfx();
    this.musicRequested = true;
    this.initializeMusic();
  }

  dispose(): void {
    this.stopTankRumble();
    this.removeAudioUnlock();
  }

  toggleMusicMute(): void {
    this.musicMuted = !this.musicMuted;
    writeBoolean(MUSIC_MUTED_KEY, this.musicMuted);

    if (!this.music) return;

    this.music.muted = this.musicMuted;

    if (!this.musicMuted && !this.musicPausedForGame) {
      void this.music.play().catch(() => {
        // Browser may block playback until another interaction.
      });
    }
  }

  pauseMusic(): void {
    this.musicPausedForGame = true;

    if (this.music && !this.music.paused) {
      this.music.pause();
    }
  }

  resumeMusic(): void {
    this.musicPausedForGame = false;

    if (!this.musicMuted) {
      this.playMusicIfAvailable();
    }
  }

  toggleSfxMute(): void {
    this.sfxMuted = !this.sfxMuted;
    writeBoolean(SFX_MUTED_KEY, this.sfxMuted);

    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.40;
    }

    if (this.sfxMuted) {
      this.stopTankRumble();
    }
  }

  startTankRumble(): void {
    if (this.tankRumbleOscillator || this.sfxMuted) return;

    this.initializeSfx();

    if (!this.context || !this.sfxGain) return;

    const now = this.context.currentTime;
    const rumble = this.context.createOscillator();
    const overtone = this.context.createOscillator();
    const gain = this.context.createGain();

    rumble.type = "sawtooth";
    rumble.frequency.setValueAtTime(38, now);

    overtone.type = "triangle";
    overtone.frequency.setValueAtTime(62, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.026, now + 0.18);

    rumble.connect(gain);
    overtone.connect(gain);
    gain.connect(this.sfxGain);

    rumble.start(now);
    overtone.start(now);

    this.tankRumbleOscillator = rumble;
    this.tankRumbleOvertone = overtone;
    this.tankRumbleGain = gain;
  }

  stopTankRumble(): void {
    if (!this.context || !this.tankRumbleOscillator || !this.tankRumbleGain) {
      this.tankRumbleOscillator = null;
      this.tankRumbleOvertone = null;
      this.tankRumbleGain = null;
      return;
    }

    const now = this.context.currentTime;
    const stopAt = now + 0.14;
    const rumble = this.tankRumbleOscillator;
    const overtone = this.tankRumbleOvertone;
    const gain = this.tankRumbleGain;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0.001, stopAt);

    rumble.stop(stopAt);
    overtone?.stop(stopAt);

    window.setTimeout(() => {
      rumble.disconnect();
      overtone?.disconnect();
      gain.disconnect();
    }, 180);

    this.tankRumbleOscillator = null;
    this.tankRumbleOvertone = null;
    this.tankRumbleGain = null;
  }

  playHeartbeat(aliveCount: number): void {
    const bassFrequency =
      aliveCount <= 3 ? 104 : aliveCount <= 7 ? 92 : aliveCount <= 14 ? 78 : 64;

    const clickFrequency =
      aliveCount <= 7 ? 190 : aliveCount <= 14 ? 160 : 132;

    this.playTone(bassFrequency, 0.105, "sawtooth", 0.13);

    window.setTimeout(() => {
      this.playTone(clickFrequency, 0.035, "square", 0.045);
    }, 42);
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
    window.setTimeout(() => this.playTone(110, 0.15, "triangle", 0.1), 90);
  }

  playWaveClear(): void {
    this.playTone(330, 0.08, "square", 0.08);
    window.setTimeout(() => this.playTone(440, 0.08, "square", 0.08), 110);
    window.setTimeout(() => this.playTone(660, 0.13, "square", 0.08), 220);
  }

  private initializeSfx(): void {
    if (this.context) {
      if (this.context.state === "suspended") {
        void this.context.resume();
      }

      return;
    }

    const AudioContextConstructor =
      window.AudioContext ||
      (
        window as Window &
          typeof globalThis & { webkitAudioContext?: typeof AudioContext }
      ).webkitAudioContext;

    if (!AudioContextConstructor) return;

    this.context = new AudioContextConstructor();
    this.sfxGain = this.context.createGain();
    this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.40;
    this.sfxGain.connect(this.context.destination);

    if (this.context.state === "suspended") {
      void this.context.resume();
    }
  }

  private setupAudioUnlock(): void {
    this.unlockHandler = () => {
      this.initializeSfx();
      if (this.musicRequested) {
        this.initializeMusic();
      }
      this.playMusicIfAvailable();
    };

    window.addEventListener("keydown", this.unlockHandler);
    window.addEventListener("pointerdown", this.unlockHandler);
  }

  private removeAudioUnlock(): void {
    if (!this.unlockHandler) return;

    window.removeEventListener("keydown", this.unlockHandler);
    window.removeEventListener("pointerdown", this.unlockHandler);
    this.unlockHandler = null;
  }

  private initializeMusic(): void {
    if (this.music || this.musicLoadFailed) {
      this.playMusicIfAvailable();
      return;
    }

    this.loadMusicTrack(this.musicTrackIndex);
  }

  private loadMusicTrack(trackIndex: number): void {
    this.music?.pause();
    this.music = null;
    this.musicTrackIndex = trackIndex;

    const music = new Audio(MUSIC_TRACKS[trackIndex]);

    music.loop = false;
    music.volume = 0.04;
    music.muted = this.musicMuted;

    music.addEventListener("error", () => {
      this.failedMusicTracks.add(trackIndex);
      if (this.music !== music) return;

      this.music = null;

      if (this.failedMusicTracks.size >= MUSIC_TRACKS.length) {
        this.musicLoadFailed = true;
        console.info("UAEC Invasion: no music loop files found. Music disabled.");
        return;
      }

      this.loadMusicTrack(this.getNextAvailableTrackIndex(trackIndex));
    });

    music.addEventListener("ended", () => {
      if (this.music !== music) return;

      this.loadMusicTrack(this.getNextAvailableTrackIndex(trackIndex));
    });

    this.music = music;
    this.playMusicIfAvailable();
  }

  private getNextAvailableTrackIndex(currentIndex: number): number {
    for (let offset = 1; offset <= MUSIC_TRACKS.length; offset++) {
      const index = (currentIndex + offset) % MUSIC_TRACKS.length;

      if (!this.failedMusicTracks.has(index)) {
        return index;
      }
    }

    return currentIndex;
  }

  private playMusicIfAvailable(): void {
    if (!this.music || this.musicMuted || this.musicLoadFailed || this.musicPausedForGame) return;

    void this.music.play().catch(() => {
      // Browser may require another user interaction first.
    });
  }

  private playTone(
    frequency: number,
    durationSeconds: number,
    type: OscillatorType,
    volume: number,
  ): void {
    if (!this.context || !this.sfxGain || this.sfxMuted) return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

    oscillator.connect(gain);
    gain.connect(this.sfxGain);

    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
  }
}
