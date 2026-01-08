const Restaurante = require('../models/Restaurante');
const Categoria = require('../models/Categoria'); // Asegúrate de tener este modelo

// Listar todos los restaurantes
exports.obtenerRestaurantes = async (req, res) => {
    try {
        const restaurantes = await Restaurante.find().populate('categorias');
        res.status(200).json({ success: true, data: restaurantes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Obtener un restaurante por ID
exports.obtenerRestaurante = async (req, res) => {
    try {
        const restaurante = await Restaurante.findById(req.params.id).populate('categorias');
        if (!restaurante) return res.status(404).json({ success: false, message: 'No encontrado' });
        res.status(200).json({ success: true, data: restaurante });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.crearRestaurante = async (req, res) => {
    try {
        const nuevoRestaurante = await Restaurante.create(req.body);
        res.status(201).json({ success: true, data: nuevoRestaurante });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.actualizarRestaurante = async (req, res) => {
    try {
        const restaurante = await Restaurante.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: restaurante });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// IMPORTANTE: Esta es la función que probablemente te falta o está mal nombrada
exports.obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find();
        res.status(200).json({ success: true, data: categorias });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};