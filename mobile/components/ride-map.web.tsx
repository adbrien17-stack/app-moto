import { StyleSheet, Text, View } from 'react-native';

import { Novaride } from '@/constants/theme';

type RidePoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

type Props = {
  currentLocation: { latitude: number; longitude: number } | null;
  ridePoints: RidePoint[];
};

export default function RideMap({ currentLocation, ridePoints }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>CARTE</Text>
      <Text style={styles.notice}>Carte non disponible sur web</Text>
      {currentLocation && (
        <Text style={styles.coords}>
          {currentLocation.latitude.toFixed(5)},{'  '}
          {currentLocation.longitude.toFixed(5)}
        </Text>
      )}
      {ridePoints.length > 0 && (
        <Text style={styles.points}>{ridePoints.length} points enregistrés</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Glass card — correspond au HTML .glass-card
    backgroundColor: Novaride.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Novaride.border,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Novaride.textMuted,
  },
  notice: {
    fontSize: 13,
    color: Novaride.textMuted,
  },
  coords: {
    fontSize: 13,
    color: Novaride.secondary,
    letterSpacing: 1,
  },
  points: {
    fontSize: 12,
    color: Novaride.textMuted,
  },
});
