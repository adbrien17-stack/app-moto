import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';

export default function HomeScreen() {
  const [apiResponse, setApiResponse] = useState<string>('Chargement...');
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
        setLocationError('Permission de géolocalisation refusée.');
        setLocationLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation(pos);
      setLocationLoading(false);
    })();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">App Moto</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Réponse du backend</ThemedText>
        <ThemedText>{apiResponse}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Position GPS</ThemedText>
        {locationLoading && <ThemedText>Récupération de la position...</ThemedText>}
        {locationError && <ThemedText>{locationError}</ThemedText>}
        {location && (
          <>
            <ThemedText>Latitude : {location.coords.latitude.toFixed(6)}</ThemedText>
            <ThemedText>Longitude : {location.coords.longitude.toFixed(6)}</ThemedText>
          </>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
