//productos.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validarCampos } = require('../middleware/validator.middleware');
const { proteger } = require('../middleware/auth.middleware');
const { autorizarRoles } = require('../middleware/roles.middleware');
const {
  obtenerProductosPorRestaurante,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  actualizarDisponibilidad,
  buscarProductos
} = require('../controllers/productosController');

// Validaciones
const validacionProducto = [
  body('restauranteId')
    .notEmpty().withMessage('El restaurante es requerido')
    .isMongoId().withMessage('ID de restaurante inválido'),
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido'),
  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es requerida'),
  body('precio')
    .isFloat({ min: 0 }).withMessage('El precio debe ser mayor a 0'),
  body('categoria')
    .trim()
    .notEmpty().withMessage('La categoría es requerida'),
  validarCampos
];

// Rutas públicas
router.get('/restaurante/:restauranteId', obtenerProductosPorRestaurante);
router.get('/buscar', buscarProductos);
router.get('/:id', obtenerProducto);

// Rutas protegidas
router.post('/', proteger, autorizarRoles('admin', 'restaurante'), validacionProducto, crearProducto);
router.put('/:id', proteger, autorizarRoles('admin', 'restaurante'), actualizarProducto);
router.delete('/:id', proteger, autorizarRoles('admin', 'restaurante'), eliminarProducto);

router.patch('/:id/disponibilidad', proteger, autorizarRoles('admin', 'restaurante'), [
  body('disponible').isBoolean().withMessage('Disponibilidad debe ser true o false'),
  validarCampos
], actualizarDisponibilidad);

module.exports = router;