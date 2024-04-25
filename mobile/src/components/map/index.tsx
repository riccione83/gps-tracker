import React, {useState} from 'react';
import {StyleSheet} from 'react-native';
import MapView, {Circle, Marker} from 'react-native-maps';
import {Geofences} from '../../../gql-generated/graphql';

interface MapProps {
  marker?: {latitude: number; longitude: number};
  showUserPosition?: boolean;
  geofences?: Geofences[];
}

export default function MapComponent({
  marker,
  showUserPosition,
  geofences,
}: MapProps) {
  const [delta, setNewDelta] = useState<{
    latitudeDelta: number;
    longitudeDelta: number;
  }>({latitudeDelta: 0.0922, longitudeDelta: 0.0421});

  return (
    <MapView
      style={styles.map}
      showsUserLocation={showUserPosition}
      followsUserLocation={showUserPosition}
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
      {geofences !== null &&
        geofences?.map(g => {
          return (
            g.latitude &&
            g.longitude &&
            g.radius && (
              <Circle
                key={g.id}
                center={{latitude: g.latitude, longitude: g.longitude}}
                radius={g.radius * 1000}
                fillColor="rgba(137, 194, 250,0.5)"
              />
            )
          );
        })}
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
