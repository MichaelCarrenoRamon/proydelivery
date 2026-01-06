const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const pedidosSocket = require('./sockets/pedidos.socket');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);

// 1. Configurar Socket.IO con CORS explícito
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:4200", "http://localhost:8100"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});

// 2. Configuración de CORS para Express (Vital para el Login)
app.use(cors({
  origin: ["http://localhost:4200", "http://localhost:8100"],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Conectar a base de datos
connectDB();

// Inicializar sockets
pedidosSocket(io);

// Hacer io disponible en las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/categorias', require('./routes/categorias.routes'));
app.use('/api/restaurantes', require('./routes/restaurantes.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/pedidos', require('./routes/pedidos.routes'));
app.use('/api/notificaciones', require('./routes/notificaciones.routes'));

// Ruta de bienvenida (Test de salud)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API de Delivery - Funcionando',
    environment: process.env.NODE_ENV
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Servidor en puerto ${PORT}`);
  console.log(`🌐 Frontend esperado en: http://localhost:4200`);
  console.log(`📱 App Móvil esperada en: http://localhost:8100`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

module.exports = app;