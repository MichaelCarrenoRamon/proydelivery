const Pedido = require('../models/Pedido');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);

    // Unirse a una sala de pedido específico
    socket.on('unirse_pedido', (pedidoId) => {
      socket.join(`pedido_${pedidoId}`);
      console.log(`Socket ${socket.id} se unió a pedido_${pedidoId}`);
    });

    // Actualizar ubicación del repartidor en tiempo real
    socket.on('actualizar_ubicacion_repartidor', async (data) => {
      const { pedidoId, latitud, longitud } = data;

      try {
        // Actualizar ubicación en el seguimiento del pedido
        const pedido = await Pedido.findById(pedidoId);
        
        if (pedido) {
          pedido.seguimiento.push({
            estado: 'en_camino',
            descripcion: 'Ubicación actualizada',
            ubicacion: {
              type: 'Point',
              coordinates: [parseFloat(longitud), parseFloat(latitud)]
            },
            timestamp: new Date()
          });
          
          await pedido.save();

          // Emitir actualización a todos los clientes en la sala del pedido
          io.to(`pedido_${pedidoId}`).emit('ubicacion_actualizada', {
            pedidoId,
            latitud,
            longitud,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error actualizando ubicación:', error);
      }
    });

    // Notificar cambio de estado del pedido
    socket.on('cambio_estado_pedido', (data) => {
      const { pedidoId, estado, descripcion } = data;
      
      io.to(`pedido_${pedidoId}`).emit('estado_pedido_actualizado', {
        pedidoId,
        estado,
        descripcion,
        timestamp: new Date()
      });
    });

    // Salir de una sala
    socket.on('salir_pedido', (pedidoId) => {
      socket.leave(`pedido_${pedidoId}`);
      console.log(`Socket ${socket.id} salió de pedido_${pedidoId}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado:', socket.id);
    });
  });
};