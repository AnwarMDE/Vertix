import { View, Text, StyleSheet } from 'react-native';
import { Badge } from './ui';
import { colors, radius } from '../theme';
import { money, pct, fmtDateShort, STATUS, effectiveProfit } from '../lib/format';

export default function BetItem({ bet, actions }) {
  const p = effectiveProfit(bet);
  const st = STATUS[bet.status] || STATUS.pending;
  const pc = p > 0.001 ? colors.profit : p < -0.001 ? colors.loss : colors.muted;
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.event}>{bet.event}</Text>
          <Text style={styles.sub}>{fmtDateShort(bet.placed_at)} · {bet.sport || '—'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.profit, { color: pc }]}>{money(p, { sign: true })}</Text>
          <Text style={styles.subRight}>{money(bet.total_stake)} · {pct(bet.profit_pct, { sign: true })}</Text>
        </View>
      </View>
      <View style={styles.legs}>
        {(bet.legs || []).map((l, i) => (
          <View key={i} style={styles.leg}>
            <Text style={styles.legText}>{l.bookmaker} · {Number(l.odds).toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.bottom}>
        <Badge label={st.label} color={st.color} />
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: 14, gap: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  event: { color: colors.ink, fontWeight: '600', fontSize: 15 },
  sub: { color: colors.faint, fontSize: 12, marginTop: 2 },
  profit: { fontWeight: '700', fontSize: 15 },
  subRight: { color: colors.faint, fontSize: 12, marginTop: 2 },
  legs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  leg: { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 },
  legText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 8 },
});
