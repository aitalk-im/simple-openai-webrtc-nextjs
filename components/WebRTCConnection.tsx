'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AudioPlayer from '@/components/AudioPlayer';

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected';
}

export default function WebRTCConnection() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus['status']>('disconnected');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const initializeWebRTC = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      
      // Check browser support
      if (!navigator.mediaDevices || !RTCPeerConnection) {
        throw new Error('Browser does not support WebRTC');
      }

      // 1. Get session token (using existing /api/session endpoint)
      const sessionResponse = await fetch('/api/session');
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to get session token');
      }
      
      const sessionData = await sessionResponse.json();
      
      // Check session response format
      console.log('Session data:', sessionData);
      
      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // 3. Set audio processing
      pc.ontrack = (event) => {
        console.log('Received remote audio stream');
        audioStreamRef.current = event.streams[0];
      };

      // 4. Add local audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 5. Create data channel
      const dc = pc.createDataChannel('oai-events', {
        negotiated: true,
        id: 0,
        ordered: true
      });
      dataChannelRef.current = dc;

      setupDataChannel(dc);

      // 6. Create and send Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Use existing /api/webrtc endpoint to send SDP
      const sdpResponse = await fetch('/api/webrtc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sdp: offer.sdp,
          model: 'gpt-4o-mini-realtime-preview-2024-12-17'
        })
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to exchange SDP');
      }

      const { sdp: answerSdp } = await sdpResponse.json();

      // 8. Set remote description
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

      // Add ICE connection state monitoring
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
      };

      // Add ICE candidate gathering state monitoring
      pc.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', pc.iceGatheringState);
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed') {
          handleConnectionFailure(new Error('Connection failed'));
        }
      };

    } catch (error) {
      console.error('WebRTC initialization error:', error);
      setConnectionStatus('disconnected');
      handleConnectionFailure(error instanceof Error ? error : new Error(String(error)));
    }
  }, []);

  const disconnectWebRTC = useCallback(() => {
    try {
      // Close data channel
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }

      // Stop all audio tracks
      if (audioStreamRef.current) {
        const tracks = audioStreamRef.current.getTracks();
        tracks.forEach(track => {
          track.stop();
          audioStreamRef.current?.removeTrack(track);
        });
        audioStreamRef.current = null;
      }

      // Remove all event listeners
      if (peerConnectionRef.current) {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.onicegatheringstatechange = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      setConnectionStatus('disconnected');
      setRetryCount(0);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, []);

  const handleConnectionFailure = useCallback(async (error: Error) => {
    console.error('Connection error:', error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Attempting reconnection (${retryCount + 1}/${MAX_RETRIES})...`);
      setRetryCount(prev => prev + 1);
      // Add retry delay
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      await initializeWebRTC();
    } else {
      console.error('Max retry attempts reached');
      setRetryCount(0);
      setConnectionStatus('disconnected');
      alert('Connection failed after multiple attempts. Please try again later.');
    }
  }, [retryCount, initializeWebRTC]);

  const cleanup = useCallback(() => {
    // Stop all media tracks
    if (peerConnectionRef.current) {
      const senders = peerConnectionRef.current.getSenders();
      senders.forEach(sender => {
        if (sender.track) {
          sender.track.stop();
        }
      });
    }
    
    disconnectWebRTC();
  }, [disconnectWebRTC]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const setupDataChannel = (dc: RTCDataChannel) => {
    dc.onopen = () => {
      setConnectionStatus('connected');
      console.log('Data channel opened');
    };

    dc.onclose = () => {
      console.log('Data channel closed');
      setConnectionStatus('disconnected');
    };

    dc.onerror = (error) => {
      console.error('Data channel error:', error);
      handleConnectionFailure(new Error('Data channel error'));
    };

    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            WebRTC Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={initializeWebRTC} 
              disabled={connectionStatus !== 'disconnected'}
              className="w-full"
            >
              Connect
            </Button>

            <Button 
              onClick={disconnectWebRTC} 
              disabled={connectionStatus === 'disconnected'}
              variant="destructive"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>

          <div className={`text-center font-medium ${getStatusColor(connectionStatus)}`}>
            Status: {connectionStatus}
          </div>

          {/* Add audio player */}
          {peerConnectionRef.current && audioStreamRef.current && (
            <AudioPlayer 
              audioStream={audioStreamRef.current} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}