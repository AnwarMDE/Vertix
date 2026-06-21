import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import BetItem from '../components/BetItem';
import { Card, Empty } from '../components/ui';
import { money, MONTHS_ES, DOW_ES, fmtDate, todayISO } from '../lib/format';
import { colors, space, radius } from '../theme';

const pad = (n) => String(n).padStart(2, '0');
const compact = (n) => { const v = Math.round(n); return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v); };

// Ancho de celda calculado para 7 columnas (evita el descuadre de width:'%' en RN).
const GRID_GAP = 5;
const CELL_W = Math.floor((Dimensions.get('window').width - 44 - GRID_GAP * 6) / 7);
const CELL_H = CELL_W + 6;

export default function CalendarScreen() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [days, setDays] = useState({});
  const [selected, setSelected] = useState(null);
  const [dayBets, setDayBets] = useState([]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const ym = `${year}-${pad(month + 1)}`;

  const load = useCallback(async () => {
    try {
      const r = await api.calendar(ym);
      const m = {};
      r.days.forEach((d) => { m[d.date] = d; });
      setDays(m);
    } catch (e) { /* noop */ }
  }, [ym]);

  useEffect(() => { load(); setSelected(null); setDayBets([]); }, [load]);

  async function pick(dateStr) {
    setSelected(dateStr);
    try {
      const r = await api.listBets({ from: dateStr, to: dateStr });
      setDayBets(r.bets);
    } catch (e) { /* noop */ }
  }

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = (first.getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < start; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [year, month]);

  const monthTotal = Object.values(days).reduce((a, d) => a + d.profit, 0);
  const todayStr = todayISO();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: space[3], gap: space[4] }}>
      <Card style={{ padding: 12 }}>
        <View style={styles.head}>
          <View style={styles.headNav}>
            <Pressable onPress={() => setCursor(new Date(year, month - 1, 1))} hitSlop={12}><Ionicons name="chevron-back" size={20} color={colors.muted} /></Pressable>
            <Text style={styles.month}>{MONTHS_ES[month]} {year}</Text>
            <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))} hitSlop={12}><Ionicons name="chevron-forward" size={20} color={colors.muted} /></Pressable>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.totalLbl}>Beneficio del mes</Text>
            <Text style={[styles.total, { color: monthTotal > 0.001 ? colors.profit : monthTotal < -0.001 ? colors.loss : colors.ink }]}>
              {money(monthTotal, { sign: true })}
            </Text>
          </View>
        </View>

        <View style={styles.dow}>{DOW_ES.map((d, i) => <Text key={i} style={[styles.dowText, { width: CELL_W }]}>{d}</Text>)}</View>
        <View style={styles.grid}>
          {cells.map((d, i) => {
            if (d === null) return <View key={'e' + i} style={{ width: CELL_W, height: CELL_H }} />;
            const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
            const info = days[ds];
            const has = !!info && info.count > 0;
            const isToday = ds === todayStr;
            const isSel = ds === selected;

            if (!has) {
              return (
                <Pressable key={ds} onPress={() => pick(ds)} style={[styles.bare, { width: CELL_W, height: CELL_H }]}>
                  <Text style={[styles.bareNum, isToday && { color: colors.primary, fontWeight: '800' }]}>{d}</Text>
                </Pressable>
              );
            }

            const profit = info.profit || 0;
            const win = profit >= -0.001;
            const fill = win ? '#1E7A52' : '#9E3B38';
            const border = isSel ? '#FFFFFF' : win ? '#2FB988' : '#F4716F';
            return (
              <Pressable key={ds} onPress={() => pick(ds)} style={[styles.tile, { width: CELL_W, height: CELL_H, backgroundColor: fill, borderColor: border, borderWidth: isSel ? 2 : 1.5 }]}>
                <Text style={styles.tileNum}>{d}</Text>
                <Text style={styles.tileAmt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                  {Math.round(Math.abs(profit))} €
                </Text>
                {info.pending > 0 ? <View style={styles.pendingDot} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      {selected && (
        <Card style={{ padding: 0 }}>
          <View style={styles.detHead}><Text style={styles.detTitle}>{fmtDate(selected)}</Text></View>
          {dayBets.length ? (
            dayBets.map((b, i) => (
              <View key={b.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : null}>
                <BetItem bet={b} />
              </View>
            ))
          ) : (
            <Empty title="Sin apuestas" text="No hay apuestas registradas este día." />
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headNav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  month: { color: colors.ink, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  totalLbl: { color: colors.faint, fontSize: 11, fontWeight: '500' },
  total: { fontSize: 18, fontWeight: '800', marginTop: 1 },
  dow: { flexDirection: 'row', gap: GRID_GAP, marginBottom: 8 },
  dowText: { textAlign: 'center', color: colors.faint, fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  bare: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 7 },
  bareNum: { color: colors.faint, fontSize: 13, fontWeight: '500' },
  tile: { borderRadius: 11, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 3 },
  tileNum: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', opacity: 0.9 },
  tileAmt: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pendingDot: { position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
  detHead: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  detTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
});
