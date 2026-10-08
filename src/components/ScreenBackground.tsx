import React from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, StyleProp, ViewStyle, RefreshControlProps } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { gradient } from '../theme';

// The dusk background every screen sits on, with safe-area padding and scrolling.
//   <ScreenBackground>...screen content...</ScreenBackground>
type Props = {
  children: React.ReactNode;
  scroll?: boolean; // false for screens that shouldn't scroll (default: scrolls)
  refreshControl?: React.ReactElement<RefreshControlProps>; // optional pull-to-refresh
  contentStyle?: StyleProp<ViewStyle>; // extra padding etc. for one screen
  scrollRef?: React.Ref<ScrollView>; // lets a screen scroll back to the top (e.g. when changing page)
};

function ScreenBackground({ children, scroll = true, refreshControl, contentStyle, scrollRef }: Props) {
  return (
    <LinearGradient
      colors={gradient.colors}
      locations={gradient.locations}
      start={gradient.start}
      end={gradient.end}
      style={styles.fill}
    >
      <SafeAreaView style={styles.fill}>
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, styles.content, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
});

export default ScreenBackground;