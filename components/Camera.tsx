import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  autoCapture?: boolean;
  label?: string;
  isProcessing?: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, autoCapture = false, label = "Capture Photo", isProcessing = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
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
      setError('');
    } catch (err) {
      console.error("Camera Error", err);
      setError("Camera access denied or unavailable.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCanPlay = () => {
    setIsReady(true);
  };

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(imageSrc);
    }
  }, [onCapture]);

  // Auto capture effect (only runs once when ready if autoCapture is true)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (autoCapture && isReady && !isProcessing) {
       // Wait 2 seconds for camera to adjust exposure then capture
       timeout = setTimeout(() => {
         capture();
       }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [autoCapture, isReady, capture, isProcessing]);

  return (
    <div className="relative w-full max-w-lg mx-auto bg-black rounded-xl overflow-hidden shadow-2xl">
      {error ? (
        <div className="h-64 flex flex-col items-center justify-center text-red-500 p-6 text-center">
           <AlertCircle className="w-12 h-12 mb-2" />
           <p>{error}</p>
           <button onClick={startCamera} className="mt-4 px-4 py-2 bg-slate-800 rounded text-white text-sm">Retry</button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={handleCanPlay}
            className={`w-full h-auto object-cover transform scale-x-[-1] ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay Grid for Face Positioning */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-48 h-64 border-2 border-white/50 rounded-full border-dashed"></div>
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
             {!autoCapture && (
               <button 
                 onClick={capture}
                 disabled={!isReady || isProcessing}
                 className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition shadow-lg
                   ${!isReady || isProcessing 
                     ? 'bg-gray-500 cursor-not-allowed text-gray-300' 
                     : 'bg-white text-blue-600 hover:bg-blue-50'}
                 `}
               >
                 {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CameraIcon className="w-5 h-5" />}
                 <span>{isProcessing ? 'Processing...' : label}</span>
               </button>
             )}
             
             {autoCapture && isProcessing && (
                <div className="bg-black/70 text-white px-4 py-2 rounded-full flex items-center space-x-2">
                   <RefreshCw className="w-4 h-4 animate-spin" />
                   <span className="text-sm">Verifying Identity...</span>
                </div>
             )}
          </div>
        </>
      )}
    </div>
  );
};

export default Camera;