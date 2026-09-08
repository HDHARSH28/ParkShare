import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  Car,
  Clock,
  User,
  MapPin,
  RefreshCw,
  LogOut,
  LogIn,
  Search,
  ShieldCheck,
  History,
} from 'lucide-react';
import { checkInBooking, checkOutBooking } from '../../services/bookingService';

const HostScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('auto'); // 'auto', 'checkin', 'checkout'
  const [recentLogs, setRecentLogs] = useState([]);
  const [cameraError, setCameraError] = useState('');

  const html5QrCodeRef = useRef(null);
  const isStartingRef = useRef(false);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (isStartingRef.current || scanning) return;
    isStartingRef.current = true;
    setCameraError('');
    setError('');

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('host-qr-reader');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Pause camera when a code is detected to avoid rapid multiple triggers
          handleCodeScanned(decodedText);
        },
        () => {
          // Frame parse error - ignore standard noise
        }
      );

      setScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError(
        'Unable to access device camera. Please check permissions or use manual code entry.'
      );
      setScanning(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  /**
   * Process a scanned or typed code
   */
  const processPayload = async (payloadString, explicitAction = null) => {
    setError('');
    setActionResult(null);
    setProcessing(true);

    // Temporarily pause camera while processing
    if (scanning) {
      await stopCamera();
    }

    try {
      const targetMode = explicitAction || mode;
      let res;

      if (targetMode === 'checkout') {
        res = await checkOutBooking({ qrData: payloadString });
      } else if (targetMode === 'checkin') {
        res = await checkInBooking({ qrData: payloadString });
      } else {
        // Auto mode: attempt check-in first; if backend says already active, attempt check-out
        try {
          res = await checkInBooking({ qrData: payloadString });
        } catch (firstErr) {
          const errMsg = firstErr.response?.data?.message || '';
          if (
            errMsg.toLowerCase().includes('already checked in') ||
            errMsg.toLowerCase().includes('active')
          ) {
            res = await checkOutBooking({ qrData: payloadString });
          } else {
            throw firstErr;
          }
        }
      }

      if (res.success) {
        const booking = res.data.booking;
        const resultInfo = {
          type: booking.status === 'COMPLETED' ? 'CHECK_OUT' : 'CHECK_IN',
          message: res.message,
          booking,
          timestamp: new Date(),
        };

        setActionResult(resultInfo);
        setRecentLogs((prev) => [resultInfo, ...prev.slice(0, 9)]);
        setManualCode('');
      }
    } catch (err) {
      console.error('Check-in/out error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to process booking. Verify parking ownership and QR pass validity.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCodeScanned = (decodedText) => {
    processPayload(decodedText);
  };

  const handleManualSubmit = (e, forcedAction = null) => {
    e?.preventDefault();
    if (!manualCode.trim()) return;
    processPayload(manualCode.trim(), forcedAction);
  };

  const resetScanner = () => {
    setActionResult(null);
    setError('');
    startCamera();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          <QrCode className="w-4 h-4 text-primary-600" />
          Host Check-In & Check-Out Terminal
        </div>
        <h1 className="text-3xl font-bold text-surface-900">Scan Driver Entry Pass</h1>
        <p className="text-surface-600 mt-1 max-w-md mx-auto text-sm">
          Scan the driver's QR pass upon vehicle arrival to check in, and scan again upon departure to complete checkout.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1 bg-surface-100 rounded-xl border border-surface-200">
          <button
            onClick={() => setMode('auto')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'auto'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            Smart Auto Detect
          </button>
          <button
            onClick={() => setMode('checkin')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'checkin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            Check-In Only
          </button>
          <button
            onClick={() => setMode('checkout')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'checkout'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            Check-Out Only
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Camera & Action Result */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Scanner Box */}
          <div className="bg-white rounded-3xl border border-surface-200 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-surface-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary-600" />
                Live Camera Barcode Reader
              </h2>
              <button
                onClick={scanning ? stopCamera : startCamera}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  scanning
                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                    : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                }`}
              >
                {scanning ? (
                  <>
                    <CameraOff className="w-4 h-4" /> Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> Start Camera
                  </>
                )}
              </button>
            </div>

            {/* Video Feed Viewfinder */}
            <div className="relative rounded-2xl overflow-hidden bg-surface-900 aspect-square max-w-sm mx-auto flex items-center justify-center border-2 border-surface-800 shadow-inner">
              <div id="host-qr-reader" className="w-full h-full" />

              {!scanning && (
                <div className="absolute inset-0 bg-surface-900/90 flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mb-3 text-surface-400">
                    <QrCode className="w-8 h-8 text-primary-400" />
                  </div>
                  <p className="text-white text-sm font-semibold mb-1">Camera is Paused</p>
                  <p className="text-surface-400 text-xs mb-4 max-w-xs">
                    Click Start Camera to begin scanning driver booking passes in real-time.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-600/30 transition"
                  >
                    Activate Camera
                  </button>
                </div>
              )}

              {scanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary-400/80 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary-500 -mt-1 -ml-1 rounded-tl" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary-500 -mt-1 -mr-1 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary-500 -mb-1 -ml-1 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary-500 -mb-1 -mr-1 rounded-br" />
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Processing Indicator */}
          {processing && (
            <div className="p-6 bg-white rounded-3xl border border-primary-200 shadow-sm flex items-center justify-center gap-3 text-primary-700">
              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold text-sm">Validating booking security credentials...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-3xl shadow-sm text-red-800 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">Action Failed</h3>
                <p className="text-xs mt-1 text-red-700 leading-relaxed">{error}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={resetScanner}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Result Modal / Card */}
          {actionResult && (
            <div className="p-6 bg-white border-2 border-emerald-400 rounded-3xl shadow-lg animate-fade-in space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 text-base">
                      {actionResult.type === 'CHECK_IN'
                        ? 'Vehicle Successfully Checked In!'
                        : 'Vehicle Successfully Checked Out!'}
                    </h3>
                    <p className="text-xs text-emerald-700 font-medium">{actionResult.message}</p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    actionResult.type === 'CHECK_IN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {actionResult.booking?.status}
                </span>
              </div>

              {/* Scanned Booking Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-50 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-surface-600 block">Driver Name</span>
                  <p className="font-bold text-surface-900 text-sm">
                    {actionResult.booking?.user?.name}
                  </p>
                  <p className="text-surface-600 text-[11px]">{actionResult.booking?.user?.phone}</p>
                </div>

                <div>
                  <span className="text-surface-600 block">Registered Vehicle</span>
                  <p className="font-mono font-bold text-surface-900 text-sm">
                    {actionResult.booking?.vehicle?.vehicleNumber}
                  </p>
                  <p className="text-surface-600 text-[11px]">
                    {actionResult.booking?.vehicle?.model} ({actionResult.booking?.vehicle?.vehicleType})
                  </p>
                </div>

                <div>
                  <span className="text-surface-600 block">Parking Spot</span>
                  <p className="font-semibold text-surface-800">
                    {actionResult.booking?.parkingSpace?.title}
                  </p>
                </div>

                <div>
                  <span className="text-surface-600 block">Timestamp</span>
                  <p className="font-medium text-surface-800">
                    {new Date(
                      actionResult.type === 'CHECK_IN'
                        ? actionResult.booking?.checkInTime
                        : actionResult.booking?.checkOutTime
                    ).toLocaleTimeString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={resetScanner}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan Next Vehicle</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Manual Entry & History */}
        <div className="space-y-6">
          {/* Manual Input Fallback */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 shadow-sm">
            <h3 className="font-bold text-surface-900 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary-600" />
              Manual Code Lookup
            </h3>
            <p className="text-xs text-surface-600 mb-4">
              If the camera is unavailable or the driver's screen is dim, enter the 6-character booking code or paste the QR pass string.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="e.g. PARK-A1B2C3 or Token"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => handleManualSubmit(e, 'checkin')}
                  disabled={processing || !manualCode.trim()}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Check In</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleManualSubmit(e, 'checkout')}
                  disabled={processing || !manualCode.trim()}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check Out</span>
                </button>
              </div>
            </form>
          </div>

          {/* Verification Rules Information */}
          <div className="p-5 bg-surface-50 rounded-3xl border border-surface-200 text-xs text-surface-600 space-y-2">
            <div className="font-bold text-surface-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Automated Verification Rules
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-surface-600">
              <li>Driver must have a completed & paid reservation.</li>
              <li>Booking must match your listed parking location.</li>
              <li>Cannot check in cancelled or duplicate passes.</li>
              <li>Check-in is permitted starting 2 hours before the start time.</li>
              <li>Check-out requires an ACTIVE in-progress booking.</li>
            </ul>
          </div>

          {/* Recent Activity Log */}
          {recentLogs.length > 0 && (
            <div className="bg-white rounded-3xl border border-surface-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-surface-900 text-xs">
                <History className="w-4 h-4 text-primary-600" />
                <span>Recent Scans Today ({recentLogs.length})</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                {recentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-surface-50 border border-surface-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-surface-800">
                        {log.booking?.vehicle?.vehicleNumber || 'Vehicle'}
                      </p>
                      <p className="text-[10px] text-surface-600">
                        {log.booking?.user?.name} • {log.timestamp.toLocaleTimeString('en-IN')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        log.type === 'CHECK_IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {log.type === 'CHECK_IN' ? 'CHECKED IN' : 'CHECKED OUT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostScanner;
