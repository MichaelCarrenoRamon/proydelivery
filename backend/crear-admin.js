const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./src/models/Usuario'); // Verifica la ruta
require('dotenv').config();

const crearAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const salt = await bcrypt.genSalt(10);
  const hashedAdminPassword = await bcrypt.hash('123456', salt);

  await Usuario.findOneAndUpdate(
    { email: 'michael@delivery.com' },
    { 
      nombre: 'Administrador',
      password: hashedAdminPassword,
      rol: 'admin',
      activo: true 
    },
    { upsert: true, new: true }
  );

  console.log('✅ Usuario Admin creado/actualizado con éxito');
  process.exit();
};

crearAdmin();