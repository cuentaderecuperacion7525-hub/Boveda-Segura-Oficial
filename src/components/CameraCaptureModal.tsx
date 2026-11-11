import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCw, AlertCircle, Check, Video, Circle, Square } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaCaptured: (buffer: ArrayBuffer, mimeType: string, filename: string) => Promise<void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
  initialMode?: 'photo' | 'video';
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onMediaCaptured,
  showToast,
  initialMode = 'photo',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<'photo' | 'video'>('photo');

  useEffect(() => {
    if (isOpen && initialMode) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasCameraError, setHasCameraError] = useState(false);

  // Photo capture preview
  const [capturedBlobUrl, setCapturedBlobUrl] = useState<string | null>(null);
  const [tempBuffer, setTempBuffer] = useState<ArrayBuffer | null>(null);
  const [capturedMime, setCapturedMime] = useState<string>('image/jpeg');

  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetCaptures();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const resetCaptures = () => {
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
    }
    setCapturedBlobUrl(null);
    setTempBuffer(null);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const startCamera = async (fMode: 'user' | 'environment') => {
    stopCamera();
    setHasCameraError(false);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: fMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true, // For videos
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch {
      // Try again without audio if audio permissions failed
      try {
        const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: fMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        setStream(videoOnlyStream);
        if (videoRef.current) {
          videoRef.current.srcObject = videoOnlyStream;
        }
      } catch (err) {
        console.warn('Camera access denied:', err);
        setHasCameraError(true);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // PHOTO CAPTURE
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      blob.arrayBuffer().then((buffer) => {
        setTempBuffer(buffer);
        setCapturedMime('image/jpeg');
        const url = URL.createObjectURL(blob);
        setCapturedBlobUrl(url);
      });
    }, 'image/jpeg', 0.92);
  };

  // VIDEO RECORDING
  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];

    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
        const buffer = await blob.arrayBuffer();
        setTempBuffer(buffer);
        setCapturedMime(recorder.mimeType || 'video/webm');
        const url = URL.createObjectURL(blob);
        setCapturedBlobUrl(url);
      };

      recorder.start(500); // 500ms chunk slices
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting video recording:', err);
      showToast('No se pudo iniciar la grabación de video', 'error');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleConfirmSave = async () => {
    if (!tempBuffer) return;
    setIsSaving(true);
    try {
      const isVideoType = mode === 'video' || capturedMime.startsWith('video');
      const ext = isVideoType ? 'mp4' : 'jpg';
      const filename = `${isVideoType ? 'video' : 'foto'}_camara_${Date.now()}.${ext}`;
      await onMediaCaptured(tempBuffer, capturedMime, filename);
      showToast(isVideoType ? 'Video cifrado y guardado con éxito' : 'Foto cifrada y guardada con éxito', 'success');
      onClose();
    } catch (err) {
      console.error('Error saving captured media:', err);
      showToast('Error al cifrar el archivo', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between z-10 px-2 py-1">
        {/* Mode switcher tabs */}
        <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => {
              if (!isRecording) {
                setMode('photo');
                resetCaptures();
              }
            }}
            disabled={isRecording}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              mode === 'photo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Foto</span>
          </button>
          <button
            onClick={() => {
              if (!isRecording) {
                setMode('video');
                resetCaptures();
              }
            }}
            disabled={isRecording}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              mode === 'video' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video</span>
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={isRecording}
          className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewfinder Stage */}
      <div className="relative flex-1 flex items-center justify-center my-2 overflow-hidden rounded-3xl bg-slate-950 border border-slate-800/80">
        <canvas ref={canvasRef} className="hidden" />

        {/* Captured Preview */}
        {capturedBlobUrl ? (
          mode === 'video' || capturedMime.startsWith('video') ? (
            <video
              src={capturedBlobUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={capturedBlobUrl}
              alt="Captura"
              className="w-full h-full object-contain"
            />
          )
        ) : hasCameraError ? (
          <div className="text-center p-6 max-w-xs text-slate-400 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-200">Cámara no disponible</h4>
            <p className="text-xs">
              Verifica los permisos del navegador o selecciona archivos multimedia desde tu galería.
            </p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
          />
        )}

        {/* Video recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-rose-600/90 text-white px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-lg animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>REC {formatTimer(recordingSeconds)}</span>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="py-4 flex items-center justify-around max-w-sm mx-auto w-full z-10">
        {capturedBlobUrl ? (
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={resetCaptures}
              disabled={isSaving}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-2xl transition-colors"
            >
              Repetir
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={isSaving}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Cifrando...' : 'Guardar Cifrado'}</span>
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={switchCamera}
              disabled={hasCameraError || isRecording}
              className="p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors disabled:opacity-30"
              title="Cambiar Cámara"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Shutter / Record Button */}
            {mode === 'photo' ? (
              <button
                onClick={capturePhoto}
                disabled={hasCameraError}
                className="w-18 h-18 rounded-full border-4 border-white/80 p-1 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
                title="Tomar Foto"
              >
                <div className="w-full h-full bg-white rounded-full hover:bg-slate-200 transition-colors" />
              </button>
            ) : isRecording ? (
              <button
                onClick={stopRecording}
                className="w-18 h-18 rounded-full border-4 border-rose-500 p-1 flex items-center justify-center active:scale-95 transition-transform"
                title="Detener Grabación"
              >
                <div className="w-8 h-8 bg-rose-600 rounded-lg shadow-md shadow-rose-600/50" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={hasCameraError}
                className="w-18 h-18 rounded-full border-4 border-rose-500/80 p-1 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
                title="Iniciar Grabación de Video"
              >
                <div className="w-full h-full bg-rose-600 rounded-full hover:bg-rose-500 transition-colors" />
              </button>
            )}

            <div className="w-12" />
          </>
        )}
      </div>
    </div>
  );
};
