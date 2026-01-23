import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Trash2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const MediaUploadView = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch existing media on mount
  useEffect(() => {
    fetchUploadedMedia();
  }, []);

  const fetchUploadedMedia = async () => {
    setLoading(true);
    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${serverUrl}/api/media`);
      const data = await response.json();

      if (data.success) {
        setUploadedMedia(data.files);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des médias:', error);
      toast.error('Impossible de charger les médias');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'
    ];

    const newFiles = Array.from(fileList).filter(file => {
      if (!validTypes.includes(file.type)) {
        toast.error(`Format non supporté: ${file.name}`);
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`Fichier trop volumineux (max 100MB): ${file.name}`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...newFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }))]);
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.warning('Aucun fichier à uploader');
      return;
    }

    setUploading(true);
    const formData = new FormData();

    files.forEach(({ file }) => {
      formData.append('mediaFiles', file);
    });

    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${serverUrl}/api/upload/media`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${data.files.length} fichier(s) uploadé(s) avec succès!`);

        // Clear files and previews
        files.forEach(({ preview }) => {
          if (preview) URL.revokeObjectURL(preview);
        });
        setFiles([]);

        // Refresh media list
        fetchUploadedMedia();
      } else {
        toast.error(data.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors de l\'upload des fichiers');
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (filename) => {
    if (!window.confirm('Supprimer ce fichier?')) return;

    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${serverUrl}/api/media/${filename}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Fichier supprimé');
        fetchUploadedMedia();
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const downloadMedia = (url, filename) => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
    const fullUrl = `${serverUrl}${url}`;

    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = filename;
    a.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-700 mb-2">
            📸 Upload de Médias
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Glissez-déposez vos photos et vidéos ici ou cliquez pour sélectionner
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 md:p-12 mb-6 text-center transition-all
            ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white'}
            ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-purple-400'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileInput}
            className="hidden"
          />

          <Upload className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 ${dragActive ? 'text-purple-500' : 'text-gray-400'}`} />

          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-700">
            {dragActive ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos médias'}
          </h3>

          <p className="text-sm md:text-base text-gray-500 mb-4">
            ou cliquez pour parcourir vos fichiers
          </p>

          <p className="text-xs md:text-sm text-gray-400">
            Formats acceptés: JPG, PNG, GIF, WebP, HEIC, MP4, MOV, AVI, WebM, MKV (max 100MB)
          </p>
        </div>

        {/* Files to Upload */}
        {files.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Fichiers à uploader ({files.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    files.forEach(({ preview }) => {
                      if (preview) URL.revokeObjectURL(preview);
                    });
                    setFiles([]);
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Tout effacer
                </button>
                <button
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Uploader tout
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {item.type === 'image' ? (
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <p className="mt-1 text-xs text-gray-600 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Media Library */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">
              Médiathèque ({uploadedMedia.length})
            </h3>
            <button
              onClick={fetchUploadedMedia}
              disabled={loading}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded"
              title="Actualiser"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              Chargement...
            </div>
          ) : uploadedMedia.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              Aucun média uploadé pour le moment
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {uploadedMedia.map((media) => {
                const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
                const fullUrl = `${serverUrl}${media.url}`;

                return (
                  <div key={media.filename} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {media.type === 'image' ? (
                        <img
                          src={fullUrl}
                          alt={media.filename}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                          onClick={() => window.open(fullUrl, '_blank')}
                          loading="lazy"
                        />
                      ) : (
                        <video
                          src={fullUrl}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                          onClick={() => window.open(fullUrl, '_blank')}
                        />
                      )}
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadMedia(media.url, media.filename)}
                        className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMedia(media.filename)}
                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">
                        {media.type === 'image' ? '📷' : '🎥'} {formatFileSize(media.size)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaUploadView;
