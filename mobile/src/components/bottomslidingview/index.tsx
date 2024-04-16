import React, {useRef, useState} from 'react';
import {Animated, Dimensions, StyleSheet, Text, View} from 'react-native';
import {PanGestureHandler, State} from 'react-native-gesture-handler';

const BottomSlidingView = ({children}) => {
  const minHeight = 120;
  const fullHeight = Dimensions.get('window').height - 200;
  const [height] = useState(new Animated.Value(minHeight)); // Start with a view height of 100
  const [fullOpen, setFullOpen] = useState(false);

  const onGestureEvent = Animated.event(
    [{nativeEvent: {translationY: height}}],
    {useNativeDriver: false},
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setFullOpen(event.nativeEvent.translationY < -minHeight);
      Animated.spring(height, {
        toValue:
          event.nativeEvent.translationY < -minHeight ? fullHeight : minHeight,
        bounciness: 0,
        useNativeDriver: false,
      }).start();
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}>
      <Animated.View
        style={[styles.container, {height}]}
        onTouchEnd={() => {
          Animated.spring(height, {
            toValue: !fullOpen ? fullHeight : minHeight,
            bounciness: 0,
            useNativeDriver: false,
          }).start();
          setFullOpen(!fullOpen);
        }}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    position: 'absolute',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: 'rgb(71,155,230)',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default BottomSlidingView;
