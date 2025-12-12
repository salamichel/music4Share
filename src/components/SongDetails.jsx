import React, { useState } from 'react';
import { X, Clock, Music2, FileText, Tag, Youtube, Sparkles, Edit2, Save, Download, Upload, FileUp, Eye, Trash } from 'lucide-react';
import { downloadAudio, generateAudioFileName } from '../utils/audioDownload';
import { uploadPdfFile, addSongPdf, deleteSongPdf, deletePdfFile } from '../firebase/firebaseHelpers';
import PdfViewer from './PdfViewer';

const SongDetails = ({ song, songPdfs = [], onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSong, setEditedSong] = useState({
    title: song?.title || '',
    artist: song?.artist || '',
    duration: song?.duration || '',
    genre: song?.genre || '',
    chords: song?.chords || '',
    lyrics: song?.lyrics || '',
    youtubeLink: song?.youtubeLink || '',
    audioFile: null,
    removeAudio: false,
  });

  // PDF management state
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfType, setPdfType] = useState('partition'); // 'paroles' or 'partition'
  const [pdfInstrument, setPdfInstrument] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(null);

  // Filter PDFs for this song
  const currentSongPdfs = songPdfs.filter(pdf => pdf.songId === song?.id);

  if (!song) return null;

  const handleEditChange = (field, value) => {
    setEditedSong(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(song.id, editedSong);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedSong({
      title: song.title || '',
      artist: song.artist || '',
      duration: song.duration || '',
      genre: song.genre || '',
      chords: song.chords || '',
      lyrics: song.lyrics || '',
      youtubeLink: song.youtubeLink || '',
      audioFile: null,
      removeAudio: false,
    });
    setIsEditing(false);
  };

  const handleDownloadAudio = async () => {
    if (!song.audioUrl) return;

    try {
      const fileName = generateAudioFileName(song.title, song.artist);
      await downloadAudio(song.audioUrl, fileName);
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'audio:', error);
      alert('Erreur lors du téléchargement du fichier audio. Veuillez réessayer.');
    }
  };

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      if (!validTypes.includes(file.type)) {
        alert('Format de fichier non supporté. Utilisez MP3, WAV, OGG ou M4A.');
        e.target.value = '';
        return;
      }
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Fichier trop volumineux. Taille maximale: 50MB.');
        e.target.value = '';
        return;
      }
      setEditedSong(prev => ({ ...prev, audioFile: file }));
    }
  };

  // PDF handlers
  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Format de fichier non supporté. Utilisez uniquement des fichiers PDF.');
        e.target.value = '';
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('Fichier trop volumineux. Taille maximale: 20MB.');
        e.target.value = '';
        return;
      }
      setPdfFile(file);
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) {
      alert('Veuillez sélectionner un fichier PDF');
      return;
    }

    if (pdfType === 'partition' && !pdfInstrument.trim()) {
      alert('Veuillez spécifier un instrument pour la partition');
      return;
    }

    setIsUploadingPdf(true);
    try {
      const pdfId = `pdf_${Date.now()}`;
      const pdfUrl = await uploadPdfFile(pdfFile, song.id, pdfId);

      const pdfData = {
        id: pdfId,
        songId: song.id,
        type: pdfType,
        instrument: pdfType === 'partition' ? pdfInstrument.trim() : '',
        filename: pdfFile.name,
        url: pdfUrl,
        createdAt: new Date().toISOString()
      };

      await addSongPdf(pdfData);

      // Reset form
      setPdfFile(null);
      setPdfInstrument('');
      alert('PDF uploadé avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'upload du PDF:', error);
      alert('Erreur lors de l\'upload du PDF. Veuillez réessayer.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleDeletePdf = async (pdf) => {
    if (!window.confirm(`Supprimer "${pdf.filename}" ?`)) {
      return;
    }

    try {
      await deletePdfFile(pdf.url);
      await deleteSongPdf(pdf.id);
      alert('PDF supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression du PDF:', error);
      alert('Erreur lors de la suppression du PDF.');
    }
  };

  const handleViewPdf = (pdf) => {
    setViewingPdf(pdf);
  };

  const handleDownloadPdf = (pdf) => {
    const link = document.createElement('a');
    link.href = pdf.url;
    link.download = pdf.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white p-4 sm:p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editedSong.title}
                    onChange={(e) => handleEditChange('title', e.target.value)}
                    className="w-full text-2xl sm:text-3xl font-bold mb-2 bg-white bg-opacity-20 border-2 border-white border-opacity-40 rounded-lg px-3 py-2 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:border-opacity-100"
                    placeholder="Titre"
                  />
                  <input
                    type="text"
                    value={editedSong.artist}
                    onChange={(e) => handleEditChange('artist', e.target.value)}
                    className="w-full text-lg sm:text-xl bg-white bg-opacity-20 border-2 border-white border-opacity-40 rounded-lg px-3 py-2 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:border-opacity-100"
                    placeholder="Artiste"
                  />
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{song.title}</h2>
                  <p className="text-lg sm:text-xl opacity-90 break-words">{song.artist}</p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Quick Info Tags */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
            {song.enriched && (
              <div className="flex items-center bg-green-500 bg-opacity-90 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Enrichi par Gemini
              </div>
            )}
            {isEditing ? (
              <>
                <div className="flex items-center bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  <input
                    type="text"
                    value={editedSong.duration}
                    onChange={(e) => handleEditChange('duration', e.target.value)}
                    className="bg-transparent border-b border-white border-opacity-40 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:border-opacity-100 w-20"
                    placeholder="MM:SS"
                  />
                </div>
                <div className="flex items-center bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-sm">
                  <Tag className="w-4 h-4 mr-2" />
                  <input
                    type="text"
                    value={editedSong.genre}
                    onChange={(e) => handleEditChange('genre', e.target.value)}
                    className="bg-transparent border-b border-white border-opacity-40 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:border-opacity-100 w-24"
                    placeholder="Genre"
                  />
                </div>
              </>
            ) : (
              <>
                {song.duration && (
                  <div className="flex items-center bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    {song.duration}
                  </div>
                )}
                {song.genre && (
                  <div className="flex items-center bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-sm">
                    <Tag className="w-4 h-4 mr-2" />
                    {song.genre}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Message si pas enrichi */}
          {!song.enriched && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Ce titre n'a pas été enrichi automatiquement. Les informations détaillées (accords, paroles) ne sont pas disponibles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* YouTube Link */}
          {(song.youtubeLink || isEditing) && (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
              {isEditing ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-red-900 flex items-center">
                    <Youtube className="w-4 h-4 mr-2" />
                    Lien YouTube
                  </label>
                  <input
                    type="url"
                    value={editedSong.youtubeLink}
                    onChange={(e) => handleEditChange('youtubeLink', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              ) : (
                <a
                  href={song.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                >
                  <Youtube className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Voir sur YouTube
                </a>
              )}
            </div>
          )}

          {/* Audio Download */}
          {song.audioUrl && !isEditing && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <button
                onClick={handleDownloadAudio}
                className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
              >
                <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Télécharger l'audio
              </button>
            </div>
          )}

          {/* Audio Upload (Edit Mode) */}
          {isEditing && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="mb-2 text-sm font-semibold text-green-900">
                {song.audioUrl ? '🎵 Remplacer le fichier audio' : '🎵 Ajouter un fichier audio'}
              </div>
              <div className="relative">
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:border-green-500 transition text-sm text-green-700 hover:text-green-800 bg-white">
                  <Upload className="w-5 h-5 mr-2" />
                  {editedSong.audioFile ? editedSong.audioFile.name : 'Choisir un fichier audio'}
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a"
                    onChange={handleAudioFileChange}
                    className="hidden"
                  />
                </label>
                {editedSong.audioFile && (
                  <button
                    type="button"
                    onClick={() => setEditedSong(prev => ({ ...prev, audioFile: null }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
              {song.audioUrl && !editedSong.audioFile && !editedSong.removeAudio && (
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-green-700">
                    ℹ️ Un fichier audio existe déjà. Uploadez un nouveau fichier pour le remplacer.
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditedSong(prev => ({ ...prev, removeAudio: true }))}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm font-medium"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Supprimer le fichier audio
                  </button>
                </div>
              )}
              {editedSong.removeAudio && (
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-red-700 font-medium">
                    ⚠️ Le fichier audio sera supprimé lors de la sauvegarde.
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditedSong(prev => ({ ...prev, removeAudio: false }))}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                  >
                    Annuler la suppression
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PDF Upload Form (Edit Mode) */}
          {isEditing && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center mb-4">
                <div className="bg-orange-600 p-2 rounded-lg mr-3">
                  <FileUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-orange-900">Ajouter Partition / Paroles PDF</h3>
              </div>

              <div className="bg-white rounded-lg p-4 border border-orange-100">
                <div className="space-y-3">
                  {/* Type selector */}
                  <div>
                    <label className="block text-sm font-semibold text-orange-900 mb-2">Type de document</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPdfType('paroles')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                          pdfType === 'paroles'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📝 Paroles
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfType('partition')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                          pdfType === 'partition'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🎼 Partition
                      </button>
                    </div>
                  </div>

                  {/* Instrument field (only for partition) */}
                  {pdfType === 'partition' && (
                    <div>
                      <label className="block text-sm font-semibold text-orange-900 mb-2">Instrument</label>
                      <input
                        type="text"
                        value={pdfInstrument}
                        onChange={(e) => setPdfInstrument(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500"
                        placeholder="Ex: Guitare, Piano, Batterie..."
                      />
                    </div>
                  )}

                  {/* File selector */}
                  <div>
                    <label className="block text-sm font-semibold text-orange-900 mb-2">Fichier PDF</label>
                    <div className="relative">
                      <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:border-orange-500 transition text-sm text-orange-700 hover:text-orange-800 bg-white">
                        <FileUp className="w-5 h-5 mr-2" />
                        {pdfFile ? pdfFile.name : 'Choisir un fichier PDF'}
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfFileChange}
                          className="hidden"
                        />
                      </label>
                      {pdfFile && (
                        <button
                          type="button"
                          onClick={() => setPdfFile(null)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={handleUploadPdf}
                    disabled={!pdfFile || isUploadingPdf}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition shadow-md ${
                      !pdfFile || isUploadingPdf
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {isUploadingPdf ? 'Upload en cours...' : 'Uploader le PDF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chords Section */}
          {(song.chords || isEditing) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-2 rounded-lg mr-3">
                  <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-blue-900">Grille d'Accords</h3>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-inner border border-blue-100">
                {isEditing ? (
                  <textarea
                    value={editedSong.chords}
                    onChange={(e) => handleEditChange('chords', e.target.value)}
                    className="w-full font-mono text-xs sm:text-sm text-gray-800 border-2 border-blue-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 min-h-[200px]"
                    placeholder="Saisissez les accords..."
                  />
                ) : (
                  <pre className="font-mono text-xs sm:text-sm whitespace-pre-wrap overflow-x-auto text-gray-800">
                    {song.chords}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Lyrics Section */}
          {(song.lyrics || isEditing) && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <div className="bg-purple-600 p-2 rounded-lg mr-3">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-purple-900">Paroles</h3>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-inner border border-purple-100 max-h-96 overflow-y-auto">
                {isEditing ? (
                  <textarea
                    value={editedSong.lyrics}
                    onChange={(e) => handleEditChange('lyrics', e.target.value)}
                    className="w-full text-sm sm:text-base text-gray-800 border-2 border-purple-300 rounded-lg p-2 focus:outline-none focus:border-purple-500 min-h-[300px]"
                    placeholder="Saisissez les paroles..."
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm sm:text-base text-gray-800 leading-relaxed">
                    {song.lyrics}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents disponibles (Always visible) */}
          {currentSongPdfs.length > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 sm:p-6 border border-orange-200">
              <div className="flex items-center mb-4">
                <div className="bg-orange-600 p-2 rounded-lg mr-3">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-orange-900">Documents disponibles ({currentSongPdfs.length})</h3>
              </div>

              <div className="space-y-2">
                {currentSongPdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-orange-100 transition border border-orange-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {pdf.type === 'paroles' ? '📝' : '🎼'}
                        </span>
                        <span className="font-semibold text-orange-900 truncate">
                          {pdf.filename}
                        </span>
                      </div>
                      <div className="text-xs text-orange-700">
                        {pdf.type === 'paroles' ? 'Paroles' : 'Partition'}
                        {pdf.instrument && ` - ${pdf.instrument}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => handleViewPdf(pdf)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        title="Visualiser"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(pdf)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePdf(pdf)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No enrichment data message */}
          {!song.chords && !song.lyrics && !song.enriched && (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4">
                <Music2 className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <p className="text-base sm:text-lg font-medium mb-2">Aucune donnée enrichie disponible</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto px-4">
                Ce titre n'a pas encore été enrichi avec l'API Gemini. Les accords et paroles ne sont pas disponibles pour le moment.
              </p>
            </div>
          )}
        </div>

        {/* Footer - Sticky */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center border-t">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 sm:px-6 py-2 rounded-lg font-medium transition shadow-sm hover:shadow-md"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-5 sm:px-6 py-2 rounded-lg font-medium transition shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-6 py-2 rounded-lg font-medium transition shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Éditer
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-5 sm:px-6 py-2 rounded-lg font-medium transition shadow-sm hover:shadow-md"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <PdfViewer
          pdfUrl={viewingPdf.url}
          pdfName={viewingPdf.filename}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </div>
  );
};

export default SongDetails;
