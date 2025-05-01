const express = require('express')
import authMiddlewear from '../middlewear/authMiddlewear';
const { createPS, evaluatePS, getAllPS } = require('../controllers/psController')
const router = express.Router();

router.post('/PSsubmit', authMiddlewear, createPS)
router.post("/evaluatePS", authMiddlewear, evaluatePS);
router.get("/getPs", authMiddlewear, getAllPS)
export default router;