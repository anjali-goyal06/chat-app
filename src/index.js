const express = require('express')
const app = express()
const port = process.env.PORT ||  3000
const path =require('path')
const Filter = require('bad-words')
const { addUser , removeUser , getUser, getUsersInRoom  } = require('./utils/users.js')

const { generateMessage , generateLocationMessage } = require("./utils/messages.js")
 
const http = require('http')
const server = http.createServer(app)

const socketio = require('socket.io')
//const { generateMessage } = require('./utils/messages')
const io = socketio(server)

app.use(express.static(path.join(__dirname,'../public')))

io.on('connection',(socket)=>{
    console.log('new websocket connection ')

    socket.on('join', (options ,callback) => {
        const  { error , user } = addUser({ id : socket.id , ...options })

        if(error){
            return callback(error)
        }

        socket.join(user.room)


        socket.emit('message',generateMessage("Admin" , 'Welcome !!'))
        socket.broadcast.to(user.room).emit('message',generateMessage("Admin",`${user.username} has joined! `))

        io.to(user.room).emit('roomData',{
            room : user.room,
            users : getUsersInRoom(user.room)     
        })

        callback()
    })
    
    socket.on('sendmessage',(message,callback)=>{

        const filter = new Filter()

        if(filter.isProfane(message))
        {
            return callback('Profanity is not allowed');
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('message',generateMessage(user.username ,message))
        callback()
    })

    socket.on('sendLocation',({latitude,longitude},callback)=>{
        const user =  getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps?q=${latitude},${longitude} `))
        callback()
    })

    socket.on('disconnect',()=>{

        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message',generateMessage(` ${user.username}  has left`))
            io.to(user.room).emit('roomData',{
                room : user.room , 
                users : getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port,()=>console.log('server running at port = '+port))