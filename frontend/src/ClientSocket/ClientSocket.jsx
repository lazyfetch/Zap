import socket from "../socket.js";

const JoinRoom = (userId) => {
    socket.emit('join room', userId);
};

const ClientSocket = (value, senderUserId, receiverUserId, tempId, fileData) => {
    socket.emit('chat message', {
        message: value,
        sender: senderUserId,
        receiver: receiverUserId,
        tempId: tempId,
        fileData: fileData 
    });
}       

const EmitMessage=(callback)=>{
    socket.off('chat message');
    socket.on('chat message', (msg) => {
        callback(msg)
  });
}

const ChangeStatus=(callback)=>{
    console.log("Setting up db saved listener");
    socket.off('db saved');
    socket.on('db saved',(msg)=>{
        callback(msg)
    })
}

const TypingStarted = (senderUserId, receiverUserId) => {
    socket.emit('typing', { sender: senderUserId, receiver: receiverUserId });
}

const TypingIndicator = (callback) => {
    socket.off('typing')
    socket.on('typing', (data) => {
        callback(data)
    })
}

const TypingStopped = (senderUserId, receiverUserId) => {
    socket.emit('stop typing', { sender: senderUserId, receiver: receiverUserId });
}

const StopTypingIndicator = (callback) => {
    socket.off('stop typing')
    socket.on('stop typing', (data) => {
        callback(data)
    })
}

const MessageRead=(senderUserId, receiverUserId)=>{
    socket.emit('read',{sender:senderUserId,receiver:receiverUserId})
}

const MessageReadIndicator=(callback)=>{
    socket.off('read')
    socket.on('read',(data)=>{
        callback(data)
    })
}

const JoinGroupRoom = (groupId) => {
    socket.emit('join group room', groupId)
};

const SendGroupMessage = (messageObj) => {
    socket.emit('group message', messageObj)
};

const OnGroupMessage = (callback) => {
    socket.off('group message')
    socket.on('group message', (msg) => {
        callback(msg)
    });
};

const deleteMessage = (msgObj,receiver)=>{
    socket.emit('delete',{msgObj,receiver})
}

const onDeleteMessage=(callback)=>{
    socket.off('delete')
    socket.on('delete',(msgObj)=>{
        callback(msgObj)
    })
}
const deleteGroupMessage = (msgObj, group) => {
    socket.emit('delete group message', { msgObj, group })
};

const onDeleteGroupMessage = (callback) => {
    socket.off('delete group message')
    socket.on('delete group message', (msgObj) => {
        callback(msgObj)
    });
};


export {ClientSocket,EmitMessage,JoinRoom,ChangeStatus,TypingStarted,TypingIndicator,TypingStopped,StopTypingIndicator,MessageRead,MessageReadIndicator,JoinGroupRoom,SendGroupMessage,OnGroupMessage,deleteMessage,onDeleteMessage,deleteGroupMessage,onDeleteGroupMessage}
