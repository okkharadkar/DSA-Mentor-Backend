
const express = require('express')
import authMiddlewear from '../middlewear/authMiddlewear';
const { signup, signin, profile } = require('../controllers/authController')
const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/profile', authMiddlewear, profile)
export default router;
// module.exports = router
