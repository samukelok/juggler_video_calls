class VideoCallApp {
    constructor() {
        this.socket = null;
        this.peers = {};
        this.localStream = null;
        this.screenStream = null;
        this.participants = {};
        this.currentLayout = 'auto';
        this.isMicOn = true;
        this.isVideoOn = true;
        this.callId = this.getCallIdFromUrl();
        this.userId = this.generateUserId();
        this.pendingCandidates = {};
        
        // Initialize viewport and resize handlers
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        this.setupViewportHeight();
        
        this.initElements();
        this.initEventListeners();
        this.initSocket();
        this.initMedia();

        // Start health checks and debugging
        this.healthCheckInterval = setInterval(() => this.checkConnectionHealth(), 15000);
        setInterval(() => this.logPeerConnections(), 10000);
    }
    
    initElements() {
        this.videoGrid = document.getElementById('video-grid');
        this.toggleMic = document.getElementById('toggleMic');
        this.toggleVideo = document.getElementById('toggleVideo');
        this.shareScreen = document.getElementById('shareScreen');
        this.endCall = document.getElementById('endCall');
        this.copyLink = document.getElementById('copyLink');
        this.participantCount = document.getElementById('participantCount');
        this.participantNumber = document.getElementById('participantNumber');
        this.callIdBadge = document.getElementById('callIdBadge');
        this.callEndedModal = new bootstrap.Modal('#callEndedModal');
        
        this.callIdBadge.textContent = this.callId;
    }
    
    initEventListeners() {
        this.toggleMic.addEventListener('click', () => this.toggleMicrophone());
        this.toggleVideo.addEventListener('click', () => this.toggleCamera());
        this.shareScreen.addEventListener('click', () => this.toggleScreenShare());
        this.endCall.addEventListener('click', () => this.endCallForAll());
        this.copyLink.addEventListener('click', () => this.copyCallLink());
    }
    
    initSocket() {
        this.socket = io("https://juggler-ws.onrender.com", {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5
        });
        
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.socket.emit('join-call', {
                callId: this.callId,
                userId: this.userId
            });
        });
        
        this.socket.on('user-connected', (userId) => {
            console.log('User connected:', userId);
            if (!this.peers[userId]) {
                this.createPeer(userId);
            }
            // Request fresh participant list
            this.socket.emit('request-participants', this.callId);
        });
        
        this.socket.on('user-disconnected', (userId) => {
            console.log('User disconnected:', userId);
            this.removeParticipant(userId);
        });
        
        this.socket.on('offer', async ({ from, offer }) => {
            console.log('Received offer from:', from);
            const peer = this.createPeer(from);
            try {
                await peer.setRemoteDescription(new RTCSessionDescription(offer));
                
                // Process pending ICE candidates
                if (this.pendingCandidates[from]) {
                    console.log('Processing pending candidates for:', from);
                    for (const candidate of this.pendingCandidates[from]) {
                        await peer.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                    delete this.pendingCandidates[from];
                }

                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                this.socket.emit('answer', { to: from, answer });
            } catch (err) {
                console.error('Error handling offer:', err);
            }
        });
        
        this.socket.on('answer', async ({ from, answer }) => {
            console.log('Received answer from:', from);
            const peer = this.peers[from];
            if (peer) {
                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error('Error setting remote description:', err);
                }
            }
        });
        
        this.socket.on('ice-candidate', ({ from, candidate }) => {
            if (!this.peers[from]) {
                console.log('Storing pending ICE candidate for:', from);
                if (!this.pendingCandidates[from]) {
                    this.pendingCandidates[from] = [];
                }
                this.pendingCandidates[from].push(candidate);
                return;
            }

            const peer = this.peers[from];
            if (candidate && peer.remoteDescription) {
                peer.addIceCandidate(new RTCIceCandidate(candidate))
                    .catch(err => console.error('Error adding ICE candidate:', err));
            }
        });

        this.socket.on('participants-list', (participants) => {
            console.log('Received participants list:', participants);
            participants.forEach(userId => {
                if (userId !== this.userId && !this.peers[userId]) {
                    this.createPeer(userId);
                }
            });
        });

        this.socket.on('participant-update', (participants) => {
            console.log('Received participant update:', participants);
            // Handle new participants
            participants.forEach(userId => {
                if (userId !== this.userId && !this.peers[userId]) {
                    this.createPeer(userId);
                }
            });
            // Handle disconnected participants
            Object.keys(this.peers).forEach(peerId => {
                if (!participants.includes(peerId)) {
                    this.removeParticipant(peerId);
                }
            });
        });

        this.socket.on('call-ended', () => {
            console.log('Call ended by host');
            this.leaveCall();
            this.callEndedModal.show();
        });
    }
    
    async initMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            }).catch(async err => {
                console.warn('Video access denied, trying audio only:', err);
                return navigator.mediaDevices.getUserMedia({ audio: true });
            });

            if (!this.localStream) {
                throw new Error('Could not access any media devices');
            }

            const hasVideo = this.localStream.getVideoTracks().length > 0;
            this.addParticipant(this.userId, true, hasVideo, true);
            
            this.socket.emit('request-participants', this.callId);
            
        } catch (err) {
            console.error('Media initialization failed:', err);
            this.showMediaError();
        }
    }

    setupViewportHeight() {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        window.addEventListener('resize', setVh);
        window.addEventListener('orientationchange', setVh);
        setVh();
    }
    
    handleResize() {
        this.videoGrid.setAttribute('data-count', Object.keys(this.participants).length);
        this.updateGridLayout();
    }
    
    createPeer(userId) {
        if (this.peers[userId]) {
            console.log('Peer already exists for:', userId);
            return this.peers[userId];
        }
        
        console.log('Creating peer connection for:', userId);
        
        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:relay1.expressturn.com:3480',
                    username: '174712975847837020',
                    credential: 'lO4Hbo98QqZxzV11X9koEfDPc/c='
                },
                {
                    urls: 'turn:relay1.expressturn.com:3480',
                    username: '174712975847837020',
                    credential: 'lO4Hbo98QqZxzV11X9koEfDPc/c='
                }
            ]
        });
        
        this.peers[userId] = peer;
        
        // Connection state handlers
        peer.onconnectionstatechange = () => {
            console.log(`Peer ${userId} connection state:`, peer.connectionState);
            if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
                this.removeParticipant(userId);
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log(`Peer ${userId} ICE state:`, peer.iceConnectionState);
        };

        peer.onicecandidateerror = (event) => {
            console.error('ICE candidate error:', event);
        };

        // Negotiation handlers
        peer.onnegotiationneeded = async () => {
            console.log('Negotiation needed for:', userId);
            try {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                this.socket.emit('offer', { to: userId, offer });
            } catch (err) {
                console.error('Negotiation error:', err);
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    to: userId,
                    candidate: event.candidate
                });
            }
        };
        
        peer.ontrack = (event) => {
            const stream = event.streams[0];
            if (!stream) return;
            
            console.log('Received track from:', userId);
            const hasAudio = stream.getAudioTracks().length > 0;
            const hasVideo = stream.getVideoTracks().length > 0;
            
            this.handleParticipantStream(userId, hasAudio, hasVideo, stream);
        };

        // Add local tracks if available
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peer.addTrack(track, this.localStream);
            });
        }

        // For existing participants, create offer immediately
        if (userId !== this.userId) {
            setTimeout(() => {
                if (peer.signalingState === 'stable') {
                    this.createOffer(userId);
                }
            }, 1000);
        }
        
        return peer;
    }
    
    handleParticipantStream(userId, hasAudio, hasVideo, stream) {
        if (this.participants[userId]) {
            // Update existing participant
            this.participants[userId].stream = stream;
            this.participants[userId].hasAudio = hasAudio;
            this.participants[userId].hasVideo = hasVideo;
            this.updateParticipantVideo(userId);
        } else {
            // Add new participant
            this.addParticipant(userId, hasAudio, hasVideo, false, stream);
        }
        
        // Process any pending ICE candidates
        if (this.pendingCandidates[userId]) {
            console.log('Processing pending candidates for:', userId);
            this.pendingCandidates[userId].forEach(candidate => {
                this.peers[userId].addIceCandidate(new RTCIceCandidate(candidate))
                    .catch(err => console.error('Error adding pending ICE candidate:', err));
            });
            delete this.pendingCandidates[userId];
        }
    }
    
    async createOffer(userId) {
        console.log('Creating offer for:', userId);
        const peer = this.peers[userId];
        try {
            const offer = await peer.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await peer.setLocalDescription(offer);
            this.socket.emit('offer', {
                to: userId,
                offer
            });
        } catch (err) {
            console.error('Error creating offer:', err);
        }
    }
    
    addParticipant(userId, hasAudio, hasVideo, isLocal = false, stream = null) {
        if (this.participants[userId]) return;
        
        console.log('Adding participant:', userId);
        const participant = {
            id: userId,
            name: isLocal ? 'You (Me)' : `User ${Object.keys(this.participants).length + 1}`,
            hasAudio,
            hasVideo,
            isLocal,
            stream,
            isSpeaking: false
        };
        
        this.participants[userId] = participant;
        this.updateParticipantCount();
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.id = `participant-${userId}`;
        
        if (hasVideo) {
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.className = 'participant-video';
            
            if (isLocal) {
                video.srcObject = this.localStream;
                video.muted = true;
                video.play().catch(e => console.error('Local video play error:', e));
            } else if (stream) {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play().catch(e => console.error('Remote video play error:', e));
                };
            }
            
            videoContainer.appendChild(video);
        } else {
            const placeholder = this.createVideoPlaceholder(participant.name);
            videoContainer.appendChild(placeholder);
        }
        
        // Add participant info
        const nameBadge = document.createElement('div');
        nameBadge.className = 'participant-name';
        nameBadge.textContent = participant.name;
        videoContainer.appendChild(nameBadge);
        
        // Add status indicators
        const statusContainer = document.createElement('div');
        statusContainer.className = 'participant-status';
        
        if (!hasAudio) {
            statusContainer.appendChild(this.createStatusBadge('mic-mute'));
        }
        
        if (!hasVideo) {
            statusContainer.appendChild(this.createStatusBadge('camera-off'));
        }
        
        videoContainer.appendChild(statusContainer);
        this.videoGrid.appendChild(videoContainer);
        this.updateGridLayout();
        this.videoGrid.setAttribute('data-count', Object.keys(this.participants).length);
    }
    
    createVideoPlaceholder(name) {
        const placeholder = document.createElement('div');
        placeholder.className = 'video-placeholder';
        
        const avatar = document.createElement('div');
        avatar.className = 'participant-avatar';
        avatar.innerHTML = `<i class="bi bi-person-fill fs-3 text-light"></i>`;
        
        const nameEl = document.createElement('div');
        nameEl.className = 'text-light mt-2';
        nameEl.textContent = name;
        
        placeholder.appendChild(avatar);
        placeholder.appendChild(nameEl);
        return placeholder;
    }
    
    createStatusBadge(type) {
        const badge = document.createElement('div');
        badge.className = 'status-badge';
        const icons = {
            'mic-mute': 'bi-mic-mute-fill',
            'camera-off': 'bi-camera-video-off-fill'
        };
        badge.innerHTML = `<i class="bi ${icons[type]} text-light fs-6"></i>`;
        return badge;
    }
    
    removeParticipant(userId) {
        console.log('Removing participant:', userId);
        // Clean up pending candidates
        if (this.pendingCandidates[userId]) {
            delete this.pendingCandidates[userId];
        }

        // Close peer connection
        if (this.peers[userId]) {
            this.peers[userId].close();
            delete this.peers[userId];
        }

        // Remove from DOM
        const element = document.getElementById(`participant-${userId}`);
        if (element) {
            element.remove();
        }

        // Remove from participants list
        delete this.participants[userId];
        this.updateParticipantCount();
        this.updateGridLayout();
        this.videoGrid.setAttribute('data-count', Object.keys(this.participants).length);
    }
    
    updateGridLayout() {
        const participantCount = Object.keys(this.participants).length;
        const grid = this.videoGrid;
        
        // Set data attribute for CSS to handle
        grid.setAttribute('data-count', participantCount);
        
        // Special case for 1 participant - center the video
        if (participantCount === 1) {
            grid.style.justifyItems = 'center';
            grid.style.alignItems = 'center';
        } else {
            grid.style.justifyItems = 'stretch';
            grid.style.alignItems = 'stretch';
        }
        
        // Force Safari to recalculate the layout
        grid.style.display = 'grid';
        setTimeout(() => {
            grid.style.display = '';
        }, 50);
    }
    
    updateParticipantCount() {
        const count = Object.keys(this.participants).length;
        this.participantNumber.textContent = count;
    }
    
    toggleMicrophone() {
        this.isMicOn = !this.isMicOn;
        
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = this.isMicOn;
            });
        }
        
        this.toggleMic.classList.toggle('active', this.isMicOn);
        this.toggleMic.innerHTML = `<i class="bi ${this.isMicOn ? 'bi-mic-fill' : 'bi-mic-mute-fill'} fs-5"></i>`;
        
        if (this.participants[this.userId]) {
            this.participants[this.userId].hasAudio = this.isMicOn;
            this.updateParticipantStatus(this.userId);
        }
    }
    
    toggleCamera() {
        this.isVideoOn = !this.isVideoOn;
        
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = this.isVideoOn;
            });
        }
        
        this.toggleVideo.classList.toggle('active', this.isVideoOn);
        this.toggleVideo.innerHTML = `<i class="bi ${this.isVideoOn ? 'bi-camera-video-fill' : 'bi-camera-video-off-fill'} fs-5"></i>`;
        
        if (this.participants[this.userId]) {
            this.participants[this.userId].hasVideo = this.isVideoOn;
            this.updateParticipantVideo(this.userId);
        }
    }
    
    async toggleScreenShare() {
        try {
            if (this.screenStream) {
                this.screenStream.getTracks().forEach(track => track.stop());
                this.screenStream = null;
                
                const videoTrack = this.localStream.getVideoTracks()[0];
                Object.values(this.peers).forEach(peer => {
                    const sender = peer.getSenders().find(s => s.track.kind === 'video');
                    if (sender && videoTrack) sender.replaceTrack(videoTrack);
                });
                
                this.shareScreen.classList.remove('active');
            } else {
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                });
                
                const screenTrack = this.screenStream.getVideoTracks()[0];
                Object.values(this.peers).forEach(peer => {
                    const sender = peer.getSenders().find(s => s.track.kind === 'video');
                    if (sender && screenTrack) sender.replaceTrack(screenTrack);
                });
                
                this.shareScreen.classList.add('active');
                
                screenTrack.onended = () => {
                    this.toggleScreenShare();
                };
            }
        } catch (err) {
            console.error('Error sharing screen:', err);
        }
    }
    
    updateParticipantStatus(userId) {
        const participant = this.participants[userId];
        if (!participant) return;
        
        const container = document.getElementById(`participant-${userId}`);
        if (!container) return;
        
        const statusContainer = container.querySelector('.participant-status');
        if (!statusContainer) return;
        
        statusContainer.innerHTML = '';
        
        if (!participant.hasAudio) {
            statusContainer.appendChild(this.createStatusBadge('mic-mute'));
        }
        
        if (!participant.hasVideo) {
            statusContainer.appendChild(this.createStatusBadge('camera-off'));
        }
    }
    
    updateParticipantVideo(userId) {
        const participant = this.participants[userId];
        if (!participant) return;
        
        const container = document.getElementById(`participant-${userId}`);
        if (!container) return;
        
        const existingVideo = container.querySelector('video');
        const existingPlaceholder = container.querySelector('.video-placeholder');
        
        if (existingVideo) existingVideo.remove();
        if (existingPlaceholder) existingPlaceholder.remove();
        
        if (participant.hasVideo) {
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.className = 'participant-video';
            
            if (participant.isLocal) {
                video.srcObject = this.localStream;
                video.muted = true;
                video.play().catch(e => console.error('Local video play error:', e));
            } else if (participant.stream) {
                video.srcObject = participant.stream;
                video.onloadedmetadata = () => {
                    video.play().catch(e => console.error('Remote video play error:', e));
                };
            }
            
            container.insertBefore(video, container.firstChild);
        } else {
            container.insertBefore(this.createVideoPlaceholder(participant.name), container.firstChild);
        }
        
        this.updateParticipantStatus(userId);
    }
    
    checkConnectionHealth() {
        // Check socket connection
        if (!this.socket.connected) {
            console.log('Socket disconnected, attempting reconnect...');
            this.socket.connect();
        }

        // Check peer connections
        Object.entries(this.peers).forEach(([userId, peer]) => {
            if (peer.connectionState === 'disconnected' || 
                peer.iceConnectionState === 'disconnected') {
                console.log(`Reconnecting to ${userId}`);
                this.reconnectPeer(userId);
            }
        });

        // Request fresh participant list
        if (this.socket.connected) {
            this.socket.emit('request-participants', this.callId);
        }
    }
    
    reconnectPeer(userId) {
        this.removeParticipant(userId);
        if (this.socket.connected) {
            this.createPeer(userId);
        }
    }
    
    copyCallLink() {
        const callUrl = `${window.location.origin}${window.location.pathname}?call=${this.callId}`;
        navigator.clipboard.writeText(callUrl).then(() => {
            const originalText = this.copyLink.innerHTML;
            this.copyLink.innerHTML = '<i class="bi bi-check2"></i> Copied!';
            setTimeout(() => {
                this.copyLink.innerHTML = originalText;
            }, 2000);
        });
    }
    
    endCallForAll() {
        if (confirm('Are you sure you want to end the call for everyone?')) {
            this.socket.emit('end-call', this.callId);
            this.leaveCall();
        }
    }
    
    leaveCall() {
        // Clear intervals
        clearInterval(this.healthCheckInterval);
        
        // Stop all media streams
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
        }
        
        // Close all peer connections
        Object.values(this.peers).forEach(peer => peer.close());
        
        // Leave the socket room
        if (this.socket) {
            this.socket.emit('leave-call', {
                callId: this.callId,
                userId: this.userId
            });
        }
    }
    
    logPeerConnections() {
        console.log('--- Peer Connection Status ---');
        Object.entries(this.peers).forEach(([userId, peer]) => {
            console.log(`Peer ${userId}:`, {
                connectionState: peer.connectionState,
                iceConnectionState: peer.iceConnectionState,
                signalingState: peer.signalingState,
                hasLocalStream: !!this.localStream,
                hasRemoteStream: !!this.participants[userId]?.stream
            });
        });
        console.log('Pending ICE candidates:', Object.keys(this.pendingCandidates));
        console.log('Current participants:', Object.keys(this.participants));
    }
    
    showMediaError() {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'alert alert-danger';
        errorContainer.textContent = 'Could not access camera/microphone. Please check permissions.';
        document.body.prepend(errorContainer);
    }
    
    getCallIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('call') || 'default-call';
    }
    
    generateUserId() {
        return 'user-' + Math.random().toString(36).substring(2, 9);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new VideoCallApp();
    
    window.addEventListener('beforeunload', () => {
        app.leaveCall();
    });
});