import { useState, useEffect } from 'react';
import { isLocalAudioUrl, getSongIdFromLocalUrl, getAudioLocally } from '../utils/localAudioStorage';

/**
 * Custom hook to handle local audio URLs
 * Converts local:// references to actual data URLs
 */
export const useLocalAudio = (audioUrl) => {
  const [actualAudioUrl, setActualAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audioUrl) {
      setActualAudioUrl(null);
      return;
    }

    // If it's not a local URL, use it directly
    if (!isLocalAudioUrl(audioUrl)) {
      setActualAudioUrl(audioUrl);
      return;
    }

    // Load from local storage
    const loadLocalAudio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const songId = getSongIdFromLocalUrl(audioUrl);
        const dataURL = await getAudioLocally(songId);
        setActualAudioUrl(dataURL);
      } catch (err) {
        console.error('Failed to load local audio:', err);
        setError(err);
        setActualAudioUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocalAudio();
  }, [audioUrl]);

  return { audioUrl: actualAudioUrl, isLoading, error };
};
