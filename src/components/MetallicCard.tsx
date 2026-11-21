import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

interface MetallicCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  highlightBorder?: boolean;
  onPress?: () => void;
  padding?: number;
}

export const MetallicCard: React.FC<MetallicCardProps> = ({
  children,
  style,
  glow = false,
  highlightBorder = false,
  onPress,
  padding = SPACING.lg,
}) => {
  const content = (
    <LinearGradient
      colors={glow ? GRADIENTS.orangeGlowCard : GRADIENTS.metallicCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        glow && SHADOWS.orangeGlow,
        !glow && SHADOWS.metallicCard,
        highlightBorder && styles.highlightBorder,
        { padding },
        style,
      ]}
    >
      {/* Top specular metallic bevel reflection */}
      <View
        style={[
          styles.topSpecularLine,
          highlightBorder && { backgroundColor: COLORS.accentHighlight },
        ]}
      />
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
    position: 'relative',
  },
  highlightBorder: {
    borderColor: COLORS.accentBorder,
    borderWidth: 1.5,
  },
  topSpecularLine: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});
