import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

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
  if (!currentLocation) return null;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        mapType="satellite"
        showsUserLocation
        showsMyLocationButton={false}
      >
        {ridePoints.length > 1 && (
          <Polyline
            coordinates={ridePoints}
            strokeColor={Novaride.secondary}
            strokeWidth={3}
          />
        )}
        <Marker
          coordinate={currentLocation}
          pinColor={Novaride.primary}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Novaride.border,
    height: 220,
  },
  map: {
    flex: 1,
  },
});
