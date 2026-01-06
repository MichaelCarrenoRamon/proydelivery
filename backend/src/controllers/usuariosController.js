const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const { deleteImage } = require('../config/cloudinary');

// --- NUEVA FUNCIÓN: LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe (incluimos el password para comparar)
    const usuario = await Usuario.findOne({ email }).select('+password');
    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Verificar contraseña (usando el método matchPassword del modelo)
    const esCorrecto = await usuario.comparePassword(password);
    if (!esCorrecto) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Generar Token JWT
    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      success: true,
      token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- NUEVA FUNCIÓN: REGISTRO ---
exports.registro = async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
    }

    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password,
      telefono,
      rol: 'cliente'
    });

    const token = jwt.sign({ id: nuevoUsuario._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      token,
      usuario: { id: nuevoUsuario._id, nombre: nuevoUsuario.nombre, email: nuevoUsuario.email, rol: nuevoUsuario.rol }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- TUS FUNCIONES ANTERIORES (Mantenidas) ---
exports.obtenerUsuarios = async (req, res) => {
  try {
    const { rol, activo, page = 1, limit = 10 } = req.query;
    const filtro = {};
    if (rol) filtro.rol = rol;
    if (activo !== undefined) filtro.activo = activo === 'true';
    const skip = (page - 1) * limit;
    const usuarios = await Usuario.find(filtro).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Usuario.countDocuments(filtro);
    res.status(200).json({ success: true, data: usuarios, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.obtenerUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.status(200).json({ success: true, data: usuario });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.crearUsuario = async (req, res) => {
    try {
      const { nombre, email, password, telefono, rol, activo } = req.body;
      const existeUsuario = await Usuario.findOne({ email });
      if (existeUsuario) return res.status(400).json({ success: false, message: 'El correo ya existe' });
      const nuevoUsuario = await Usuario.create({ nombre, email, password, telefono, rol: rol || 'cliente', activo: activo !== undefined ? activo : true });
      const usuarioRespuesta = nuevoUsuario.toObject();
      delete usuarioRespuesta.password;
      res.status(201).json({ success: true, data: usuarioRespuesta });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: usuario });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (usuario.avatar?.publicId) await deleteImage(usuario.avatar.publicId);
    await usuario.deleteOne();
    res.status(200).json({ success: true, message: 'Eliminado' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.agregarDireccion = async (req, res) => {
  try {
    const { nombre, direccion, latitud, longitud, principal } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);
    if (principal) usuario.direcciones.forEach(dir => dir.principal = false);
    usuario.direcciones.push({ nombre, direccion, ubicacion: { type: 'Point', coordinates: [parseFloat(longitud), parseFloat(latitud)] }, principal: principal || false });
    await usuario.save();
    res.status(201).json({ success: true, data: usuario.direcciones });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.actualizarUbicacion = async (req, res) => {
  try {
    const { latitud, longitud } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(req.usuario.id, { ubicacionActual: { type: 'Point', coordinates: [parseFloat(longitud), parseFloat(latitud)] } }, { new: true });
    res.status(200).json({ success: true, data: usuario.ubicacionActual });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.obtenerRepartidoresDisponibles = async (req, res) => {
  try {
    const { latitud, longitud, radio = 5000 } = req.query;
    const repartidores = await Usuario.find({ rol: 'repartidor', activo: true, disponible: true, ubicacionActual: { $near: { $geometry: { type: 'Point', coordinates: [parseFloat(longitud), parseFloat(latitud)] }, $maxDistance: parseInt(radio) } } }).select('nombre telefono');
    res.status(200).json({ success: true, data: repartidores });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};