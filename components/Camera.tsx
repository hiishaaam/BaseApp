import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  autoCapture?: boolean;
  label?: string;
  isProcessing?: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, autoCapture = false, isProcessing = false, label }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: "user" 
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera Error", err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
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

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onCanPlay={() => setIsReady(true)}
        className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isProcessing ? 'opacity-40 blur-sm' : 'opacity-100'}`}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Scanning Line Animation */}
      {isReady && !isProcessing && autoCapture && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent absolute top-0 animate-scan shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
        </div>
      )}

      {/* Manual Capture Control */}
      {isReady && !autoCapture && !isProcessing && (
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center justify-center gap-2 z-20">
           {label && <span className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md mb-2">{label}</span>}
           <button 
             onClick={capture}
             className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all"
             type="button"
           >
             <div className="w-12 h-12 rounded-full bg-white group-active:scale-90 transition-transform" />
           </button>
        </div>
      )}
    </div>
  );
};

export default Camera;