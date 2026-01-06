//notificaciones.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validarCampos } = require('../middleware/validator.middleware');
const { proteger } = require('../middleware/auth.middleware');
const { autorizarRoles } = require('../middleware/roles.middleware');
const {
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  enviarNotificacion
} = require('../controllers/notificacionesController');

// Rutas protegidas
router.get('/', proteger, obtenerNotificaciones);
router.patch('/:id/leer', proteger, marcarComoLeida);
router.patch('/marcar-todas-leidas', proteger, marcarTodasComoLeidas);

// Admin - Enviar notificación manual
router.post('/enviar', proteger, autorizarRoles('admin'), [
  body('usuarioId').isMongoId().withMessage('ID de usuario inválido'),
  body('titulo').notEmpty().withMessage('El título es requerido'),
  body('mensaje').notEmpty().withMessage('El mensaje es requerido'),
  validarCampos
], enviarNotificacion);

module.exports = router;