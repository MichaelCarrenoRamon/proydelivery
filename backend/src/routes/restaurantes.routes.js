//restaurantes.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validarCampos } = require('../middleware/validator.middleware');
const { proteger } = require('../middleware/auth.middleware');
const { autorizarRoles } = require('../middleware/roles.middleware');
const {
  obtenerRestaurantes,
  obtenerRestaurante,
  crearRestaurante,
  actualizarRestaurante,
  eliminarRestaurante,
  actualizarEstado
} = require('../controllers/restaurantesController');

// Validaciones
const validacionRestaurante = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido'),
  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es requerida'),
  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es requerido'),
  body('direccion.calle')
    .trim()
    .notEmpty().withMessage('La dirección es requerida'),
  body('direccion.ubicacion.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Las coordenadas son inválidas'),
  validarCampos
];

// Rutas públicas
router.get('/', obtenerRestaurantes);
router.get('/:id', obtenerRestaurante);

// Rutas protegidas - Admin
router.post('/', proteger, autorizarRoles('admin', 'restaurante'), validacionRestaurante, crearRestaurante);
router.put('/:id', proteger, autorizarRoles('admin', 'restaurante'), actualizarRestaurante);
router.delete('/:id', proteger, autorizarRoles('admin'), eliminarRestaurante);

// Actualizar estado (abierto/cerrado)
router.patch('/:id/estado', proteger, autorizarRoles('admin', 'restaurante'), [
  body('abierto').isBoolean().withMessage('El estado debe ser true o false'),
  validarCampos
], actualizarEstado);

module.exports = router;