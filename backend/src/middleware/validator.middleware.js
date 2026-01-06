const { validationResult } = require('express-validator');

const validarCampos = (req, res, next) => {
  const errores = validationResult(req);
  
  if (!errores.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      // Cambiamos err.param por err.path o err.msg
      errores: errores.array().map(err => ({
        campo: err.path || err.param, 
        mensaje: err.msg
      }))
    });
  }
  
  next();
};

module.exports = { validarCampos };