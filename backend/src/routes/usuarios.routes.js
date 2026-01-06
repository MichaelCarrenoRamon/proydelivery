const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validarCampos } = require('../middleware/validator.middleware');
const { proteger } = require('../middleware/auth.middleware');
const { autorizarRoles } = require('../middleware/roles.middleware');

// Importamos todas las funciones del controlador
const {
  login,
  registro,
  obtenerUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  agregarDireccion,
  actualizarUbicacion,
  obtenerRepartidoresDisponibles
} = require('../controllers/usuariosController');

// --- RUTAS PÚBLICAS ---
router.post('/login', login);
router.post('/registro', registro);

// --- RUTAS PROTEGIDAS - ADMIN ---
router.post('/', proteger, autorizarRoles('admin'), crearUsuario);
router.get('/', proteger, autorizarRoles('admin'), obtenerUsuarios);
router.get('/:id', proteger, autorizarRoles('admin'), obtenerUsuario);
router.put('/:id', proteger, autorizarRoles('admin'), actualizarUsuario);
router.delete('/:id', proteger, autorizarRoles('admin'), eliminarUsuario);

// --- RUTAS PROTEGIDAS - USUARIO ---
router.post('/direcciones', proteger, [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('direccion').notEmpty().withMessage('La dirección es requerida'),
  validarCampos
], agregarDireccion);

router.put('/ubicacion', proteger, actualizarUbicacion);
router.get('/repartidores-disponibles', proteger, obtenerRepartidoresDisponibles);

module.exports = router;