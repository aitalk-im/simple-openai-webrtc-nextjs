'use client';

import { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  audioStream: MediaStream;
}

export default function AudioPlayer({ audioStream }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    // 直接设置音频源
    audioRef.current.srcObject = audioStream;
    audioRef.current.autoplay = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, [audioStream]);

  return <audio ref={audioRef} autoPlay />;
}