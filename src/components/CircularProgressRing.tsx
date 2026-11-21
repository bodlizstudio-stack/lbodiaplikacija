import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS } from '../theme/tokens';

interface CircularProgressRingProps {
  size?: number;
  strokeWidth?: number;
  percentage: number;
  completedCount: number;
  totalCount: number;
  labelTop?: string;
  labelBottom?: string;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  size = 186,
  strokeWidth = 14,
  percentage,
  completedCount,
  totalCount,
  labelTop = 'DISCIPLINE',
  labelBottom = 'TASKS COMPLETED',
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <SvgGradient id="metallicOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.accentHighlight} />
            <Stop offset="55%" stopColor={COLORS.accentPrimary} />
            <Stop offset="100%" stopColor={COLORS.accentDeep} />
          </SvgGradient>
        </Defs>
        {/* Outer bevel ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius + strokeWidth / 2 + 2}
          stroke="rgba(249, 115, 22, 0.18)"
          strokeWidth={1}
          fill="none"
        />
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#15171C"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#metallicOrangeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.centerContent}>
        <Text style={styles.percentageText}>{clamped}%</Text>
        <Text style={styles.labelTopText}>{labelTop}</Text>
        <View style={styles.divider} />
        <Text style={styles.countText}>
          {completedCount} / {totalCount}
        </Text>
        <Text style={styles.labelBottomText}>{labelBottom}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  percentageText: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  labelTopText: {
    color: COLORS.accentHighlight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginTop: 1,
  },
  divider: {
    width: 48,
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 6,
  },
  countText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  labelBottomText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
});
