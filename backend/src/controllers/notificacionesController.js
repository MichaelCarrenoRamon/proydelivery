const Notificacion = require('../models/Notificacion');
const { sendPushNotification, sendMulticastNotification } = require('../config/firebase');

// @desc    Obtener notificaciones del usuario
// @route   GET /api/notificaciones
// @access  Private
exports.obtenerNotificaciones = async (req, res) => {
  try {
    const { leida, page = 1, limit = 20 } = req.query;

    const filtro = { usuarioId: req.usuario.id };
    if (leida !== undefined) filtro.leida = leida === 'true';

    const skip = (page - 1) * limit;

    const notificaciones = await Notificacion.find(filtro)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notificacion.countDocuments(filtro);
    const noLeidas = await Notificacion.countDocuments({ 
      usuarioId: req.usuario.id, 
      leida: false 
    });

    res.status(200).json({
      success: true,
      data: notificaciones,
      noLeidas,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

// @desc    Marcar notificación como leída
// @route   PATCH /api/notificaciones/:id/leer
// @access  Private
exports.marcarComoLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: req.params.id, usuarioId: req.usuario.id },
      { leida: true },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: notificacion
    });
  } catch (error) {
    console.error('Error marcando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación',
      error: error.message
    });
  }
};

// @desc    Marcar todas como leídas
// @route   PATCH /api/notificaciones/marcar-todas-leidas
// @access  Private
exports.marcarTodasComoLeidas = async (req, res) => {
  try {
    await Notificacion.updateMany(
      { usuarioId: req.usuario.id, leida: false },
      { leida: true }
    );

    res.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marcando notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificaciones',
      error: error.message
    });
  }
};

// @desc    Enviar notificación push
// @route   POST /api/notificaciones/enviar
// @access  Private/Admin
exports.enviarNotificacion = async (req, res) => {
  try {
    const { usuarioId, titulo, mensaje, tipo, datos } = req.body;

    const usuario = await Usuario.findById(usuarioId);
    
    if (!usuario || !usuario.fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene token FCM configurado'
      });
    }

    // Enviar notificación push
    const response = await sendPushNotification(usuario.fcmToken, {
      title: titulo,
      body: mensaje,
      data: datos || {}
    });

    // Guardar en base de datos
    const notificacion = await Notificacion.create({
      usuarioId,
      tipo: tipo || 'sistema',
      titulo,
      mensaje,
      datos,
      enviada: true,
      fcmResponse: response
    });

    res.status(201).json({
      success: true,
      message: 'Notificación enviada exitosamente',
      data: notificacion
    });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar notificación',
      error: error.message
    });
  }
};