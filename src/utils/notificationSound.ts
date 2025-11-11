// Notification sound utilities
// Uses Web Audio API to generate notification sounds

class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Check if user has previously disabled sounds
    const savedPreference = localStorage.getItem('notification-sounds-enabled');
    this.enabled = savedPreference !== 'false';
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('notification-sounds-enabled', enabled.toString());
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Play a pleasant notification sound
  playNotificationSound(type: 'message' | 'like' | 'comment' | 'default' = 'default') {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Create oscillator for tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different sounds for different notification types
      switch (type) {
        case 'message':
          // Two-tone for messages (C5 -> E5)
          oscillator.frequency.setValueAtTime(523.25, now);
          oscillator.frequency.setValueAtTime(659.25, now + 0.1);
          break;
        case 'like':
          // Single pleasant tone (A5)
          oscillator.frequency.setValueAtTime(880, now);
          break;
        case 'comment':
          // Three-tone for comments (C5 -> E5 -> G5)
          oscillator.frequency.setValueAtTime(523.25, now);
          oscillator.frequency.setValueAtTime(659.25, now + 0.08);
          oscillator.frequency.setValueAtTime(783.99, now + 0.16);
          break;
        default:
          // Default pleasant tone (E5)
          oscillator.frequency.setValueAtTime(659.25, now);
      }

      oscillator.type = 'sine';

      // Smooth envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }
}

// Export singleton instance
export const notificationSound = new NotificationSoundManager();
