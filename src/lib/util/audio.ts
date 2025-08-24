// Simple audio utility for playing Pokémon cries
// Uses native Web Audio API to avoid dependencies

export const playAudio = async (url: string, volume: number = 0.3): Promise<void> => {
  if (!url) return;
  
  try {
    // Create audio element for simple playback
    const audio = new Audio(url);
    audio.volume = volume;
    audio.preload = 'auto';
    
    // Play the audio
    await audio.play();
  } catch (error) {
    // Gracefully handle audio failures (autoplay policies, network issues, etc.)
    console.warn('Audio playback failed:', error);
  }
};

export const preloadAudio = (url: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No audio URL provided'));
      return;
    }

    const audio = new Audio(url);
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
    audio.addEventListener('error', () => reject(new Error('Failed to load audio')), { once: true });
    
    audio.load();
  });
};
