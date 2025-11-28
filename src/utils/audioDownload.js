/**
 * Utility functions for downloading audio files
 */

import { isLocalAudioUrl, getSongIdFromLocalUrl, getAudioLocally } from './localAudioStorage';

/**
 * Downloads an audio file from a given URL (handles both remote and local URLs)
 * @param {string} audioUrl - The URL of the audio file to download (can be local:// or http://)
 * @param {string} fileName - The desired filename for the downloaded file
 * @returns {Promise<void>}
 */
export const downloadAudio = async (audioUrl, fileName = 'audio.mp3') => {
  try {
    let actualUrl = audioUrl;

    // If it's a local URL, fetch from IndexedDB first
    if (isLocalAudioUrl(audioUrl)) {
      const songId = getSongIdFromLocalUrl(audioUrl);
      actualUrl = await getAudioLocally(songId);
    }

    // For data URLs, we can use them directly
    if (actualUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = actualUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // For remote URLs, fetch and download
    const response = await fetch(actualUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the blob from the response
    const blob = await response.blob();

    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'audio:', error);
    throw error;
  }
};

/**
 * Generates a safe filename from song title and artist
 * @param {string} title - The song title
 * @param {string} artist - The artist name
 * @param {string} extension - The file extension (default: 'mp3')
 * @returns {string} - A sanitized filename
 */
export const generateAudioFileName = (title, artist, extension = 'mp3') => {
  const sanitize = (str) => {
    return str
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const titlePart = sanitize(title || 'song');
  const artistPart = artist ? `_${sanitize(artist)}` : '';

  return `${titlePart}${artistPart}.${extension}`;
};
