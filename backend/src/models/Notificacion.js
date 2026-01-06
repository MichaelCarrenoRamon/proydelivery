//Notificacion.js
const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: [
      'pedido_nuevo',
      'pedido_confirmado',
      'pedido_preparando',
      'pedido_en_camino',
      'pedido_entregado',
      'pedido_cancelado',
      'calificacion',
      'promocion',
      'sistema'
    ],
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  imagen: String,
  datos: {
    pedidoId: mongoose.Schema.Types.ObjectId,
    restauranteId: mongoose.Schema.Types.ObjectId,
    url: String,
    accion: String
  },
  leida: {
    type: Boolean,
    default: false
  },
  enviada: {
    type: Boolean,
    default: false
  },
  fcmResponse: mongoose.Schema.Types.Mixed
  }, 
  {
  timestamps: true
});

module.exports = mongoose.model('Notificacion', notificacionSchema);