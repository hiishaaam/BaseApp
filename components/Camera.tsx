import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  autoCapture?: boolean;
  label?: string;
  isProcessing?: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, autoCapture = false, isProcessing = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: "user" 
          } 
        });
        
        currentStream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError('');
      } catch (err) {
        console.error("Camera Error", err);
        setError('Camera access denied or unavailable.');
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Ensure canvas matches video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      // Flip horizontally to match the mirrored video preview
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      onCapture(canvas.toDataURL('image/jpeg', 0.85));
    }
  }, [onCapture]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (autoCapture && isReady && !isProcessing) {
       timeout = setTimeout(capture, 2000);
    }
    return () => clearTimeout(timeout);
  }, [autoCapture, isReady, capture, isProcessing]);

  if (error) {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <CameraIcon className="w-12 h-12 mb-4 opacity-50" />
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition">Retry</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onCanPlay={() => setIsReady(true)}
        className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isProcessing ? 'opacity-40 blur-sm' : 'opacity-100'}`}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Scanning Line Animation (Auto Mode) */}
      {isReady && !isProcessing && autoCapture && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent absolute top-0 animate-scan shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
        </div>
      )}

      {/* Manual Capture Button (Manual Mode) */}
      {isReady && !isProcessing && !autoCapture && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
          <button 
            onClick={(e) => { e.preventDefault(); capture(); }}
            className="w-16 h-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-all active:scale-95 group/btn"
            title="Take Photo"
          >
            <div className="w-12 h-12 rounded-full bg-white group-hover/btn:scale-90 transition-transform shadow-lg" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Camera;