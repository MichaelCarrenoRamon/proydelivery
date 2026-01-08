const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const Restaurante = require('../models/Restaurante');
const Usuario = require('../models/Usuario');
const Notificacion = require('../models/Notificacion');
const { sendPushNotification } = require('../config/firebase');

// @desc    Crear pedido
// @route   POST /api/pedidos
// @access  Private
exports.crearPedido = async (req, res) => {
  try {
    const nuevoPedido = new Pedido(req.body);
    await nuevoPedido.save();
    res.status(201).json(nuevoPedido);
  } catch (error) {
    console.error("DETALLE DEL ERROR:", error); // ESTO TE DIRÁ QUÉ PASA
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener todos los pedidos (Admin)
// @route   GET /api/pedidos
exports.obtenerTodosLosPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      .populate('clienteId', 'nombre email')
      .populate('restauranteId', 'nombre')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pedidos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Obtener pedidos del usuario
// @route   GET /api/pedidos/mis-pedidos
// @access  Private
exports.obtenerMisPedidos = async (req, res) => {
  try {
    const { estado, page = 1, limit = 10 } = req.query;

    const filtro = { clienteId: req.usuario.id };
    if (estado) filtro.estado = estado;

    const skip = (page - 1) * limit;

    const pedidos = await Pedido.find(filtro)
      .populate('restauranteId', 'nombre logo')
      .populate('repartidorId', 'nombre telefono')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Pedido.countDocuments(filtro);

    res.status(200).json({
      success: true,
      data: pedidos,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
};

exports.obtenerPedidosAdmin = async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      .populate('clienteId', 'nombre telefono')
      .populate('restauranteId', 'nombre')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: pedidos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Obtener pedido por ID
// @route   GET /api/pedidos/:id
// @access  Private
exports.obtenerPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('clienteId', 'nombre telefono email avatar')
      .populate('restauranteId', 'nombre logo telefono direccion')
      .populate('repartidorId', 'nombre telefono avatar calificacion')
      .populate('productos.productoId', 'nombre imagen');

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar permisos
    const esCliente = pedido.clienteId._id.toString() === req.usuario.id;
    const esRepartidor = pedido.repartidorId && pedido.repartidorId._id.toString() === req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';
    const esRestaurante = req.usuario.rol === 'restaurante';

    if (!esCliente && !esRepartidor && !esAdmin && !esRestaurante) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este pedido'
      });
    }

    res.status(200).json({
      success: true,
      data: pedido
    });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
      error: error.message
    });
  }
};

// @desc    Actualizar estado del pedido
// @route   PATCH /api/pedidos/:id/estado
// @access  Private/Admin/Restaurante/Repartidor
exports.actualizarEstado = async (req, res) => {
  try {
    const { estado, ubicacion } = req.body;

    const pedido = await Pedido.findById(req.params.id)
      .populate('clienteId', 'nombre fcmToken')
      .populate('restauranteId', 'nombre');

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Validar transiciones de estado
    const transicionesValidas = {
      pendiente: ['confirmado', 'cancelado'],
      confirmado: ['preparando', 'cancelado'],
      preparando: ['listo', 'cancelado'],
      listo: ['en_camino'],
      en_camino: ['entregado', 'cancelado'],
      entregado: [],
      cancelado: []
    };

    if (!transicionesValidas[pedido.estado].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de ${pedido.estado} a ${estado}`
      });
    }

    // Actualizar estado
    pedido.actualizarEstado(estado, ubicacion);
    await pedido.save();

    // Enviar notificación al cliente
    if (pedido.clienteId.fcmToken) {
      const mensajes = {
        confirmado: 'Tu pedido ha sido confirmado',
        preparando: 'Tu pedido está siendo preparado',
        listo: 'Tu pedido está listo',
        en_camino: 'El repartidor va en camino',
        entregado: '¡Tu pedido ha sido entregado!',
        cancelado: 'Tu pedido ha sido cancelado'
      };

      await sendPushNotification(pedido.clienteId.fcmToken, {
        title: `Pedido #${pedido.numeroPedido}`,
        body: mensajes[estado],
        data: {
          tipo: `pedido_${estado}`,
          pedidoId: pedido._id.toString()
        }
      });

      await Notificacion.create({
        usuarioId: pedido.clienteId._id,
        tipo: `pedido_${estado}`,
        titulo: `Pedido #${pedido.numeroPedido}`,
        mensaje: mensajes[estado],
        datos: { pedidoId: pedido._id },
        enviada: true
      });
    }

    res.status(200).json({
      success: true,
      message: `Estado actualizado a ${estado}`,
      data: pedido
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

// @desc    Asignar repartidor a pedido
// @route   PATCH /api/pedidos/:id/asignar-repartidor
// @access  Private/Admin/Restaurante
exports.asignarRepartidor = async (req, res) => {
  try {
    const { repartidorId } = req.body;

    // Verificar repartidor
    const repartidor = await Usuario.findOne({
      _id: repartidorId,
      rol: 'repartidor',
      activo: true,
      disponible: true
    });

    if (!repartidor) {
      return res.status(400).json({
        success: false,
        message: 'Repartidor no disponible'
      });
    }

    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { repartidorId },
      { new: true }
    ).populate('repartidorId', 'nombre telefono');

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Notificar al repartidor
    if (repartidor.fcmToken) {
      await sendPushNotification(repartidor.fcmToken, {
        title: '📦 Nuevo Pedido Asignado',
        body: `Pedido #${pedido.numeroPedido}`,
        data: {
          tipo: 'pedido_asignado',
          pedidoId: pedido._id.toString()
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Repartidor asignado exitosamente',
      data: pedido
    });
  } catch (error) {
    console.error('Error asignando repartidor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar repartidor',
      error: error.message
    });
  }
};

// @desc    Calificar pedido
// @route   POST /api/pedidos/:id/calificar
// @access  Private
exports.calificarPedido = async (req, res) => {
  try {
    const { 
      calificacionRestaurante, 
      comentarioRestaurante,
      calificacionRepartidor,
      comentarioRepartidor 
    } = req.body;

    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que sea el cliente
    if (pedido.clienteId.toString() !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para calificar este pedido'
      });
    }

    // Verificar que el pedido esté entregado
    if (pedido.estado !== 'entregado') {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes calificar pedidos entregados'
      });
    }

    // Verificar que no esté ya calificado
    if (pedido.calificacion && pedido.calificacion.fecha) {
      return res.status(400).json({
        success: false,
        message: 'Este pedido ya ha sido calificado'
      });
    }

    // Guardar calificación
    pedido.calificacion = {
      restaurante: {
        estrellas: calificacionRestaurante,
        comentario: comentarioRestaurante
      },
      repartidor: {
        estrellas: calificacionRepartidor,
        comentario: comentarioRepartidor
      },
      fecha: new Date()
    };

    await pedido.save();

    // Actualizar calificación del restaurante
    const restaurante = await Restaurante.findById(pedido.restauranteId);
    const nuevoTotalRes = restaurante.calificacion.total + 1;
    const nuevoPromedioRes = (
      (restaurante.calificacion.promedio * restaurante.calificacion.total + calificacionRestaurante) / 
      nuevoTotalRes
    );
    
    restaurante.calificacion = {
      promedio: nuevoPromedioRes,
      total: nuevoTotalRes
    };
    await restaurante.save();

    // Actualizar calificación del repartidor
    if (pedido.repartidorId && calificacionRepartidor) {
      const repartidor = await Usuario.findById(pedido.repartidorId);
      const nuevoTotalRep = repartidor.calificacion.total + 1;
      const nuevoPromedioRep = (
        (repartidor.calificacion.promedio * repartidor.calificacion.total + calificacionRepartidor) / 
        nuevoTotalRep
      );
      
      repartidor.calificacion = {
        promedio: nuevoPromedioRep,
        total: nuevoTotalRep
      };
      await repartidor.save();
    }

    res.status(200).json({
      success: true,
      message: 'Calificación guardada exitosamente',
      data: pedido
    });
  } catch (error) {
    console.error('Error calificando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calificar pedido',
      error: error.message
    });
  }
};

// @desc    Cancelar pedido
// @route   PATCH /api/pedidos/:id/cancelar
// @access  Private
exports.cancelarPedido = async (req, res) => {
  try {
    const { motivo } = req.body;

    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Solo se puede cancelar si está en ciertos estados
    if (!['pendiente', 'confirmado', 'preparando'].includes(pedido.estado)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar el pedido en este estado'
      });
    }

    pedido.estado = 'cancelado';
    pedido.motivoCancelacion = motivo;
    pedido.canceladoPor = {
      tipo: req.usuario.rol === 'cliente' ? 'cliente' : 'restaurante',
      id: req.usuario.id,
      motivo
    };

    await pedido.save();

    // Restaurar stock de productos
    for (const item of pedido.productos) {
      const producto = await Producto.findById(item.productoId);
      if (producto && producto.stock !== null) {
        producto.stock += item.cantidad;
        producto.vendidos -= item.cantidad;
        await producto.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      data: pedido
    });
  } catch (error) {
    console.error('Error cancelando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar pedido',
      error: error.message
    });
  }
};

// @desc    Obtener pedidos del restaurante
// @route   GET /api/pedidos/restaurante/:restauranteId
// @access  Private/Admin/Restaurante
exports.obtenerPedidosRestaurante = async (req, res) => {
  try {
    const { estado, fecha, page = 1, limit = 20 } = req.query;

    const filtro = { restauranteId: req.params.restauranteId };
    
    if (estado) filtro.estado = estado;
    
    if (fecha) {
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);
      
      filtro.createdAt = { $gte: inicio, $lte: fin };
    }

    const skip = (page - 1) * limit;
    const pedidos = await Pedido.find(filtro)
        .populate('clienteId', 'nombre telefono')
        .populate('repartidorId', 'nombre telefono')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Pedido.countDocuments(filtro);

    res.status(200).json({
    success: true,
    data: pedidos,
    pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
    }
    });

    } catch (error) {
    console.error('Error obteniendo pedidos del restaurante:', error);
    res.status(500).json({
    success: false,
    message: 'Error al obtener pedidos',
    error: error.message
    });
    }
    };

    // @desc    Obtener estadísticas de pedidos
    // @route   GET /api/pedidos/estadisticas
    // @access  Private/Admin
    
exports.obtenerEstadisticas = async (req, res) => {
    try {
    const { fechaInicio, fechaFin } = req.query;
    const filtro = {};

if (fechaInicio && fechaFin) {
  filtro.createdAt = {
    $gte: new Date(fechaInicio),
    $lte: new Date(fechaFin)
  };
}

const estadisticas = await Pedido.aggregate([
  { $match: filtro },
  {
    $group: {
      _id: null,
      totalPedidos: { $sum: 1 },
      totalVentas: { $sum: '$total' },
      promedioVenta: { $avg: '$total' },
      pedidosPorEstado: {
        $push: '$estado'
      }
    }
  }
]);

const pedidosPorEstado = await Pedido.aggregate([
  { $match: filtro },
  {
    $group: {
      _id: '$estado',
      cantidad: { $sum: 1 }
    }
  }
]);

res.status(200).json({
  success: true,
  data: {
    general: estadisticas[0] || {},
    porEstado: pedidosPorEstado
  }
});
} catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
    success: false,
    message: 'Error al obtener estadísticas',
    error: error.message
    });
    }
};