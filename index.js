//STARTER CODE: https://socket.io/get-started/chat// 
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

let users=[];
let chathistory= [];


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    // on connection//
    socket.on('new_user', client_name => {
      socket.name = client_name;
      let color = '000000'  //set the default color to black//
      socket.color = color  //unless user entered a color//
      socket.on("new_color", color_name =>{
        socket.color = color_name;  
      })

      console.log(users);
      if (!users.some(u => u.name === client_name)){
        users.push({name: client_name, color: color});
        console.log(client_name + ' connected');
        //send everything in chat history//
        for(let i = 0 ; i < chathistory.length; i++) {
          socket.emit('chat message', chathistory[i]);
        }   
        const message = {name:"", date: getTime(new Date()), color: socket.color, message:  client_name + " has joined the chat."};
        io.emit('chat message', message);
        chathistory.push(message);
        console.log(users);      

        io.emit('user list', users);

      }//else send error
    });

    //on disconnection//
    socket.on('disconnect', () => {
      const message = {name:"", date: getTime(new Date()), color: socket.color, message:  socket.name + " has left the chat."};
      io.emit('chat message', message);   
      chathistory.push(message);

      console.log(socket.name + ' disconnected');
      //remove disconnected user from list of active users//
      for(var i = 0; i < users.length; i++) {   //https://stackoverflow.com/questions/39286008/deleting-a-user-in-an-array
        if(socket.name === users[i].name) {
           users.splice(i, 1)
         }
      }
      console.log(users);
      io.emit('user list', users);


    });
    
    //messages 
    socket.on('chat message', function(msg) {
      if(msg.startsWith("/nick ")){
        let in_use = false;
        var desiredName = msg.substring(msg.indexOf(' ') + 1);        //https://stackoverflow.com/questions/573145/get-everything-after-the-dash-in-a-string-in-javascript/35236900 
        let oldName = socket.name;
        console.log("desired name is " + desiredName);
        //check if user name is in use or not//
        for(var i = 0; i < users.length; i++) {
          if(desiredName === users[i].name) {
            in_use = true;
          }
        }
        if (in_use){
          console.log("name is in use already");
        } else{
          console.log("name changed");
          for(var i = 0; i < users.length; i++) {
            if(oldName === users[i].name) {
              socket.name = desiredName;
              users[i].name = socket.name;
              console.log("new name is " + desiredName);     
              io.emit('user list', users);
         
            }
          }          
        }
      //check if user changes desired color//
      }else if (msg.startsWith("/nickcolor ")){
        var desiredColor = msg.substring(msg.indexOf(' ') + 1);
        for(var i = 0; i < users.length; i++) {
          if(socket.name === users[i].name) {
            users[i].color = desiredColor;
            socket.color = desiredColor;
            console.log("color changed to " + desiredColor);
            console.log(users);
          }
        }        
      }
      //send the message to client side..
      console.log(socket.name + " " + getTime(new Date()) + ": " + msg);
      const message = {name:socket.name, date: getTime(new Date()), color: socket.color, message: msg};
      io.emit('chat message', message);
      //only show latest 200 messages//
      chathistory.push(message);
      if(chathistory.length > 200){
        chathistory.shift();
      }
    });
  });


server.listen(3000, () => {
  console.log('listening on *:3000');
});

//get the current time https://stackoverflow.com/questions/10599148/how-do-i-get-the-current-time-only-in-javascript//
function getTime(time){
  let h_time = time.getHours();
  let m_time =time.getMinutes(); 
  let s_time =time.getSeconds(); 
  return h_time+ ":" + m_time + ":" + s_time; 
}