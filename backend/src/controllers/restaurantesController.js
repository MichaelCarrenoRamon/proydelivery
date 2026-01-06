const Restaurante = require('../models/Restaurante');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// @desc    Obtener todos los restaurantes
// @route   GET /api/restaurantes
// @access  Public
exports.obtenerRestaurantes = async (req, res) => {
  try {
    const { 
      categoria, 
      activo, 
      abierto, 
      destacado,
      buscar,
      latitud,
      longitud,
      radio = 10000, // 10km por defecto
      page = 1,
      limit = 10
    } = req.query;

    const filtro = {};
    
    if (categoria) filtro.categorias = categoria;
    if (activo !== undefined) filtro.activo = activo === 'true';
    if (abierto !== undefined) filtro.abierto = abierto === 'true';
    if (destacado !== undefined) filtro.destacado = destacado === 'true';
    
    // Búsqueda por texto
    if (buscar) {
      filtro.$text = { $search: buscar };
    }

    // Búsqueda por ubicación
    if (latitud && longitud) {
      filtro['direccion.ubicacion'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitud), parseFloat(latitud)]
          },
          $maxDistance: parseInt(radio)
        }
      };
    }

    const skip = (page - 1) * limit;

    const restaurantes = await Restaurante.find(filtro)
      .populate('categorias', 'nombre icono')
      .sort({ destacado: -1, 'calificacion.promedio': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Restaurante.countDocuments(filtro);

    res.status(200).json({
      success: true,
      data: restaurantes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo restaurantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener restaurantes',
      error: error.message
    });
  }
};

// @desc    Obtener restaurante por ID
// @route   GET /api/restaurantes/:id
// @access  Public
exports.obtenerRestaurante = async (req, res) => {
  try {
    const restaurante = await Restaurante.findById(req.params.id)
      .populate('categorias', 'nombre icono color');

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        message: 'Restaurante no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurante
    });
  } catch (error) {
    console.error('Error obteniendo restaurante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener restaurante',
      error: error.message
    });
  }
};

// @desc    Crear restaurante
// @route   POST /api/restaurantes
// @access  Private/Admin
exports.crearRestaurante = async (req, res) => {
  try {
    // Agregar propietario
    req.body.propietarioId = req.usuario.id;

    const restaurante = await Restaurante.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Restaurante creado exitosamente',
      data: restaurante
    });
  } catch (error) {
    console.error('Error creando restaurante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear restaurante',
      error: error.message
    });
  }
};

// @desc    Actualizar restaurante
// @route   PUT /api/restaurantes/:id
// @access  Private/Admin
exports.actualizarRestaurante = async (req, res) => {
  try {
    const restaurante = await Restaurante.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        message: 'Restaurante no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Restaurante actualizado exitosamente',
      data: restaurante
    });
  } catch (error) {
    console.error('Error actualizando restaurante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar restaurante',
      error: error.message
    });
  }
};

// @desc    Eliminar restaurante
// @route   DELETE /api/restaurantes/:id
// @access  Private/Admin
exports.eliminarRestaurante = async (req, res) => {
  try {
    const restaurante = await Restaurante.findById(req.params.id);

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        message: 'Restaurante no encontrado'
      });
    }

    // Eliminar imágenes de Cloudinary
    if (restaurante.logo.publicId) {
      await deleteImage(restaurante.logo.publicId);
    }
    if (restaurante.banner.publicId) {
      await deleteImage(restaurante.banner.publicId);
    }

    await restaurante.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Restaurante eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando restaurante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar restaurante',
      error: error.message
    });
  }
};

// @desc    Actualizar estado abierto/cerrado
// @route   PATCH /api/restaurantes/:id/estado
// @access  Private/Admin/Restaurante
exports.actualizarEstado = async (req, res) => {
  try {
    const { abierto } = req.body;

    const restaurante = await Restaurante.findByIdAndUpdate(
      req.params.id,
      { abierto },
      { new: true }
    );

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        message: 'Restaurante no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: `Restaurante ${abierto ? 'abierto' : 'cerrado'} exitosamente`,
      data: restaurante
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};