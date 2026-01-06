const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

exports.registro = async (req, res) => {
  try {
    const { nombre, email, password, telefono, rol } = req.body;
    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }

    const usuario = await Usuario.create({ nombre, email, password, telefono, rol: rol || 'cliente' });
    const token = usuario.obtenerToken();

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en registro', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Proporcione email y contraseña' });
    }

    const usuario = await Usuario.findOne({ email }).select('+password');
    if (!usuario || !(await usuario.compararPassword(password))) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(401).json({ success: false, message: 'Usuario inactivo' });
    }

    const token = usuario.obtenerToken();
    res.status(200).json({
      success: true,
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        avatar: usuario.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
  }
};

exports.obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    res.status(200).json({ success: true, usuario });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};

exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, avatar } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      { nombre, telefono, avatar },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, usuario });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
  }
};

exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Sesión cerrada' });
};