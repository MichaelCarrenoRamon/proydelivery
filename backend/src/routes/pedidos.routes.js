//pedidos.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validarCampos } = require('../middleware/validator.middleware');
const { proteger } = require('../middleware/auth.middleware');
const { autorizarRoles } = require('../middleware/roles.middleware');
const {
  crearPedido,
  obtenerMisPedidos,
  obtenerPedido,
  actualizarEstado,
  asignarRepartidor,
  calificarPedido,
  cancelarPedido,
  obtenerPedidosRestaurante,
  obtenerEstadisticas,
  obtenerTodosLosPedidos
} = require('../controllers/pedidosController');

// Validaciones
const validacionCrearPedido = [
  body('restauranteId')
    .notEmpty().withMessage('El restaurante es requerido')
    .isMongoId().withMessage('ID de restaurante inválido'),
  body('productos')
    .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('productos.*.productoId')
    .isMongoId().withMessage('ID de producto inválido'),
  body('productos.*.cantidad')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
  body('direccionEntrega.nombre')
    .notEmpty().withMessage('El nombre de la dirección es requerido'),
  body('direccionEntrega.calle')
    .notEmpty().withMessage('La dirección es requerida'),
  body('direccionEntrega.latitud')
    .isFloat().withMessage('Latitud inválida'),
  body('direccionEntrega.longitud')
    .isFloat().withMessage('Longitud inválida'),
  body('metodoPago.tipo')
    .isIn(['efectivo', 'tarjeta', 'transferencia'])
    .withMessage('Método de pago inválido'),
  validarCampos
];

const validacionActualizarEstado = [
  body('estado')
    .isIn(['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado'])
    .withMessage('Estado inválido'),
  validarCampos
];

const validacionCalificar = [
  body('calificacionRestaurante')
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación del restaurante debe ser entre 1 y 5'),
  body('calificacionRepartidor')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación del repartidor debe ser entre 1 y 5'),
  validarCampos
];

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================

// 1. Rutas de creación y listas personales
router.post('/', proteger, validacionCrearPedido, crearPedido);
router.get('/mis-pedidos', proteger, obtenerMisPedidos);

// 2. Rutas Administrativas y Estadísticas 
// IMPORTANTE: Van ANTES de las rutas con :id para evitar conflictos de CastError
router.get('/estadisticas', proteger, autorizarRoles('admin'), obtenerEstadisticas);
router.get('/todos', proteger, autorizarRoles('admin'), obtenerTodosLosPedidos);

// 3. Rutas de Restaurante
router.get('/restaurante/:restauranteId', proteger, autorizarRoles('admin', 'restaurante'), obtenerPedidosRestaurante);

// 4. Rutas con :id (Van al FINAL de los GET)
// Si pusieras /estadisticas debajo de esta, Express pensaría que "estadisticas" es un ID.
router.get('/:id', proteger, obtenerPedido);

// 5. Rutas de actualización (PATCH/POST con ID)
router.patch('/:id/estado', proteger, autorizarRoles('admin', 'restaurante', 'repartidor'), validacionActualizarEstado, actualizarEstado);
router.patch('/:id/asignar-repartidor', proteger, autorizarRoles('admin', 'restaurante'), [
  body('repartidorId').isMongoId().withMessage('ID de repartidor inválido'),
  validarCampos
], asignarRepartidor);

router.post('/:id/calificar', proteger, validacionCalificar, calificarPedido);
router.patch('/:id/cancelar', proteger, [
  body('motivo').notEmpty().withMessage('El motivo de cancelación es requerido'),
  validarCampos
], cancelarPedido);

module.exports = router;