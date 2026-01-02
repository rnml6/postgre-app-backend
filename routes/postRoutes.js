import express from 'express';
import multer from 'multer';
import { uploadPost, getAllPosts } from '../controllers/postController.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/new', upload.array('images'), uploadPost);

router.get('/all', getAllPosts);

export default router;