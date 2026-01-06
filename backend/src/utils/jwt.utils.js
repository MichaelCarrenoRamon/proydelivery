const jwt = require('jsonwebtoken');

exports.generarToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

exports.verificarToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};