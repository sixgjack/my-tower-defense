// src/engine/SoundSystem.ts

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // --- NEW: Alarm State ---
  private alarmOsc: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;

  // Browsers block audio until the user interacts with the page.
  // We call this on the first click.
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- NEW: Emergency Siren Methods ---
  startLowHealthAlarm() {
    // prevent multiple alarms or starting if muted/no context
    if (!this.ctx || this.isMuted || this.alarmOsc) return; 

    const t = this.ctx.currentTime;

    // 1. Create the carrier (the sound we hear)
    this.alarmOsc = this.ctx.createOscillator();
    this.alarmOsc.type = 'sawtooth';
    this.alarmOsc.frequency.setValueAtTime(400, t); // Base frequency (Hz)

    // 2. Create the LFO (Low Frequency Oscillator) to modulate pitch
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(2, t); // 2 pulses per second

    // 3. Connect LFO to Carrier Frequency
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(100, t); // How wide the pitch swing is
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.alarmOsc.frequency);

    // 4. Output Gain (Volume)
    this.alarmGain = this.ctx.createGain();
    this.alarmGain.gain.setValueAtTime(0.05, t); // Low volume background drone
    
    // 5. Connect to speakers
    this.alarmOsc.connect(this.alarmGain);
    this.alarmGain.connect(this.ctx.destination);

    // 6. Start oscillators
    this.alarmOsc.start();
    this.lfo.start();
  }

  stopLowHealthAlarm() {
    if (this.alarmOsc) {
      const t = this.ctx?.currentTime || 0;
      
      // Capture local references to stop them safely
      const osc = this.alarmOsc;
      const lfo = this.lfo;
      const gain = this.alarmGain;

      // Reset class state immediately so we can start again if needed
      this.alarmOsc = null;
      this.lfo = null;
      this.alarmGain = null;

      // Smooth fade out to avoid "pop" sound
      if (gain) {
        gain.gain.cancelScheduledValues(t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);
      }
      
      // Stop nodes after fade
      osc.stop(t + 0.5);
      lfo?.stop(t + 0.5);
    }
  }

  play(type: 'shoot' | 'hit' | 'build' | 'upgrade' | 'sell' | 'gameover' | 'freeze' | 'weakness' | 'buff' | 'debuff' | 'surge' | 'growth' | 'stun' | 'rage' | 'boss' | 'hit_base' | 'teleport' | 'heal' | 'explode' | 'split' | 'charge') {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    switch (type) {
      case 'shoot': // Pew Pew
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.03, now); // Low volume
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'hit': // Crunch
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(0, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'build': // High Ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'upgrade': // Power up
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
        
      case 'sell': // Coin sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1600, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'gameover': // Game Over Sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'freeze': // Freeze/Frostbite Sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'weakness': // Weakness Debuff Sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'buff': // Buff Sound (positive)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'debuff': // Debuff Sound (negative)
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'surge': // Battle Surge Sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'growth': // Growth/Regeneration Sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.linearRampToValueAtTime(350, now + 0.25);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'stun': // Stun Sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'rage': // Rage/Damage Boost Sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
        
      case 'teleport': // Teleport Sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
        
      case 'heal': // Heal Sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
        
      case 'explode': // Explode Sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
        
      case 'split': // Split Sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
        
      case 'charge': // Charge Sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
    }
  }
}

export const soundSystem = new SoundSystem();