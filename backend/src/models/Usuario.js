//Usuario.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  rol: {
    type: String,
    enum: {
      values: ['admin', 'cliente', 'repartidor', 'restaurante'],
      message: 'Rol no válido'
    },
    default: 'cliente'
  },
  avatar: {
    url: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/avatar_default.png'
    },
    publicId: String
  },
  direcciones: [{
    nombre: String,
    direccion: String,
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
    },
    principal: {
      type: Boolean,
      default: false
    }
  }],
  ubicacionActual: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  activo: {
    type: Boolean,
    default: true
  },
  disponible: {
    type: Boolean,
    default: false
  },
  fcmToken: String,
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
  restauranteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurante'
  },
  verificado: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date
}, {
  timestamps: true
});

// Índices geoespaciales (SOLO UNA VEZ, sin duplicados)
usuarioSchema.index({ ubicacionActual: '2dsphere' });
usuarioSchema.index({ 'direcciones.ubicacion': '2dsphere' });
// Removido: usuarioSchema.index({ email: 1 }); porque ya está con unique: true
usuarioSchema.index({ rol: 1 });

// Hash de password antes de guardar
// Hash de password antes de guardar (CORREGIDO)
usuarioSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Método para comparar passwords
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Método para obtener JWT token
usuarioSchema.methods.obtenerToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: this._id, rol: this.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Ocultar password en JSON
usuarioSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('Usuario', usuarioSchema);