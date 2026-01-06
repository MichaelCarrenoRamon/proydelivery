const express = require('express');
const router = express.Router();
const { registro, login, obtenerPerfil, actualizarPerfil, logout } = require('../controllers/authController');
const { proteger } = require('../middleware/auth.middleware');

router.post('/registro', registro);
router.post('/login', login);
router.get('/me', proteger, obtenerPerfil);
router.put('/perfil', proteger, actualizarPerfil);
router.post('/logout', proteger, logout);

module.exports = router;