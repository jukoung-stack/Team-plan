import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBlobUrl: string, fileName: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access denied or not available:', err);
      setCameraError('카메라 장치에 접근할 수 없습니다. 아래 사진 파일 선택을 이용해주세요.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;
    const fileName = `현장촬영_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}.jpg`;
    onCapture(capturedImage, fileName);
    onClose();
  };

  const handleFileUploadFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setCapturedImage(reader.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-base">현장 사진 즉시 촬영</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div className="relative aspect-4/3 w-full bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="촬영된 현장 사진"
              className="h-full w-full object-contain"
            />
          ) : cameraError ? (
            <div className="p-6 text-center text-slate-300">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
              <p className="text-sm font-medium mb-3">{cameraError}</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500 transition">
                <span>갤러리 / 파일에서 사진 선택</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUploadFallback}
                />
              </label>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {/* Viewfinder grid lines */}
              <div className="pointer-events-none absolute inset-0 border border-white/20">
                <div className="h-full w-full grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-white/15" />
                  <div className="border-r border-white/15" />
                  <div />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-950 flex items-center justify-between">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={retakePhoto}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                <RefreshCw className="h-4 w-4" />
                <span>다시 촬영</span>
              </button>
              <button
                type="button"
                onClick={confirmPhoto}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition"
              >
                <Check className="h-4 w-4" />
                <span>사진 첨부하기</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="rounded-xl bg-slate-800 p-2.5 text-slate-300 hover:bg-slate-700 transition"
                title="카메라 전환"
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={takePhoto}
                disabled={!!cameraError}
                className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-700 bg-white shadow-lg active:scale-95 disabled:opacity-40 transition"
                title="촬영 버튼"
              >
                <div className="h-10 w-10 rounded-full bg-blue-600" />
              </button>

              <label className="cursor-pointer rounded-xl bg-slate-800 p-2.5 text-slate-300 hover:bg-slate-700 transition" title="파일 선택">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUploadFallback}
                />
                <span className="text-xs font-medium">갤러리</span>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
