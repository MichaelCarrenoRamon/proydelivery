const mongoose = require('mongoose');

const restauranteSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'El nombre es requerido'], trim: true },
  descripcion: { type: String, required: [true, 'La descripción es requerida'] },
  logo: {
    url: { type: String, required: true },
    publicId: String
  },
  banner: {
    url: String,
    publicId: String
  },
  categorias: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria' // Referencia para el populate
  }],
  direccion: {
    calle: { type: String, required: true },
    ciudad: String,
    provincia: String,
    referencia: String,
    ubicacion: {
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: { type: [Number], required: true } // [Longitud, Latitud]
    }
  },
  telefono: { type: String, required: true },
  email: String,
  horarios: [{
    dia: { type: String, enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] },
    apertura: String,
    cierre: String,
    cerrado: { type: Boolean, default: false }
  }],
  tiempoEntregaMin: { type: Number, default: 25 },
  tiempoEntregaMax: { type: Number, default: 40 },
  costoEnvio: { type: Number, default: 1.5 },
  montoMinimoPedido: { type: Number, default: 5 },
  calificacion: {
    promedio: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  totalPedidos: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
  abierto: { type: Boolean, default: false },
  destacado: { type: Boolean, default: false },
  propietarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
}, { timestamps: true });

// Índices para búsqueda geográfica y de texto
restauranteSchema.index({ 'direccion.ubicacion': '2dsphere' });
restauranteSchema.index({ nombre: 'text', descripcion: 'text' });

module.exports = mongoose.model('Restaurante', restauranteSchema);