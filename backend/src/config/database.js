const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Eliminamos useNewUrlParser y useUnifiedTopology
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ MongoDB conectado exitosamente');
    console.log(`📍 Base de datos: ${mongoose.connection.name}`);
    
    // Manejar eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
    });

    // Cambiamos a un manejo más limpio para el cierre
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB desconectado por cierre de aplicación');
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;