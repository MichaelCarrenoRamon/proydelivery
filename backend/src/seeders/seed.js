const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Restaurante = require('../models/Restaurante');
const Producto = require('../models/Producto');

// Conectar a MongoDB
const connectDB = async () => {
    try {
      // En Mongoose 6+ ya no se necesitan opciones para la conexión básica
      await mongoose.connect(process.env.MONGODB_URI); 
      
      console.log('✅ MongoDB Atlas conectado exitosamente');
      console.log(`📍 Base de datos: ${mongoose.connection.name}`);
      console.log(`🌐 Host: ${mongoose.connection.host}\n`);
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error.message);
      process.exit(1);
    }
  };

// Limpiar base de datos
const limpiarDB = async () => {
  try {
    console.log('🧹 Limpiando base de datos...');
    await Usuario.deleteMany({});
    await Categoria.deleteMany({});
    await Restaurante.deleteMany({});
    await Producto.deleteMany({});
    console.log('✅ Base de datos limpiada\n');
  } catch (error) {
    console.error('❌ Error limpiando DB:', error.message);
    throw error;
  }
};

// Crear usuarios de prueba
const crearUsuarios = async () => {
  try {
    console.log('👥 Creando usuarios...');
    const usuarios = [
      {
        nombre: 'Admin Principal',
        email: 'admin@delivery.com',
        password: '123456',
        telefono: '+593987654321',
        rol: 'admin',
        activo: true,
        avatar: {
          url: 'https://ui-avatars.com/api/?name=Admin+Principal&size=200&background=667eea&color=fff',
        },
      },
      {
        nombre: 'Juan Cliente',
        email: 'cliente@test.com',
        password: '123456',
        telefono: '+593987654322',
        rol: 'cliente',
        activo: true,
        direcciones: [
          {
            nombre: 'Casa',
            direccion: 'Av. Principal 123',
            referencia: 'Casa azul, esquina',
            ubicacion: {
              type: 'Point',
              coordinates: [-79.0059, -2.9001],
            },
            principal: true,
          },
        ],
        avatar: {
          url: 'https://ui-avatars.com/api/?name=Juan+Cliente&size=200&background=48bb78&color=fff',
        },
      },
      {
        nombre: 'Carlos Repartidor',
        email: 'repartidor@test.com',
        password: '123456',
        telefono: '+593987654323',
        rol: 'repartidor',
        activo: true,
        disponible: true,
        ubicacionActual: {
          type: 'Point',
          coordinates: [-79.0059, -2.9001],
        },
        avatar: {
          url: 'https://ui-avatars.com/api/?name=Carlos+Repartidor&size=200&background=f6ad55&color=fff',
        },
      },
      {
        nombre: 'María Restaurante',
        email: 'restaurante@test.com',
        password: '123456',
        telefono: '+593987654324',
        rol: 'restaurante',
        activo: true,
        avatar: {
          url: 'https://ui-avatars.com/api/?name=Maria+Restaurante&size=200&background=ed64a6&color=fff',
        },
      },
    ];

    const usuariosCreados = await Usuario.insertMany(usuarios);
    console.log(`✅ ${usuariosCreados.length} usuarios creados\n`);
    return usuariosCreados;
  } catch (error) {
    console.error('❌ Error creando usuarios:', error.message);
    throw error;
  }
};

// Crear categorías
const crearCategorias = async () => {
    try {
      console.log('📂 Creando categorías...');
      const categoriasData = [
        { nombre: 'Pizza', descripcion: 'Deliciosas pizzas artesanales', icono: '🍕', color: '#FF6B6B', orden: 1, activo: true },
        { nombre: 'Hamburguesas', descripcion: 'Hamburguesas jugosas y sabrosas', icono: '🍔', color: '#FFA07A', orden: 2, activo: true },
        { nombre: 'Comida China', descripcion: 'Auténtica comida china', icono: '🥡', color: '#FFD700', orden: 3, activo: true },
        { nombre: 'Sushi', descripcion: 'Sushi fresco y rolls variados', icono: '🍣', color: '#87CEEB', orden: 4, activo: true },
        { nombre: 'Comida Mexicana', descripcion: 'Tacos, burritos y más', icono: '🌮', color: '#FF6347', orden: 5, activo: true },
        { nombre: 'Postres', descripcion: 'Dulces y postres deliciosos', icono: '🍰', color: '#FFB6C1', orden: 6, activo: true },
        { nombre: 'Bebidas', descripcion: 'Bebidas refrescantes', icono: '🥤', color: '#98FB98', orden: 7, activo: true },
        { nombre: 'Desayunos', descripcion: 'Desayunos nutritivos', icono: '🥞', color: '#DDA0DD', orden: 8, activo: true },
      ];
  
      // Mapeamos los datos para generar el slug manualmente igual que en tu modelo
      const categoriasConSlug = categoriasData.map(cat => ({
        ...cat,
        slug: cat.nombre
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }));
  
      const categoriasCreadas = await Categoria.insertMany(categoriasConSlug);
      console.log(`✅ ${categoriasCreadas.length} categorías creadas\n`);
      return categoriasCreadas;
    } catch (error) {
      console.error('❌ Error creando categorías:', error.message);
      throw error;
    }
  };

// Crear restaurantes
const crearRestaurantes = async (propietarioId, categorias) => {
  try {
    console.log('🍽️  Creando restaurantes...');
    const restaurantes = [
      {
        nombre: 'Pizza Nostra',
        descripcion: 'Las mejores pizzas artesanales de la ciudad con ingredientes frescos y masa hecha en casa',
        logo: { url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
        banner: { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800' },
        categorias: [categorias[0]._id],
        direccion: {
          calle: 'Av. Principal 456, Centro',
          ciudad: 'Santa Rosa',
          provincia: 'El Oro',
          referencia: 'Frente al parque central',
          ubicacion: { type: 'Point', coordinates: [-79.0059, -2.9001] },
        },
        telefono: '+593987654325',
        email: 'info@pizzanostra.com',
        horarios: [
          { dia: 'Lunes', apertura: '11:00', cierre: '23:00', cerrado: false },
          { dia: 'Martes', apertura: '11:00', cierre: '23:00', cerrado: false },
          { dia: 'Miércoles', apertura: '11:00', cierre: '23:00', cerrado: false },
          { dia: 'Jueves', apertura: '11:00', cierre: '23:00', cerrado: false },
          { dia: 'Viernes', apertura: '11:00', cierre: '00:00', cerrado: false },
          { dia: 'Sábado', apertura: '11:00', cierre: '00:00', cerrado: false },
          { dia: 'Domingo', apertura: '12:00', cierre: '22:00', cerrado: false },
        ],
        tiempoEntregaMin: 25,
        tiempoEntregaMax: 40,
        costoEnvio: 1.50,
        montoMinimoPedido: 5.00,
        calificacion: { promedio: 4.5, total: 120 },
        activo: true,
        abierto: true,
        destacado: true,
        etiquetas: ['Pizza', 'Italiano', 'Delivery'],
        metodoPago: { efectivo: true, tarjeta: true, transferencia: true },
        propietarioId: propietarioId,
      },
      {
        nombre: 'Burger Master',
        descripcion: 'Hamburguesas gourmet con carne 100% de res y ingredientes premium',
        logo: { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
        banner: { url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800' },
        categorias: [categorias[1]._id],
        direccion: {
          calle: 'Calle Comercio 789',
          ciudad: 'Santa Rosa',
          provincia: 'El Oro',
          referencia: 'Al lado del banco',
          ubicacion: { type: 'Point', coordinates: [-79.0070, -2.9010] },
        },
        telefono: '+593987654326',
        email: 'info@burgermaster.com',
        horarios: [
          { dia: 'Lunes', apertura: '12:00', cierre: '22:00', cerrado: false },
          { dia: 'Martes', apertura: '12:00', cierre: '22:00', cerrado: false },
          { dia: 'Miércoles', apertura: '12:00', cierre: '22:00', cerrado: false },
          { dia: 'Jueves', apertura: '12:00', cierre: '22:00', cerrado: false },
          { dia: 'Viernes', apertura: '12:00', cierre: '23:00', cerrado: false },
          { dia: 'Sábado', apertura: '12:00', cierre: '23:00', cerrado: false },
          { dia: 'Domingo', apertura: '12:00', cierre: '22:00', cerrado: false },
        ],
        tiempoEntregaMin: 20,
        tiempoEntregaMax: 35,
        costoEnvio: 1.00,
        montoMinimoPedido: 5.00,
        calificacion: { promedio: 4.7, total: 85 },
        activo: true,
        abierto: true,
        destacado: true,
        etiquetas: ['Hamburguesas', 'Comida rápida', 'Gourmet'],
        metodoPago: { efectivo: true, tarjeta: true, transferencia: false },
        propietarioId: propietarioId,
      },
      {
        nombre: 'Wok Express',
        descripcion: 'Comida china tradicional preparada al momento',
        logo: { url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400' },
        banner: { url: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800' },
        categorias: [categorias[2]._id],
        direccion: {
          calle: 'Av. Quito 234',
          ciudad: 'Santa Rosa',
          provincia: 'El Oro',
          referencia: 'Cerca del mercado',
          ubicacion: { type: 'Point', coordinates: [-79.0050, -2.9020] },
        },
        telefono: '+593987654327',
        email: 'info@wokexpress.com',
        horarios: [
          { dia: 'Lunes', apertura: '11:00', cierre: '22:00', cerrado: false },
          { dia: 'Martes', apertura: '11:00', cierre: '22:00', cerrado: false },
          { dia: 'Miércoles', apertura: '11:00', cierre: '22:00', cerrado: false },
          { dia: 'Jueves', apertura: '11:00', cierre: '22:00', cerrado: false },
          { dia: 'Viernes', apertura: '11:00', cierre: '23:00', cerrado: false },
          { dia: 'Sábado', apertura: '11:00', cierre: '23:00', cerrado: false },
          { dia: 'Domingo', apertura: '11:00', cierre: '22:00', cerrado: false },
        ],
        tiempoEntregaMin: 30,
        tiempoEntregaMax: 45,
        costoEnvio: 1.25,
        montoMinimoPedido: 6.00,
        calificacion: { promedio: 4.3, total: 65 },
        activo: true,
        abierto: true,
        destacado: false,
        etiquetas: ['Chino', 'Asiático', 'Wok'],
        metodoPago: { efectivo: true, tarjeta: false, transferencia: true },
        propietarioId: propietarioId,
      },
    ];

    const restaurantesCreados = await Restaurante.insertMany(restaurantes);
    console.log(`✅ ${restaurantesCreados.length} restaurantes creados\n`);
    return restaurantesCreados;
  } catch (error) {
    console.error('❌ Error creando restaurantes:', error.message);
    throw error;
  }
};

// Crear productos (código completo del mensaje anterior...)
const crearProductos = async (restaurantes) => {
  try {
    console.log('🍕 Creando productos...');
    const productos = [
      // Pizza Nostra
      {
        restauranteId: restaurantes[0]._id,
        nombre: 'Pizza Margarita',
        descripcion: 'Pizza clásica con salsa de tomate, mozzarella fresca y albahaca',
        precio: 12.50,
        imagen: { url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500' },
        categoria: 'Pizzas Clásicas',
        disponible: true,
        destacado: true,
        vegetariano: true,
        ingredientes: ['Masa artesanal', 'Salsa de tomate', 'Mozzarella', 'Albahaca'],
        tiempoPreparacion: 20,
        vendidos: 45,
        calificacion: { promedio: 4.8, total: 35 },
      },
      {
        restauranteId: restaurantes[0]._id,
        nombre: 'Pizza Pepperoni',
        descripcion: 'Pizza con abundante pepperoni y extra queso mozzarella',
        precio: 14.00,
        imagen: { url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500' },
        categoria: 'Pizzas Clásicas',
        disponible: true,
        destacado: true,
        ingredientes: ['Masa artesanal', 'Salsa de tomate', 'Mozzarella', 'Pepperoni'],
        tiempoPreparacion: 20,
        vendidos: 62,
        calificacion: { promedio: 4.9, total: 48 },
      },
      // Burger Master
      {
        restauranteId: restaurantes[1]._id,
        nombre: 'Classic Burger',
        descripcion: 'Hamburguesa clásica con carne de res 180g, lechuga, tomate, cebolla y salsa especial',
        precio: 8.50,
        imagen: { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
        categoria: 'Hamburguesas',
        disponible: true,
        destacado: true,
        ingredientes: ['Carne de res 180g', 'Pan brioche', 'Lechuga', 'Tomate', 'Cebolla', 'Salsa especial'],
        tiempoPreparacion: 15,
        vendidos: 78,
        calificacion: { promedio: 4.7, total: 62 },
      },
      {
        restauranteId: restaurantes[1]._id,
        nombre: 'BBQ Bacon Burger',
        descripcion: 'Hamburguesa con carne de res, tocino crujiente, cebolla caramelizada y salsa BBQ',
        precio: 10.50,
        precioOferta: 9.00,
        imagen: { url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500' },
        categoria: 'Hamburguesas Premium',
        disponible: true,
        destacado: true,
        nuevo: true,
        ingredientes: ['Carne de res 200g', 'Tocino', 'Cebolla caramelizada', 'Queso cheddar', 'Salsa BBQ'],
        tiempoPreparacion: 18,
        vendidos: 52,
        calificacion: { promedio: 4.9, total: 41 },
      },
      // Wok Express
      {
        restauranteId: restaurantes[2]._id,
        nombre: 'Chaulafan Especial',
        descripcion: 'Arroz frito con pollo, cerdo, camarones y vegetales al wok',
        precio: 9.50,
        imagen: { url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500' },
        categoria: 'Arroces',
        disponible: true,
        destacado: true,
        picante: 1,
        ingredientes: ['Arroz', 'Pollo', 'Cerdo', 'Camarones', 'Vegetales', 'Huevo', 'Salsa de soya'],
        tiempoPreparacion: 25,
        vendidos: 42,
        calificacion: { promedio: 4.6, total: 32 },
      },
    ];

    const productosCreados = await Producto.insertMany(productos);
    console.log(`✅ ${productosCreados.length} productos creados\n`);
    return productosCreados;
  } catch (error) {
    console.error('❌ Error creando productos:', error.message);
    throw error;
  }
};

// Ejecutar seeder
const ejecutarSeeder = async () => {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌱 INICIANDO SEEDER DE BASE DE DATOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await connectDB();
    await limpiarDB();

    const usuarios = await crearUsuarios();
    const categorias = await crearCategorias();
    const restaurantes = await crearRestaurantes(usuarios[3]._id, categorias);
    const productos = await crearProductos(restaurantes);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SEEDER COMPLETADO EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 RESUMEN:');
    console.log(`   👥 Usuarios: ${usuarios.length}`);
    console.log(`   📂 Categorías: ${categorias.length}`);
    console.log(`   🍽️  Restaurantes: ${restaurantes.length}`);
    console.log(`   🍕 Productos: ${productos.length}\n`);
    console.log('🔐 CREDENCIALES DE ACCESO:\n');
    console.log('   👨‍💼 Admin:');
    console.log('      📧 Email: admin@delivery.com');
    console.log('      🔑 Password: 123456\n');
    console.log('   👤 Cliente:');
    console.log('      📧 Email: cliente@test.com');
    console.log('      🔑 Password: 123456\n');
    console.log('   🚴 Repartidor:');
    console.log('      📧 Email: repartidor@test.com');
    console.log('      🔑 Password: 123456\n');
    console.log('   🍽️ Restaurante:');
    console.log('      📧 Email: restaurante@test.com');
    console.log('      🔑 Password: 123456\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ Puedes iniciar el servidor con: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR EJECUTANDO SEEDER');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error(error);
    process.exit(1);
  }
};

ejecutarSeeder();