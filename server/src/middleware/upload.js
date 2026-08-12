const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// ── PDF Upload via Cloudinary ─────────────────────────────────────────────────
const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'university-notices/pdfs',
    resource_type: 'raw',
    allowed_formats: ['pdf'],
    // Use original filename (sanitized)
    public_id: (req, file) => {
      const name = file.originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-');
      return `${name}-${Date.now()}`;
    },
  },
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const uploadPDF = multer({
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single('pdf');

// ── Excel Upload via Memory Storage (for Admin import) ────────────────────────
const excelStorage = multer.memoryStorage();

const excelFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed'), false);
  }
};

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: excelFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('file');

module.exports = { uploadPDF, uploadExcel };
