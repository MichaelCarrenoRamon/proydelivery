//Producto.js
const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  restauranteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurante',
    required: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es requerida']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: 0
  },
  precioOferta: {
    type: Number,
    min: 0
  },
  imagen: {
    url: {
      type: String,
      required: true
    },
    publicId: String
  },
  imagenes: [{
    url: String,
    publicId: String
  }],
  categoria: {
    type: String,
    required: true
  },
  subcategoria: String,
  disponible: {
    type: Boolean,
    default: true
  },
  destacado: {
    type: Boolean,
    default: false
  },
  nuevo: {
    type: Boolean,
    default: false
  },
  vegetariano: {
    type: Boolean,
    default: false
  },
  vegano: {
    type: Boolean,
    default: false
  },
  sinGluten: {
    type: Boolean,
    default: false
  },
  picante: {
    type: Number,
    min: 0,
    max: 3,
    default: 0 // 0: No picante, 1: Poco, 2: Medio, 3: Muy picante
  },
  ingredientes: [String],
  alergenos: [String],
  informacionNutricional: {
    calorias: Number,
    proteinas: Number,
    carbohidratos: Number,
    grasas: Number,
    fibra: Number
  },
  tiempoPreparacion: {
    type: Number,
    default: 15 // minutos
  },
  opciones: [{
    nombre: String, // "Tamaño"
    requerido: Boolean,
    multiple: Boolean,
    valores: [{
      nombre: String, // "Grande"
      precioAdicional: {
        type: Number,
        default: 0
      }
    }]
  }],
  extras: [{
    nombre: String,
    precio: Number
  }],
  stock: {
    type: Number,
    default: null // null = ilimitado
  },
  vendidos: {
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
  etiquetas: [String],
  orden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
productoSchema.index({ restauranteId: 1, disponible: 1 });
productoSchema.index({ nombre: 'text', descripcion: 'text' });
productoSchema.index({ categoria: 1 });
productoSchema.index({ destacado: 1 });
productoSchema.index({ precio: 1 });

// Virtual para calcular si está en oferta
productoSchema.virtual('enOferta').get(function() {
  return this.precioOferta && this.precioOferta < this.precio;
});

// Virtual para calcular descuento
productoSchema.virtual('descuento').get(function() {
  if (!this.enOferta) return 0;
  return Math.round(((this.precio - this.precioOferta) / this.precio) * 100);
});

// Incluir virtuals en JSON
productoSchema.set('toJSON', { virtuals: true });
productoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Producto', productoSchema);