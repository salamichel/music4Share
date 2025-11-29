const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for React app
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Dossier uploads créé');
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use songId from request body + original extension
    const songId = req.body.songId || Date.now().toString();
    const ext = path.extname(file.originalname);
    cb(null, `${songId}${ext}`);
  }
});

// File filter - only accept audio files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez MP3, WAV, OGG ou M4A.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Upload audio file
app.post('/api/upload/audio', upload.single('audioFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileUrl = `/api/audio/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Fichier uploadé avec succès',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });

    console.log(`✅ Fichier uploadé: ${req.file.filename} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
  }
});

// Serve audio files
app.get('/api/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }

  res.sendFile(filePath);
});

// Delete audio file
app.delete('/api/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Fichier supprimé avec succès' });
    console.log(`🗑️ Fichier supprimé: ${filename}`);
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du fichier' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux. Taille maximale: 50MB' });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: error.message || 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📁 Dossier uploads: ${uploadsDir}`);
});
