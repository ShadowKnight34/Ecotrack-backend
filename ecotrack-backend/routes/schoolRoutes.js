const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');

router.get('/', schoolController.getSchools);

module.exports = router;
