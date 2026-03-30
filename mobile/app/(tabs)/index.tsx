import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/constants/api';
import { Novaride } from '@/constants/theme';

export default function HomeScreen() {
  const [apiResponse, setApiResponse] = useState<string>('...');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Novaride.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>NOVARIDE</Text>
          <Text style={styles.tagline}>Performance. Liberté. Données.</Text>
        </View>

        {/* GPS Card */}
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

        {/* Backend Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.dot, { backgroundColor: Novaride.primary }]} />
            <Text style={styles.cardTitle}>Statut backend</Text>
          </View>
          <Text style={styles.muted}>{apiResponse}</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.cta} activeOpacity={0.8} disabled>
          <Text style={styles.ctaText}>Démarrer une ride</Text>
        </TouchableOpacity>

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
  header: {
    marginBottom: 8,
  },
  brand: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 6,
    color: Novaride.primary,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 2,
    color: Novaride.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Novaride.panel,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Novaride.border,
    gap: 12,
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
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Novaride.textMuted,
  },
  muted: {
    fontSize: 14,
    color: Novaride.textMuted,
  },
  error: {
    fontSize: 14,
    color: '#ef4444',
  },
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
  cta: {
    marginTop: 8,
    backgroundColor: Novaride.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    opacity: 0.4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#fff',
  },
});
