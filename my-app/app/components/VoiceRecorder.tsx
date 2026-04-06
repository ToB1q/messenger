// app/components/VoiceRecorder.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './VoiceRecorder.module.css';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    startRecording();
    
    return () => {
      stopAllTracks();
    };
  }, []);

  const stopAllTracks = () => {
    console.log('🛑 Останавливаем все треки микрофона');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Ошибка при остановке MediaRecorder:', e);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          console.log('🎤 Трек микрофона остановлен');
        } catch (e) {
          console.error('Ошибка при остановке трека:', e);
        }
      });
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.error('Ошибка при закрытии AudioContext:', e);
      }
      audioContextRef.current = null;
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        console.error('Ошибка при отключении источника:', e);
      }
      sourceRef.current = null;
    }

    analyserRef.current = null;
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Запрос доступа к микрофону...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      console.log('✅ Микрофон получен');
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      analyserRef.current = analyser;
      
      // Используем MIME тип, который поддерживает сервер
      let mimeType = 'audio/mp4';
      if (!MediaRecorder.isTypeSupported('audio/mp4')) {
        if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        } else if (MediaRecorder.isTypeSupported('audio/m4a')) {
          mimeType = 'audio/m4a';
        } else {
          console.warn('Audio/mp4 not supported, will need conversion');
          mimeType = 'audio/webm';
        }
      }
      
      console.log('📼 Используем MIME тип:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setDuration(seconds);
        
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const avg = sum / dataArray.length;
          const normalized = Math.min(31, Math.floor(avg / 8));
          
          setWaveform(prev => {
            const newWaveform = [...prev, normalized];
            if (newWaveform.length > 50) {
              return newWaveform.slice(-50);
            }
            return newWaveform;
          });
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Не удалось получить доступ к микрофону');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ Останавливаем запись');
      
      // Останавливаем таймер
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Устанавливаем обработчик на stop для сбора данных
      mediaRecorderRef.current.onstop = () => {
        console.log('⏹️ MediaRecorder остановлен, собираем данные');
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/mp4' });
        console.log('✅ Голосовое записано, размер:', audioBlob.size, 'тип:', audioBlob.type);
        
        // Останавливаем треки
        stopAllTracks();
        
        // Отправляем голосовое
        onSend(audioBlob, duration, waveform);
      };
      
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    console.log('❌ Отмена записи');
    
    // Просто останавливаем все без отправки
    stopAllTracks();
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.voiceRecorder}>
      <div className={styles.recorderHeader}>
        <button className={styles.cancelButton} onClick={cancelRecording}>
          ✕
        </button>
        <span className={styles.recordingIndicator}>
          {isRecording && <span className={styles.recordingDot}></span>}
          Запись...
        </span>
        <button 
          className={styles.sendButton} 
          onClick={stopRecording}
          disabled={duration === 0}
        >
          ✓
        </button>
      </div>

      <div className={styles.waveformContainer}>
        <div className={styles.waveform}>
          {waveform.map((value, index) => (
            <div
              key={index}
              className={styles.waveformBar}
              style={{ height: `${(value / 31) * 40}px` }}
            />
          ))}
        </div>
        <span className={styles.duration}>{formatDuration(duration)}</span>
      </div>
    </div>
  );
}