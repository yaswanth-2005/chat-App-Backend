const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./config/db')
const userRoutes = require('./routes/userRoutes')
const chatRoutes = require('./routes/chatRoutes')
const messageRoutes = require('./routes/messageRoutes')
const { errorHandler, notFound } = require('./Middleware/errorMiddleware')
const path = require('path')

dotenv.config()

connectDB()
const app = express()
app.use(cors())
app.use(express.json())


app.use('/api/user', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/message', messageRoutes)


// --deployment--

const __dirname1 = path.resolve();
console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname1, "/frontend/build")));

    app.get("*", (req, res) =>
        res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
    );
} else {
    app.get("/", (req, res) => {
        res.send("API is running..");
    });
}

app.use(notFound)
app.use(errorHandler)

const server = app.listen(process.env.PORT || 5000, () => console.log("Server Started Running at port 5000."))

const io = require("socket.io")(server, {
    pingTimeOut: 60000,
    cors: {
        origin: "http://localhost:3000"
    }
})

io.on("connection", (socket) => {
    console.log("Connected to Socketio..")
    socket.on("setup", (userData) => {
        socket.join(userData._id)
        // console.log(userData._id)    
        socket.emit("connected")
    });

    socket.on("join chat", (room) => {
        socket.join(room)
        console.log("User joined the room " + room)
    })

    socket.on("typing", (room) => socket.in(room).emit("typing"))
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"))

    socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat

        if (!chat.users) return console.log("chat.users not defined..")

        chat.users.forEach((user) => {
            if (user._id == newMessageReceived.sender._id) return
            socket.in(user._id).emit("message received", newMessageReceived)
        })
    })

    socket.off("setup", () => {
        console.log("USER DISCONNECTED..")
        socket.leave(userData._id)
    })
})