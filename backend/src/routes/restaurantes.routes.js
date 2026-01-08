const { Router } = require('express');
const router = Router();
const restauranteCtrl = require('../controllers/restaurantesController');

// Rutas base
router.route('/')
    .get(restauranteCtrl.obtenerRestaurantes) // Verifica que este nombre coincida
    .post(restauranteCtrl.crearRestaurante);

// Ruta para categorías (Usada por el formulario de Angular)
router.get('/categorias', restauranteCtrl.obtenerCategorias); 

router.route('/:id')
    .get(restauranteCtrl.obtenerRestaurante)
    .put(restauranteCtrl.actualizarRestaurante);

module.exports = router;