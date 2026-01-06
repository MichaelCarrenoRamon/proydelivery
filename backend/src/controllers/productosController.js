const Producto = require('../models/Producto');
const Restaurante = require('../models/Restaurante');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// @desc    Obtener todos los productos de un restaurante
// @route   GET /api/productos/restaurante/:restauranteId
// @access  Public
exports.obtenerProductosPorRestaurante = async (req, res) => {
  try {
    const { restauranteId } = req.params;
    const { 
      categoria, 
      disponible, 
      destacado,
      buscar,
      precioMin,
      precioMax,
      vegetariano,
      vegano,
      sinGluten,
      page = 1,
      limit = 20
    } = req.query;

    const filtro = { restauranteId };
    
    if (categoria) filtro.categoria = categoria;
    if (disponible !== undefined) filtro.disponible = disponible === 'true';
    if (destacado !== undefined) filtro.destacado = destacado === 'true';
    if (vegetariano !== undefined) filtro.vegetariano = vegetariano === 'true';
    if (vegano !== undefined) filtro.vegano = vegano === 'true';
    if (sinGluten !== undefined) filtro.sinGluten = sinGluten === 'true';
    
    if (buscar) {
      filtro.$text = { $search: buscar };
    }

    if (precioMin || precioMax) {
      filtro.precio = {};
      if (precioMin) filtro.precio.$gte = parseFloat(precioMin);
      if (precioMax) filtro.precio.$lte = parseFloat(precioMax);
    }

    const skip = (page - 1) * limit;

    const productos = await Producto.find(filtro)
      .sort({ destacado: -1, orden: 1, nombre: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Producto.countDocuments(filtro);

    res.status(200).json({
      success: true,
      data: productos,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// @desc    Obtener producto por ID
// @route   GET /api/productos/:id
// @access  Public
exports.obtenerProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('restauranteId', 'nombre logo direccion');

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: producto
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

// @desc    Crear producto
// @route   POST /api/productos
// @access  Private/Admin/Restaurante
exports.crearProducto = async (req, res) => {
  try {
    const { restauranteId } = req.body;

    // Verificar que el restaurante existe
    const restaurante = await Restaurante.findById(restauranteId);
    if (!restaurante) {
      return res.status(404).json({
        success: false,
        message: 'Restaurante no encontrado'
      });
    }

    // Verificar permisos
    if (req.usuario.rol === 'restaurante' && 
        restaurante.propietarioId.toString() !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para agregar productos a este restaurante'
      });
    }

    const producto = await Producto.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: producto
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// @desc    Actualizar producto
// @route   PUT /api/productos/:id
// @access  Private/Admin/Restaurante
exports.actualizarProducto = async (req, res) => {
  try {
    let producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar permisos
    if (req.usuario.rol === 'restaurante') {
      const restaurante = await Restaurante.findById(producto.restauranteId);
      if (restaurante.propietarioId.toString() !== req.usuario.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar este producto'
        });
      }
    }

    producto = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: producto
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// @desc    Eliminar producto
// @route   DELETE /api/productos/:id
// @access  Private/Admin/Restaurante
exports.eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar permisos
    if (req.usuario.rol === 'restaurante') {
      const restaurante = await Restaurante.findById(producto.restauranteId);
      if (restaurante.propietarioId.toString() !== req.usuario.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar este producto'
        });
      }
    }

    // Eliminar imagen de Cloudinary
    if (producto.imagen.publicId) {
      await deleteImage(producto.imagen.publicId);
    }

    // Eliminar imágenes adicionales
    if (producto.imagenes && producto.imagenes.length > 0) {
      for (const img of producto.imagenes) {
        if (img.publicId) {
          await deleteImage(img.publicId);
        }
      }
    }

    await producto.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// @desc    Actualizar disponibilidad de producto
// @route   PATCH /api/productos/:id/disponibilidad
// @access  Private/Admin/Restaurante
exports.actualizarDisponibilidad = async (req, res) => {
  try {
    const { disponible } = req.body;

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { disponible },
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: `Producto ${disponible ? 'disponible' : 'no disponible'}`,
      data: producto
    });
  } catch (error) {
    console.error('Error actualizando disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar disponibilidad',
      error: error.message
    });
  }
};

// @desc    Buscar productos globalmente
// @route   GET /api/productos/buscar
// @access  Public
exports.buscarProductos = async (req, res) => {
  try {
    const { q, latitud, longitud, radio = 10000 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
    }

    // Buscar productos
    const productos = await Producto.find({
      $text: { $search: q },
      disponible: true
    })
    .populate({
      path: 'restauranteId',
      select: 'nombre logo direccion activo abierto',
      match: { activo: true, abierto: true }
    })
    .limit(20);

    // Filtrar productos donde el restaurante existe y está activo
    const productosValidos = productos.filter(p => p.restauranteId);

    res.status(200).json({
      success: true,
      data: productosValidos
    });
  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar productos',
      error: error.message
    });
  }
};