const Categoria = require('../models/Categoria');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// @desc    Obtener todas las categorías
// @route   GET /api/categorias
// @access  Public
exports.obtenerCategorias = async (req, res) => {
  try {
    const { activo } = req.query;
    
    const filtro = {};
    if (activo !== undefined) filtro.activo = activo === 'true';

    const categorias = await Categoria.find(filtro).sort({ orden: 1, nombre: 1 });

    res.status(200).json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
};

// @desc    Obtener categoría por ID
// @route   GET /api/categorias/:id
// @access  Public
exports.obtenerCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    });
  }
};

// @desc    Crear categoría
// @route   POST /api/categorias
// @access  Private/Admin
exports.crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, icono, color, orden } = req.body;

    // Verificar si ya existe
    const categoriaExiste = await Categoria.findOne({ nombre });
    if (categoriaExiste) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const categoria = await Categoria.create({
      nombre,
      descripcion,
      icono,
      color,
      orden
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: categoria
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
};

// @desc    Actualizar categoría
// @route   PUT /api/categorias/:id
// @access  Private/Admin
exports.actualizarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: categoria
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    });
  }
};

// @desc    Eliminar categoría
// @route   DELETE /api/categorias/:id
// @access  Private/Admin
exports.eliminarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    await categoria.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message
    });
  }
};