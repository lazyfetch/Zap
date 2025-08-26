let peerConnection=null

const setPeerConnection=(pc)=>{
    peerConnection=pc
}

const getPeerConnection=()=>{
    return peerConnection
}

export {setPeerConnection,getPeerConnection}