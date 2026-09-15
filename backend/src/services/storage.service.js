/**
 * File Storage Service
 * Handles file uploads, storage, and retrieval
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { File: FileModel } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { serialize } = require('../utils/serialize');
const { logger } = require('../utils/logger');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024,
  },
});

const getFileType = (mimeType) => {
  if (mimeType.startsWith('audio/')) {return 'audio';}
  if (mimeType.startsWith('image/')) {return 'image';}
  if (mimeType.startsWith('video/')) {return 'video';}
  if (mimeType === 'application/pdf') {return 'document';}
  return 'other';
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const file = await FileModel.create({
      user_id: req.user.id,
      original_name: req.file.originalname,
      url: fileUrl,
      type: getFileType(req.file.mimetype),
      mime_type: req.file.mimetype,
      size: req.file.size,
      storage_key: req.file.filename,
      is_public: req.body.is_public === 'true',
    });

    logger.info(`File uploaded by user ${req.user.id}: ${req.file.originalname}`);

    res.status(201).json({ success: true, data: { file: serialize(file) } });
  } catch (error) {
    next(error);
  }
};

const getFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const filter = { user_id: userId };
    if (type) {filter.type = type;}

    const [files, total] = await Promise.all([
      FileModel.find(filter)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limitNumber)
        .lean(),
      FileModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        files: serialize(files),
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const file = await FileModel.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    }).lean();

    if (!file) {
      throw new NotFoundError('File');
    }

    const filePath = path.join(UPLOAD_DIR, file.storage_key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await FileModel.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadFile,
  getFiles,
  deleteFile,
};
