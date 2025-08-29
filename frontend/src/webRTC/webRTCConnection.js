const createPeerConnection = (remoteVideoRef, localStream) => {
    try {
        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnection.ontrack = (event) => {
            if (remoteVideoRef && remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };
        if (localStream) {
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        }
        return peerConnection;
    } catch (error) {
        console.error("Error creating peer connection:", error);
        return null;
    }
};

export { createPeerConnection };