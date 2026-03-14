import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Printer,
  Camera,
  CameraOff,
} from "lucide-react";
import { format } from "date-fns";
import api from "../../services/api";
import toast from "react-hot-toast";
import { printEventBadge } from "./badgeUtils";

const IDLE = "idle";
const SUCCESS = "success";
const ALREADY = "already";
const ERROR = "error";

export default function CheckinPage() {
  const { id: eventId } = useParams();
  const [qrToken, setQrToken] = useState("");
  const [result, setResult] = useState(null);
  const [state, setState] = useState(IDLE);
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastScanAtRef = useRef(0);

  const submit = useCallback(
    async (token) => {
      const t = token.trim();
      if (!t) return;
      const normalizedCode = /^reg-/i.test(t) ? t.toUpperCase() : t;
      setLoading(true);
      setState(IDLE);
      setResult(null);
      try {
        const res = await api.post(`/events/${eventId}/checkin`, {
          qrToken: normalizedCode,
        });
        const { registration, alreadyCheckedIn } = res.data.data;
        setResult(registration);
        setState(alreadyCheckedIn ? ALREADY : SUCCESS);
        if (!alreadyCheckedIn) toast.success("Check-in successful!");
      } catch (err) {
        setState(ERROR);
        setResult({
          errorMessage: err.response?.data?.message || "Invalid or not found",
        });
        toast.error(err.response?.data?.message || "Check-in failed");
      } finally {
        setLoading(false);
        setQrToken("");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [eventId],
  );

  const printBadge = useCallback(() => {
    if (!result || state === ERROR) return;

    const printed = printEventBadge({
      attendeeName:
        `${result.attendee?.firstName || ""} ${result.attendee?.lastName || ""}`.trim(),
      attendeeEmail: result.attendee?.email,
      eventName: result.eventId?.name || "Event Check-In",
      ticketName: result.ticketTypeId?.name,
      registrationNumber: result.registrationNumber,
      qrValue: result.qrToken || result.registrationNumber,
      quantity: result.quantity,
      accentColor: state === ALREADY ? "#d97706" : "#2563eb",
    });

    if (!printed) {
      toast.error("Popup blocked. Please allow popups to print badge.");
    }
  }, [result, state]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");

    if (!("BarcodeDetector" in window)) {
      setCameraError("Camera scanning is not supported in this browser.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available on this device.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch {
      setCameraError("Unable to access camera. Check camera permissions.");
    }
  }, []);

  useEffect(() => {
    if (!isCameraActive) return;

    const detector = new window.BarcodeDetector({
      formats: ["qr_code"],
    });

    const scan = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const now = Date.now();
      if (now - lastScanAtRef.current < 800) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0 && barcodes[0]?.rawValue) {
              lastScanAtRef.current = now;
              const value = String(barcodes[0].rawValue || "").trim();
              if (value) {
                submit(value);
                stopCamera();
                return;
              }
            }
          } catch {
            setCameraError("Unable to read QR code from camera stream.");
          }
        }
      }

      rafRef.current = requestAnimationFrame(scan);
    };

    rafRef.current = requestAnimationFrame(scan);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isCameraActive, submit, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const reset = () => {
    setState(IDLE);
    setResult(null);
    setQrToken("");
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col gap-5 px-3 pb-8 pt-4 sm:px-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-sm">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
          <QrCode className="h-5 w-5 text-blue-400" />
          Check-in Scanner
        </h2>

        <p className="text-slate-400 text-sm">
          Scan an attendee&apos;s QR code or type a registration number (e.g.
          REG-ABC123). Press Enter to check in quickly.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-300">Camera Scanner</p>
          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-700/40 bg-rose-900/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/30"
            >
              <CameraOff className="h-4 w-4" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-700/40 bg-blue-900/20 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-900/30"
            >
              <Camera className="h-4 w-4" />
              Start Camera
            </button>
          )}
        </div>

        {cameraError && <p className="text-xs text-rose-300">{cameraError}</p>}

        <div className="overflow-hidden rounded-lg border border-slate-700 bg-black/60">
          {isCameraActive ? (
            <video
              ref={videoRef}
              className="h-64 w-full object-cover sm:h-72"
              muted
              playsInline
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-slate-500 sm:h-72">
              Camera preview will appear here
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Token input */}
      <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur-sm sm:sticky sm:bottom-4">
        <label className="block text-sm text-slate-400">
          QR Token / Registration #
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={inputRef}
            autoFocus
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit(qrToken);
              if (e.key === "Escape") reset();
            }}
            placeholder="Scan QR token or enter registration #"
            className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono text-sm"
          />
          <button
            onClick={() => submit(qrToken)}
            disabled={loading || !qrToken.trim()}
            className="rounded-xl bg-blue-600 px-4 py-3 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors sm:min-w-36"
          >
            {loading ? "…" : "Check In"}
          </button>
        </div>
      </div>

      {/* Result card */}
      {state !== IDLE && result && (
        <div
          className={`rounded-2xl border p-5 space-y-3 shadow-xl ${
            state === SUCCESS
              ? "border-green-700 bg-green-950/40"
              : state === ALREADY
                ? "border-amber-700 bg-amber-950/40"
                : "border-rose-700 bg-rose-950/40"
          }`}
        >
          <div className="flex items-center gap-2">
            {state === SUCCESS && (
              <CheckCircle className="h-6 w-6 text-green-400" />
            )}
            {state === ALREADY && (
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            )}
            {state === ERROR && <XCircle className="h-6 w-6 text-rose-400" />}
            <span className="font-semibold text-white">
              {state === SUCCESS && "Check-in Successful"}
              {state === ALREADY && "Already Checked In"}
              {state === ERROR && "Check-in Failed"}
            </span>
          </div>

          {state !== ERROR ? (
            <dl className="space-y-1.5 text-sm">
              {[
                ["Reg #", result.registrationNumber],
                [
                  "Name",
                  `${result.attendee?.firstName} ${result.attendee?.lastName || ""}`.trim(),
                ],
                ["Email", result.attendee?.email],
                ["Ticket", result.ticketTypeId?.name ?? "—"],
                ["Qty", result.quantity],
                state === ALREADY && result.checkedInAt
                  ? [
                      "Checked in at",
                      format(new Date(result.checkedInAt), "PPP p"),
                    ]
                  : null,
              ]
                .filter(Boolean)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-slate-400">{label}</dt>
                    <dd className="text-white text-right">{value}</dd>
                  </div>
                ))}
            </dl>
          ) : (
            <p className="text-rose-300 text-sm">{result.errorMessage}</p>
          )}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Scan Next
            </button>

            {state !== ERROR && (
              <button
                onClick={printBadge}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-700/40 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-300 hover:text-blue-200 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print Badge
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
