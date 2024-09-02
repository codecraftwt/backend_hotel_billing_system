import { Server as SocketIOServer } from 'socket.io';

const setupSocketIO = (httpServer) => {
  const io = new SocketIOServer(httpServer);

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
};

export default setupSocketIO;
