const autorizarRoles = (...roles) => {
    return (req, res, next) => {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }
  
      if (!roles.includes(req.usuario.rol)) {
        return res.status(403).json({
          success: false,
          message: `El rol ${req.usuario.rol} no tiene permisos para acceder a este recurso`
        });
      }
  
      next();
    };
  };
  
  module.exports = { autorizarRoles };