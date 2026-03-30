import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RideMap from '@/components/ride-map';
import { API_BASE_URL } from '@/constants/api';
import { Novaride } from '@/constants/theme';

type RidePoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

export default function HomeScreen() {
  const [apiResponse, setApiResponse] = useState<string>('...');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [isRiding, setIsRiding] = useState(false);
  const [ridePoints, setRidePoints] = useState<RidePoint[]>([]);
  const [rideStartTime, setRideStartTime] = useState<Date | null>(null);
  const [rideEndTime, setRideEndTime] = useState<Date | null>(null);
  const [lastPoint, setLastPoint] = useState<RidePoint | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const ridePointsRef = useRef<RidePoint[]>([]);

  useEffect(() => {
    fetch(API_BASE_URL)
      .then((res) => res.text())
      .then((text) => setApiResponse(text))
      .catch((err) => setApiResponse(`Erreur : ${err.message}`));
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission refusée');
        setLocationLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation(pos);
      setLocationLoading(false);
    })();
  }, []);

  async function startRide() {
    ridePointsRef.current = [];
    setRidePoints([]);
    setLastPoint(null);
    setRideEndTime(null);
    setUploadStatus('idle');
    setRideStartTime(new Date());
    setIsRiding(true);

    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (pos) => {
        const point: RidePoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: pos.timestamp,
        };
        ridePointsRef.current = [...ridePointsRef.current, point];
        setRidePoints(ridePointsRef.current);
        setLastPoint(point);
      },
    );
  }

  async function stopRide() {
    try {
      if (watchRef.current && typeof watchRef.current.remove === 'function') {
        watchRef.current.remove();
      }
    } catch {
      // ignore — remove() peut échouer sur Expo Web
    } finally {
      watchRef.current = null;
    }

    const endTime = new Date();
    setIsRiding(false);
    setRideEndTime(endTime);
    setUploadStatus('uploading');

    try {
      const res = await fetch(`${API_BASE_URL}/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: rideStartTime?.toISOString() ?? '',
          endTime: endTime.toISOString(),
          points: ridePointsRef.current,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUploadStatus('success');
    } catch {
      setUploadStatus('error');
    }
  }

  const fmt = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Novaride.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            {/* Logo mark — cercle orange bordé cyan, cf. HTML conic-gradient */}
            <View style={styles.logoMark} />
            <Text style={styles.brand}>NOVARIDE</Text>
          </View>
          <Text style={styles.tagline}>Performance. Liberté. Données.</Text>
        </View>

        {/* Carte */}
        <RideMap
          currentLocation={
            lastPoint ?? (location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null)
          }
          ridePoints={ridePoints}
        />

        {/* Ride en cours */}
        {isRiding && (
          <View style={[styles.card, styles.cardActive]}>
            <View style={styles.cardHeader}>
              <View style={[styles.dot, styles.dotLive]} />
              <Text style={[styles.cardTitle, { color: '#22c55e' }]}>Ride en cours</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>DÉBUT</Text>
              <Text style={styles.statValue}>{rideStartTime ? fmt(rideStartTime) : '—'}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>POINTS</Text>
              <Text style={styles.statValue}>{ridePoints.length}</Text>
            </View>
            {lastPoint && (
              <>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>LAT</Text>
                  <Text style={styles.statValue}>{lastPoint.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>LNG</Text>
                  <Text style={styles.statValue}>{lastPoint.longitude.toFixed(6)}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Résumé ride terminée */}
        {!isRiding && rideEndTime && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.dot, { backgroundColor: Novaride.secondary }]} />
              <Text style={styles.cardTitle}>Ride terminée</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>DÉBUT</Text>
              <Text style={styles.statValue}>{rideStartTime ? fmt(rideStartTime) : '—'}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>FIN</Text>
              <Text style={styles.statValue}>{fmt(rideEndTime)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>POINTS</Text>
              <Text style={styles.statValue}>{ridePoints.length}</Text>
            </View>
            {uploadStatus === 'uploading' && (
              <Text style={styles.muted}>Envoi en cours...</Text>
            )}
            {uploadStatus === 'success' && (
              <Text style={styles.uploadSuccess}>Ride enregistrée</Text>
            )}
            {uploadStatus === 'error' && (
              <Text style={styles.error}>Erreur d'envoi</Text>
            )}
          </View>
        )}

        {/* GPS Card — masquée pendant la ride */}
        {!isRiding && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.dot, { backgroundColor: Novaride.secondary }]} />
              <Text style={styles.cardTitle}>Position GPS</Text>
            </View>
            {locationLoading && (
              <Text style={styles.muted}>Récupération en cours...</Text>
            )}
            {locationError && (
              <Text style={styles.error}>{locationError}</Text>
            )}
            {location && (
              <View style={styles.coords}>
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>LAT</Text>
                  <Text style={styles.coordValue}>
                    {location.coords.latitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>LNG</Text>
                  <Text style={styles.coordValue}>
                    {location.coords.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Backend Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.dot, { backgroundColor: Novaride.primary }]} />
            <Text style={styles.cardTitle}>Statut backend</Text>
          </View>
          <Text style={styles.muted}>{apiResponse}</Text>
        </View>

        {/* CTA */}
        {isRiding ? (
          <TouchableOpacity style={[styles.cta, styles.ctaStop]} activeOpacity={0.85} onPress={stopRide}>
            <Text style={styles.ctaText}>Arrêter la ride</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.cta, locationError ? styles.ctaDisabled : null]}
            activeOpacity={0.85}
            onPress={startRide}
            disabled={!!locationError}
          >
            <Text style={styles.ctaText}>Démarrer une ride</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Novaride.bg,
  },
  scroll: {
    padding: 24,
    gap: 16,
  },

  // ── Header ────────────────────────────────────────────────────
  header: {
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  // Cercle bicolore — simplifié depuis le conic-gradient HTML
  logoMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Novaride.primary,
    borderWidth: 2,
    borderColor: Novaride.secondary,
  },
  brand: {
    fontSize: 38,
    fontWeight: '900',
    // Lettersspacing serré — HTML utilise letter-spacing: -0.02em
    letterSpacing: 2,
    color: Novaride.primary,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: Novaride.textMuted,
    textTransform: 'uppercase',
  },

  // ── Glass Cards — cf. HTML .glass-card ────────────────────────
  card: {
    // Semi-transparent — HTML: background: rgba(20,23,32,0.6), backdrop-filter: blur(20px)
    backgroundColor: Novaride.glass,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    // Bordure subtile blanche — HTML: border: 1px solid rgba(255,255,255,0.08)
    borderColor: Novaride.border,
    gap: 12,
  },
  cardActive: {
    borderColor: '#16a34a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLive: {
    backgroundColor: '#22c55e',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Novaride.textMuted,
  },

  // ── Stats ──────────────────────────────────────────────────────
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Novaride.textMuted,
    width: 52,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '300',
    color: Novaride.textMain,
    letterSpacing: 1,
  },

  // ── Text ──────────────────────────────────────────────────────
  muted: {
    fontSize: 14,
    color: Novaride.textMuted,
  },
  error: {
    fontSize: 14,
    color: '#ef4444',
  },
  uploadSuccess: {
    fontSize: 14,
    color: '#22c55e',
  },

  // ── Coords ────────────────────────────────────────────────────
  coords: {
    gap: 8,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Novaride.secondary,
    width: 32,
  },
  coordValue: {
    fontSize: 22,
    fontWeight: '300',
    color: Novaride.textMain,
    letterSpacing: 1,
  },

  // ── CTA — cf. HTML .btn .btn-primary (pill + glow) ────────────
  cta: {
    marginTop: 8,
    backgroundColor: Novaride.primary,
    // Pill shape — HTML: border-radius: 50px
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    // Glow — HTML: box-shadow: 0 4px 20px rgba(255,94,0,0.4)
    shadowColor: Novaride.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaStop: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  ctaDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#fff',
  },
});
