import React, {useState} from 'react';
import {StyleSheet} from 'react-native';
import MapView, {Marker} from 'react-native-maps';

interface MapProps {
  marker?: {latitude: number; longitude: number};
  showUserPosition?: boolean;
}

export default function MapComponent({marker, showUserPosition}: MapProps) {
  const [delta, setNewDelta] = useState<{
    latitudeDelta: number;
    longitudeDelta: number;
  }>({latitudeDelta: 0.0922, longitudeDelta: 0.0421});

  return (
    <MapView
      style={styles.map}
      showsUserLocation={showUserPosition}
      zoomEnabled
      onRegionChangeComplete={c =>
        setNewDelta({
          latitudeDelta: c.latitudeDelta,
          longitudeDelta: c.longitudeDelta,
        })
      }
      region={
        marker
          ? {
              latitude: marker?.latitude,
              longitude: marker?.longitude,
              latitudeDelta: delta.latitudeDelta,
              longitudeDelta: delta.longitudeDelta,
            }
          : undefined
      }>
      {marker && (
        <Marker
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    // marginTop: 32,
    width: '100%',
    height: '100%',
  },
});
