//categorias.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validarCampos } = require('../middleware/validator.middleware');
const { proteger } = require('../middleware/auth.middleware');
const { autorizarRoles } = require('../middleware/roles.middleware');
const {
  obtenerCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} = require('../controllers/categoriasController');

// Validaciones
const validacionCategoria = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido'),
  validarCampos
];

// Rutas públicas
router.get('/', obtenerCategorias);
router.get('/:id', obtenerCategoria);

// Rutas protegidas - Admin
router.post('/', proteger, autorizarRoles('admin'), validacionCategoria, crearCategoria);
router.put('/:id', proteger, autorizarRoles('admin'), actualizarCategoria);
router.delete('/:id', proteger, autorizarRoles('admin'), eliminarCategoria);

module.exports = router;