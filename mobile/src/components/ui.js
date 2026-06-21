import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, space } from '../theme';

export function VertixMark({ size = 36 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 16 L50 32 L30 50 L20 40 Z" fill="#1fb985" />
      <Path d="M50 16 L80 40 L70 50 L50 32 Z" fill="#4fd6a4" />
      <Path d="M50 54 L50 70 L30 88 L20 78 Z" fill="#13916a" />
      <Path d="M50 54 L80 78 L70 88 L50 70 Z" fill="#1fb985" />
    </Svg>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Btn({ title, onPress, variant = 'primary', disabled, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text style={[styles.btnText, variant === 'primary' && { color: colors.primaryInk }, variant === 'danger' && { color: colors.loss }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({ label, style, ...props }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function Badge({ label, color = colors.muted }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '26' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function StatCard({ label, value, color = colors.ink, sub }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </Card>
  );
}

export function Empty({ title, text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {text ? <Text style={styles.emptyText}>{text}</Text> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: space[4] },
  sectionTitle: { color: colors.faint, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  btn: { height: 46, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: space[4], backgroundColor: colors.surface2, borderWidth: 1, borderColor: 'transparent' },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { backgroundColor: 'transparent', borderColor: colors.borderStrong },
  btnDanger: { backgroundColor: 'transparent', borderColor: colors.loss },
  btnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  input: { height: 46, backgroundColor: colors.surface2, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: space[3], color: colors.ink, fontSize: 15 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stat: { flex: 1, minWidth: 150 },
  statLabel: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  statSub: { color: colors.faint, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: space[6], gap: 8 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
});
