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

const GroupTypingStarted = (groupId, senderUserId) => {
    socket.emit('group typing', { groupId, sender: senderUserId })
}

const GroupTypingStopped = (groupId, senderUserId) => {
    socket.emit('group stop typing', { groupId, sender: senderUserId })
}

const onGroupTyping = (callback) => {
    socket.off('group typing')
    socket.on('group typing', callback)
}

const onGroupStopTyping = (callback) => {
    socket.off('group stop typing')
    socket.on('group stop typing', callback)
}

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
    })
}

const readMessages = (senderUserId, receiverUserId, messageIds) => {
    socket.emit('read', { sender: senderUserId, receiver: receiverUserId, messageIds })
}

const onReadMessages = (callback) => {
    socket.off('read')
    socket.on('read', (data) => {
        callback(data)
    })
}

const readGroupMessages = (senderUserId, groupId, messageIds) => {
    socket.emit('read group message', { sender: senderUserId, groupId, messageIds })
}

const onReadGroupMessages = (callback) => {
    socket.off('read group message')
    socket.on('read group message', (data) => {
        callback(data)
    })
}

const emitGuestMessageDelivered = (groupId, tempId, messageSender, deliveredBy) => {
    socket.emit('guest message delivered', { groupId, tempId, messageSender, deliveredBy })
}

const onGuestMessageDelivered = (callback) => {
    socket.off('guest message delivered')
    socket.on('guest message delivered', callback)
}

const emitGuestMessageRead = (groupId, tempIds, messageSender, readBy) => {
    socket.emit('guest message read', { groupId, tempIds, messageSender, readBy })
}

const onGuestMessageRead = (callback) => {
    socket.off('guest message read')
    socket.on('guest message read', callback)
}
const emitUserOnline = (userId) => {
    socket.emit('user online', { userId })
}

const emitUserOffline = (userId, lastSeen) => {
    socket.emit('user offline', { userId, lastSeen })
}

const onUserOnline = (callback) => {
    socket.off('user online')
    socket.on('user online', callback)
}

const onUserOffline = (callback) => {
    socket.off('user offline')
    socket.on('user offline', callback)
}

export {ClientSocket,EmitMessage,JoinRoom,ChangeStatus,TypingStarted,TypingIndicator,TypingStopped,StopTypingIndicator,MessageRead,MessageReadIndicator,JoinGroupRoom,GroupTypingStarted,GroupTypingStopped,onGroupTyping,onGroupStopTyping,SendGroupMessage,OnGroupMessage,deleteMessage,onDeleteMessage,deleteGroupMessage,onDeleteGroupMessage,readMessages,onReadMessages,readGroupMessages,onReadGroupMessages,emitGuestMessageDelivered,onGuestMessageDelivered,emitGuestMessageRead,onGuestMessageRead,onUserOffline,onUserOnline,emitUserOffline,emitUserOnline}
