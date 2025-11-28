/**
 * Utility functions for downloading audio files
 */

/**
 * Downloads an audio file from a given URL
 * @param {string} audioUrl - The URL of the audio file to download
 * @param {string} fileName - The desired filename for the downloaded file
 * @returns {Promise<void>}
 */
export const downloadAudio = async (audioUrl, fileName = 'audio.mp3') => {
  try {
    // Fetch the audio file
    const response = await fetch(audioUrl);

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
