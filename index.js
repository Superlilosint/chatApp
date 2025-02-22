require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server, {
    cors: {
      origin: ['https://my-chatapp-backend.netlify.app', 'http://localhost:3000'], // Allowed origins
      methods: ['GET', 'POST'], // Allowed HTTP methods
      allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
      credentials: true, // Allow credentials (cookies, authorization headers)
    },
  });
  

//connect to mongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("Connected to MongoDB Atlas");
})
.catch((err) => {
    console.error("Error connecting to MongoDB", err);
});


//Import models
const User = require("./models/User");
const Message = require("./models/Message");
const Room = require("./models/Room");


// Define allowed origins
const allowedOrigins = [
    'https://my-chatapp-backend.netlify.app',
    'http://localhost:3000', // Allow local development
  ];
  

  const corsOptions = {
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true); // Allow the request
      } else {
        callback(new Error('Not allowed by CORS')); // Block the request
      }
    },
    methods: 'GET,POST,PUT,DELETE', // Allowed HTTP methods
    allowedHeaders: 'Content-Type,Authorization', // Allowed headers
    credentials: true, // Allow cookies and credentials
  };  
app.use(cors(corsOptions));
app.use(express.json());


//statci files
app.use(express.static("client"));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
//Socket.io logic
io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.id}`);

    //join room
    socket.on("join-room", async (roomName, username) => {
        try{
            //Find or create the room
            let room = await Room.findOne( {name: roomName} );
            if(!room){
                room = new Room( {name: roomName} );
                await room.save();
            }


            //Create/Update user
            let user = await User.findOne({username});
            if(!user){
                user = new User({username, socketId: socket.id, room: room._id});
            }
            else {
                user.socketId = socket.id;
                user.room = room._id;
            }
            await user.save();

            //Add user to the room
            room.users.push(user._id);
            await room.save();

            socket.join(roomName);
            socket.emit("room-joined", roomName);

            //Broadcast to room
            io.to(roomName).emit("user-joined", username);
        
        } catch(err){
            console.error("Join room error:",err);
        }
    });


    //send message
    socket.on("send-message", async (roomName, text, username) => {
        try{
            const user = await User.findOne({username});
            const room = await Room.findOne({name: roomName});

            //Save message to DB
            const message = new Message({
                text,
                user: user._id,
                room: room._id
            });
            await message.save();

            //Add message to room
            room.messages.push(message._id);
            await room.save();

            //emit message to room
            io.to(roomName).emit("message", {user: username, text});
        }
        catch(err){
            console.error("Send message error:",err);
        }
    });

    //Handle disconnect
    socket.on("disconnect", async () => {
        try {
            const user = await User.findOneAndUpdate(
                {socketId: socket.id},
                { $set: {socketId: null, room: null}}
            );
            if(user && user.room){
                const room = await Room.findById(user.room);
                io.to(room.name).emit("user-left", username);
            }
        } catch (error) {
            console.error("Disconnect error:", error);
        }
    });
});


app.get('/rooms/:roomName/messages', async (req, res) => {
    try {
        const room = await Room.findOne({ name: req.params.roomName}).populate({
            path: "messages",
            populate: {path: "user", select: "username"}
        });
        const messages = room.messages.map((msg) => ({

            user: msg.user.username,
            text: msg.text,
        }))

        res.json(messages);

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
})


server.listen(process.env.PORT, () => {
    console.log("Server is running on port 3000");
});
