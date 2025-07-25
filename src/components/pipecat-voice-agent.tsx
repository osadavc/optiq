'use client'

import React, { useCallback, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConnectionState = 'disconnected' | 'connecting' | 'connected'

interface VoiceBotProps {
  className?: string
}

function VoiceBot({ className }: VoiceBotProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  const waitForIceGatheringComplete = async (pc: RTCPeerConnection, timeoutMs = 2000): Promise<void> => {
    if (pc.iceGatheringState === 'complete') return
    console.log('Waiting for ICE gathering to complete. Current state:', pc.iceGatheringState)
    
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout
      
      const checkState = () => {
        console.log('icegatheringstatechange:', pc.iceGatheringState)
        if (pc.iceGatheringState === 'complete') {
          cleanup()
          resolve()
        }
      }
      
      const onTimeout = () => {
        console.warn(`ICE gathering timed out after ${timeoutMs} ms.`)
        cleanup()
        resolve()
      }
      
      const cleanup = () => {
        pc.removeEventListener('icegatheringstatechange', checkState)
        clearTimeout(timeoutId)
      }
      
      pc.addEventListener('icegatheringstatechange', checkState)
      timeoutId = setTimeout(onTimeout, timeoutMs)
      checkState()
    })
  }

  const createSmallWebRTCConnection = async (audioTrack: MediaStreamTrack): Promise<RTCPeerConnection> => {
    const config = {
      iceServers: [],
    }
    const pc = new RTCPeerConnection(config)
    addPeerConnectionEventListeners(pc)
    
    pc.ontrack = (e) => {
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = e.streams[0]
      }
    }
    
    // SmallWebRTCTransport expects to receive both transceivers
    pc.addTransceiver(audioTrack, { direction: 'sendrecv' })
    pc.addTransceiver('video', { direction: 'sendrecv' })
    
    await pc.setLocalDescription(await pc.createOffer())
    await waitForIceGatheringComplete(pc)
    
    const offer = pc.localDescription
    if (!offer) {
      throw new Error('Failed to create offer')
    }

    const response = await fetch('/api/webrtc/offer', {
      body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }
    
    const answer = await response.json()
    await pc.setRemoteDescription(answer)
    
    return pc
  }

  const addPeerConnectionEventListeners = (pc: RTCPeerConnection) => {
    pc.oniceconnectionstatechange = () => {
      console.log('oniceconnectionstatechange', pc.iceConnectionState)
    }
    
    pc.onconnectionstatechange = () => {
      console.log('onconnectionstatechange', pc.connectionState)
      const connectionState = pc.connectionState
      
      if (connectionState === 'connected') {
        setConnectionState('connected')
      } else if (connectionState === 'disconnected') {
        setConnectionState('disconnected')
      }
    }
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate)
      } else {
        console.log('All ICE candidates have been sent.')
      }
    }
  }

  const handleConnect = async () => {
    try {
      setConnectionState('connecting')
      
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const pc = await createSmallWebRTCConnection(audioStream.getAudioTracks()[0])
      
      peerConnectionRef.current = pc

      // Simulate audio level for speaking detection
      const analyzeAudio = () => {
        if (connectionState === 'connected' && isMicEnabled) {
          // Simple random audio level simulation - in real app this would analyze actual audio
          setAudioLevel(Math.random() * 0.5 + 0.1)
          setTimeout(() => setAudioLevel(0), 1000 + Math.random() * 2000)
        }
      }
      
      // Start periodic audio analysis simulation
      const interval = setInterval(analyzeAudio, 3000 + Math.random() * 5000)
      
      // Clean up interval when disconnected
      const cleanup = () => clearInterval(interval)
      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'disconnected') cleanup()
      })
      
    } catch (error) {
      console.error('Failed to connect:', error)
      setConnectionState('disconnected')
    }
  }

  const handleDisconnect = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    setConnectionState('disconnected')
    setAudioLevel(0)
  }

  const handleMicToggle = () => {
    setIsMicEnabled(!isMicEnabled)
    // In a real implementation, you'd enable/disable the audio track here
  }

  const isConnected = connectionState === 'connected'
  const isConnecting = connectionState === 'connecting'
  const isDisconnected = connectionState === 'disconnected'

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium text-gray-600 tracking-wide">Optiq Agent</h3>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 space-y-6">
        {/* Description */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ask questions about your study resources and clarify doubts, or anything you feel like.
          </p>
        </div>
        
        {/* Voice Interface */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          {/* Connection Status */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">
              {isConnected ? "Connected to AI Agent" : 
               isConnecting ? "Connecting..." : 
               "Ready to Connect"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isConnected ? "Voice conversation active" : 
               isConnecting ? "Please wait..." : 
               "Click connect to start voice conversation"}
            </p>
          </div>

          {/* Connection Button */}
          {isDisconnected && (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-6 py-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect to AI Agent"
              )}
            </Button>
          )}

          {/* Voice Controls */}
          {isConnected && (
            <>
              {/* Voice Button with Animation */}
              <div className="relative flex items-center justify-center w-32 h-32">
                {/* Outer pulsing circles - react to voice */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full bg-primary/15 transition-all duration-100",
                    isMicEnabled && audioLevel > 0 ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    transform: isMicEnabled && audioLevel > 0 ? `scale(${1.2 + audioLevel * 1.5})` : 'scale(1)',
                  }}
                />
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full bg-primary/8 transition-all duration-150",
                    isMicEnabled && audioLevel > 0 ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    transform: isMicEnabled && audioLevel > 0 ? `scale(${1.5 + audioLevel * 1.2})` : 'scale(1)',
                  }}
                />
                
                {/* Main voice button */}
                <Button
                  variant={isMicEnabled ? "default" : "outline"}
                  size="icon"
                  onClick={handleMicToggle}
                  className="h-20 w-20 rounded-full relative z-10 transition-all duration-200 hover:scale-105"
                >
                  {isMicEnabled ? (
                    <Mic className="h-7 w-7" />
                  ) : (
                    <MicOff className="h-7 w-7" />
                  )}
                </Button>
              </div>

              {/* Status */}
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">
                  {isMicEnabled ? "Microphone Active" : "Microphone Muted"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isMicEnabled 
                    ? "Speak clearly and I'll assist you" 
                    : "Click microphone to enable voice input"
                  }
                </p>
              </div>

              {/* Audio Level Indicator */}
              <div className="h-6 flex items-center justify-center">
                {isMicEnabled && audioLevel > 0 && (
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => {
                      const barHeight = audioLevel > i * 0.2 ? Math.min(24, Math.floor(audioLevel * 20) + 8) : 8
                      return (
                        <div
                          key={i}
                          className="w-1 bg-primary rounded-full transition-all duration-100"
                          style={{ height: `${barHeight}px` }}
                        />
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Disconnect Button */}
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="mt-4"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Audio element for bot audio */}
      <audio 
        ref={audioElementRef}
        autoPlay 
        className="hidden"
      />
    </div>
  )
}

export function PipecatVoiceAgent({ className }: VoiceBotProps) {
  return <VoiceBot className={className} />
}