const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  numeroPedido: {
    type: String,
    unique: true,
  },
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  restauranteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurante',
    required: true
  },
  repartidorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  productos: [{
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },
    nombre: String,
    precio: Number,
    cantidad: {
      type: Number,
      required: true,
      min: 1
    },
    imagen: String,
    opciones: [{
      nombre: String,
      valor: String,
      precioAdicional: Number
    }],
    extras: [{
      nombre: String,
      precio: Number
    }],
    notas: String,
    subtotal: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  descuento: {
    type: Number,
    default: 0
  },
  costoEnvio: {
    type: Number,
    default: 0
  },
  propina: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  estado: {
    type: String,
    enum: [
      'pendiente',
      'confirmado',
      'preparando',
      'listo',
      'en_camino',
      'entregado',
      'cancelado'
    ],
    default: 'pendiente'
  },
  metodoPago: {
    tipo: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'transferencia'],
      required: true
    },
    estado: {
      type: String,
      enum: ['pendiente', 'pagado', 'rechazado'],
      default: 'pendiente'
    },
    referencia: String
  },
  direccionEntrega: {
    nombre: String,
    calle: String,
    referencia: String,
    telefono: String,
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
  instruccionesEspeciales: String,
  seguimiento: [{
    estado: String,
    descripcion: String,
    ubicacion: {
      type: {
        type: String,
        default: 'Point'
      },
      coordinates: [Number]
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  tiempos: {
    pedidoRealizado: {
      type: Date,
      default: Date.now
    },
    confirmado: Date,
    preparando: Date,
    listo: Date,
    enCamino: Date,
    entregado: Date,
    estimadoEntrega: Date
  },
  calificacion: {
    restaurante: {
      estrellas: {
        type: Number,
        min: 1,
        max: 5
      },
      comentario: String
    },
    repartidor: {
      estrellas: {
        type: Number,
        min: 1,
        max: 5
      },
      comentario: String
    },
    fecha: Date
  },
  evidencia: {
    foto: {
      url: String,
      publicId: String
    },
    firma: String,
    codigoEntrega: String
  },
  motivoCancelacion: String,
  canceladoPor: {
    tipo: {
      type: String,
      enum: ['cliente', 'restaurante', 'admin']
    },
    id: mongoose.Schema.Types.ObjectId,
    motivo: String
  },
  cupon: {
    codigo: String,
    descuento: Number
  }
}, {
  timestamps: true
});

// Índices
pedidoSchema.index({ numeroPedido: 1 });
pedidoSchema.index({ clienteId: 1, createdAt: -1 });
pedidoSchema.index({ restauranteId: 1, estado: 1 });
pedidoSchema.index({ repartidorId: 1, estado: 1 });
pedidoSchema.index({ 'direccionEntrega.ubicacion': '2dsphere' });
pedidoSchema.index({ estado: 1, createdAt: -1 });

// --- CORRECCIONES EN LOS MÉTODOS ---

// Generar número de pedido antes de guardar
pedidoSchema.pre('save', async function() {
  if (this.isNew && !this.numeroPedido) {
    const count = await mongoose.model('Pedido').countDocuments();
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const numero = (count + 1).toString().padStart(6, '0');
    this.numeroPedido = `PED-${año}${mes}-${numero}`;
    
    // IMPORTANTE: Al ser un pedido nuevo, inicializamos el primer registro de seguimiento
    if (this.seguimiento.length === 0) {
      this.seguimiento.push({
        estado: 'pendiente',
        descripcion: 'Pedido recibido, esperando confirmación',
        timestamp: new Date()
      });
    }
  }
});

// Método para calcular tiempo estimado
pedidoSchema.methods.calcularTiempoEstimado = function(tiempoPreparacion, tiempoEntrega) {
  const ahora = new Date();
  const minutos = (tiempoPreparacion || 0) + (tiempoEntrega || 0);
  this.tiempos.estimadoEntrega = new Date(ahora.getTime() + minutos * 60000);
  return this.tiempos.estimadoEntrega;
};

// Método para actualizar estado
pedidoSchema.methods.actualizarEstado = function(nuevoEstado, ubicacion = null) {
  this.estado = nuevoEstado;
  
  // Corregimos el acceso dinámico a los campos de tiempo (camelCase)
  const campoTiempo = nuevoEstado === 'en_camino' ? 'enCamino' : nuevoEstado;
  if (this.tiempos[campoTiempo] !== undefined) {
    this.tiempos[campoTiempo] = new Date();
  }
  
  const nuevoSeguimiento = {
    estado: nuevoEstado,
    descripcion: this.obtenerDescripcionEstado(nuevoEstado),
    timestamp: new Date()
  };
  
  if (ubicacion) {
    nuevoSeguimiento.ubicacion = {
      type: 'Point',
      coordinates: ubicacion
    };
  }
  
  this.seguimiento.push(nuevoSeguimiento);
};

pedidoSchema.methods.obtenerDescripcionEstado = function(estado) {
  const descripciones = {
    pendiente: 'Pedido recibido, esperando confirmación',
    confirmado: 'Pedido confirmado por el restaurante',
    preparando: 'Tu pedido está siendo preparado',
    listo: 'Tu pedido está listo para ser recogido',
    en_camino: 'El repartidor va en camino',
    entregado: 'Pedido entregado exitosamente',
    cancelado: 'Pedido cancelado'
  };
  return descripciones[estado] || '';
};

module.exports = mongoose.model('Pedido', pedidoSchema);