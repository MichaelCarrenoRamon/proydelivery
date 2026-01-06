//Restaurante.js
const mongoose = require('mongoose');

const restauranteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es requerida']
  },
  logo: {
    url: {
      type: String,
      required: true
    },
    publicId: String
  },
  banner: {
    url: String,
    publicId: String
  },
  categorias: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria'
  }],
  direccion: {
    calle: {
      type: String,
      required: true
    },
    ciudad: String,
    provincia: String,
    codigoPostal: String,
    referencia: String,
    ubicacion: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  telefono: {
    type: String,
    required: true
  },
  email: String,
  horarios: [{
    dia: {
      type: String,
      enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    },
    apertura: String, // "08:00"
    cierre: String,   // "22:00"
    cerrado: {
      type: Boolean,
      default: false
    }
  }],
  tiempoEntregaMin: {
    type: Number,
    default: 20 // minutos
  },
  tiempoEntregaMax: {
    type: Number,
    default: 40 // minutos
  },
  costoEnvio: {
    type: Number,
    default: 0
  },
  montoMinimoPedido: {
    type: Number,
    default: 0
  },
  calificacion: {
    promedio: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    total: {
      type: Number,
      default: 0
    }
  },
  totalPedidos: {
    type: Number,
    default: 0
  },
  activo: {
    type: Boolean,
    default: true
  },
  abierto: {
    type: Boolean,
    default: false
  },
  destacado: {
    type: Boolean,
    default: false
  },
  etiquetas: [String], // ['Comida rápida', 'Vegano', 'Sin gluten']
  metodoPago: {
    efectivo: {
      type: Boolean,
      default: true
    },
    tarjeta: {
      type: Boolean,
      default: false
    },
    transferencia: {
      type: Boolean,
      default: false
    }
  },
  propietarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índices
restauranteSchema.index({ 'direccion.ubicacion': '2dsphere' });
restauranteSchema.index({ nombre: 'text', descripcion: 'text' });
restauranteSchema.index({ activo: 1, abierto: 1 });
restauranteSchema.index({ categorias: 1 });

// Método para verificar si está abierto
restauranteSchema.methods.estaAbierto = function() {
  const ahora = new Date();
  const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][ahora.getDay()];
  const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
  
  const horario = this.horarios.find(h => h.dia === diaSemana);
  
  if (!horario || horario.cerrado) {
    return false;
  }
  
  return horaActual >= horario.apertura && horaActual <= horario.cierre;
};

module.exports = mongoose.model('Restaurante', restauranteSchema);