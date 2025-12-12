const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for React app
// Allow both localhost (development) and production domain
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://music4chalemine.moka-web.net',
  'http://music4chalemine.moka-web.net'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Origin non autorisé: ${origin}`);
      callback(null, true); // En développement, on autorise quand même
      // En production, utilisez: callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Dossier uploads créé');
}

// Create PDF uploads directory
const pdfUploadsDir = path.join(__dirname, 'uploads', 'pdf');
if (!fs.existsSync(pdfUploadsDir)) {
  fs.mkdirSync(pdfUploadsDir, { recursive: true });
  console.log('✅ Dossier uploads/pdf créé');
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

// Configure multer for PDF storage
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pdfUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: songId_pdfId_timestamp.pdf
    const pdfId = req.body.pdfId || Date.now().toString();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.songId}_${pdfId}_${timestamp}${ext}`);
  }
});

// File filter - only accept PDF files
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez uniquement des fichiers PDF.'), false);
  }
};

const pdfUpload = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB max for PDFs
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

// ========== PDF ROUTES ==========

// Upload PDF file
app.post('/api/upload/pdf', pdfUpload.single('pdfFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier PDF fourni' });
    }

    const fileUrl = `/api/pdf/${req.file.filename}`;

    res.json({
      success: true,
      message: 'PDF uploadé avec succès',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });

    console.log(`✅ PDF uploadé: ${req.file.filename} (${(req.file.size / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error('Erreur lors de l\'upload du PDF:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du fichier PDF' });
  }
});

// Serve PDF files
app.get('/api/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(pdfUploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF non trouvé' });
  }

  // Set headers for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filePath);
});

// Delete PDF file
app.delete('/api/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(pdfUploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF non trouvé' });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'PDF supprimé avec succès' });
    console.log(`🗑️ PDF supprimé: ${filename}`);
  } catch (error) {
    console.error('Erreur lors de la suppression du PDF:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du fichier PDF' });
  }
});

// Serve React static files (production build)
const buildPath = path.join(__dirname, '../build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  // All non-API routes go to React app (must be after API routes)
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });

  console.log('📦 Serving React app from build folder');
} else {
  console.log('⚠️ Build folder not found. In production, run "npm run build" first.');
}

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
  console.log(`🌐 Application accessible sur http://localhost:${PORT}`);
});
