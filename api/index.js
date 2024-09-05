import express from 'express'
import dotenv from "dotenv"
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import userRouter from './routes/user.routes.js'
import skillsRouter from './routes/skills.routes.js'
import matchRouter from './routes/matches.routes.js'
import feedbackRouter from './routes/feedback.routes.js'
import matesRouter from './routes/mates.routes.js'
import cors from "cors"
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import notificationsRouter from './routes/notifications.routes.js'
import Notifications from './models/notifications.model.js'

dotenv.config()

const app = express()


app.use(cors({
    origin: 'http://localhost:5173', // Replace with the address of your frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(cookieParser())
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))


mongoose.connect(process.env.MONGODB_URI, {
}).then(()=> {
    console.log("Connected to Database")
}).catch((error)=> {
    console.log("Error connecting to database" + error);
})

app.use('/api/v1/user', userRouter)
app.use('/api/v1/skills', skillsRouter)
app.use('/api/v1/matches', matchRouter)
app.use('/api/v1/feedback', feedbackRouter)
app.use('/api/v1/mates', matesRouter)
app.use('/api/v1/notifications', notificationsRouter)



const port = process.env.PORT || 4000
// const port = 3000

const server = http.createServer(app);

// Integrate Socket.IO
const io = new SocketIOServer(server, {
    cors: {
        origin: "http://localhost:5173", // Change to your frontend URL
        methods: ["GET", "POST"]
    }
});

let activeUsers= {}


const userToSocketIdMap = new Map()
const socketIdToUserMap = new Map()

let onlineUsers = [];

const addNewUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
  // console.log(socketId, 'REMOVED')
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};


io.on('connection', (socket) => {
  // console.log('A user connected: ' + socket.id);
  socket.on("newUser", (userId) => {
    addNewUser(userId, socket.id);
    // console.log('new usern addeddd ', onlineUsers)
  });

  // Create a new room with name as mateId
  socket.on('joinRoom', ({ mateId, userId }) => {
      socket.join(mateId);
      console.log(`User ${socket.id} joined room ${mateId}`);

  
      if (!activeUsers[mateId]) {
        activeUsers[mateId] = new Set();
      }
      activeUsers[mateId].add(userId);

      // console.log('active users : ', activeUsers[mateId])
  
      io.to(mateId).emit('activeUsers', Array.from(activeUsers[mateId]));
    });

    const userToSocketIdMap = new Map()
    const socketIdToUserMap = new Map()

    socket.on('room:join', (data) => {
      console.log('room:join')
      const {user, roomId} = data
      userToSocketIdMap.set(user, socket.id)
      socketIdToUserMap.set(socket.id, user)
      io.to(roomId).emit('user:joined', {user, id: socket.id})
      socket.join(roomId)
      io.to(socket.id).emit('room:join', data)
    })

    socket.on('user:call', (data) => {
      console.log('user:call')
      const {to, offer} = data;
      // console.log('incoming call', 'to: ', to )
      io.to(to).emit('incoming:call', {from: socket.id, offer})
    })

    socket.on('call:accepted', (data) => {
      console.log('call:accepted')
      const {to, answer} = data;
      // console.log('call accepted')
      io.to(to).emit('call:accepted', {from: socket.id, answer})
    })


    socket.on("peer:nego:needed", ({ to, offer }) => {
      // console.log("peer:nego:needed", offer);
      io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });
  
    socket.on("peer:nego:done", ({ to, ans }) => {
      // console.log("peer:nego:done", ans);
      io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      // console.log(`ICE candidate from ${socket.id} to ${to}`);
      socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
     });


     socket.on('user:left', ({from, to}) => {
      io.to(to).emit('user:left', {from})
      console.log('user:left', from, to )

     })


  // whenever a sendMessage event is triggered from a socket(client side) messageDate from there ({message, mateId , sender,date})

  socket.on('sendMessage', ({messageData, mateId}) => {
      // console.log('message', messageData)
      io.to(mateId).emit('receiveMessage', messageData);
      console.log('recievemessg')
  });

  socket.on('notification', (data) => {
    const {type, to, from , note} = data
    
    const reciever = getUser(to);

    if(reciever){
      // console.log('reciever', reciever)

      // console.log('NOTIFICATION ', data)

      io.to(reciever.socketId).emit('recievenotification', data);
      console.log('SENT..')
    }else{
      console.log('reciever not found ')
      const setNotificationToDatabase = async(data) => {

        
        const notification = new Notifications({
        type,
        from,
        to,
        note
      })

      // console.log('notificatoin', notification)

      await notification.save({validateBeforeSave: false})
    }

    setNotificationToDatabase(data)
    }
    
  });



  socket.on('leaveRoom', ({ mateId, userId }) => {
      if (activeUsers[mateId]) {
        activeUsers[mateId].delete(userId);
        if (activeUsers[mateId].size === 0) {
          delete activeUsers[mateId];
        } else {
          io.to(mateId).emit('activeUsers', Array.from(activeUsers[mateId]));
        }
      }
      // console.log(`user ${userId} left room`)
      socket.leave(mateId);
    });



  socket.on('disconnect', () => {
     
        console.log('User disconnected: ' + socket.id);
        removeUser(socket.id);

      });

   
});

const host = '0.0.0.0'

server.listen(port,'0.0.0.0', () => {
    console.log(`App is running on port ${port}`)
})


export default app




