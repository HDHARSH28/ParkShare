import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { Navigation, Compass, ExternalLink, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom parking spot marker icon
const parkingIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Glowing custom user location radar marker
const userLocationIcon = new L.DivIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 32px; height: 32px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 22px; height: 22px; background: rgba(59, 130, 246, 0.4); border-radius: 50%;"></div>
      <div style="position: relative; width: 14px; height: 14px; background: #2563eb; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

/**
 * Calculates Haversine distance in km between two lat/lng pairs
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

/**
 * Map controller: handles initial bounds fitting and flying to user location
 */
const MapController = ({ parkingSpaces, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, {
        animate: true,
        duration: 1.2,
      });
    } else if (parkingSpaces.length > 0) {
      const bounds = L.latLngBounds(
        parkingSpaces.map((p) => [p.latitude, p.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [userLocation, parkingSpaces, map]);

  return null;
};

const ParkingMap = ({
  parkingSpaces = [],
  userLocation = null,
  onDetectLocation = null,
  detectingLocation = false,
  className = '',
}) => {
  // Default center: user location, first spot, or India center
  const defaultCenter = [20.5937, 78.9629];
  const center = userLocation?.lat
    ? [userLocation.lat, userLocation.lng]
    : parkingSpaces.length > 0
    ? [parkingSpaces[0].latitude, parkingSpaces[0].longitude]
    : defaultCenter;

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-surface-200 shadow-sm ${className}`}>
      {/* Floating GPS Location Detection Control */}
      {onDetectLocation && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={detectingLocation}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 text-xs font-bold rounded-2xl shadow-lg border border-slate-200/80 hover:shadow-xl hover:border-primary-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 cursor-pointer"
            title="Detect my current location"
          >
            {detectingLocation ? (
              <>
                <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                <span>Detecting GPS...</span>
              </>
            ) : userLocation ? (
              <>
                <Navigation className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span>Re-center on Me</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-primary-600 animate-pulse" />
                <span>Detect My Location</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* User Location Detected Banner */}
      {userLocation && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
          <span>
            Location Active {userLocation.accuracy ? `(±${userLocation.accuracy}m)` : ''}
          </span>
        </div>
      )}

      {parkingSpaces.length === 0 && !userLocation ? (
        <div className="h-full min-h-[400px] bg-surface-100 flex items-center justify-center text-surface-700">
          No parking locations to display
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%', minHeight: '420px' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController parkingSpaces={parkingSpaces} userLocation={userLocation} />

          {/* User Live GPS Marker */}
          {userLocation?.lat && userLocation?.lng && (
            <>
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <p className="font-bold text-blue-700 flex items-center gap-1 text-sm mb-1">
                      <Navigation className="w-3.5 h-3.5 fill-blue-600" />
                      You Are Here
                    </p>
                    <p className="text-slate-600">
                      Showing closest available parking spots near your current position.
                    </p>
                  </div>
                </Popup>
              </Marker>
              {userLocation.accuracy && (
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={userLocation.accuracy}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#60a5fa',
                    fillOpacity: 0.15,
                    weight: 1,
                  }}
                />
              )}
            </>
          )}

          {/* Parking Spots Markers */}
          {parkingSpaces.map((parking) => {
            const dist = userLocation
              ? calculateDistanceKm(
                  userLocation.lat,
                  userLocation.lng,
                  parking.latitude,
                  parking.longitude
                )
              : parking.distanceKm !== undefined
              ? parking.distanceKm
              : null;

            return (
              <Marker
                key={parking._id}
                position={[parking.latitude, parking.longitude]}
                icon={parkingIcon}
              >
                <Popup>
                  <div className="min-w-[210px] p-1 space-y-1.5">
                    <Link
                      to={`/parking/${parking._id}`}
                      className="font-bold text-sm text-slate-900 leading-tight hover:text-primary-600 block transition-colors cursor-pointer"
                    >
                      {parking.title}
                    </Link>
                    <p className="text-xs text-slate-600 line-clamp-1">{parking.address}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      {parking.pricePerHour > 0 && (
                        <p className="text-sm font-extrabold text-primary-600">
                          ₹{parking.pricePerHour}
                          <span className="text-[10px] font-normal text-slate-500">/hr</span>
                        </p>
                      )}
                      {dist !== null && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-[11px] border border-blue-100">
                          📍 {dist} km away
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Link
                        to={`/parking/${parking._id}`}
                        className="flex-1 py-1 px-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold text-center transition"
                      >
                        Book Spot →
                      </Link>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition"
                        title="Directions in Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
};

export default ParkingMap;
