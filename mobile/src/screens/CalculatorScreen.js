import { useState, useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { api } from '../api';
import { calcArbitrage, americanToDecimal } from '../lib/arb';
import { money, pct, todayISO } from '../lib/format';
import { Card, Btn, Field, Badge } from '../components/ui';
import { colors, space, radius } from '../theme';

const num = (v) => parseFloat(String(v).replace(',', '.'));

export default function CalculatorScreen() {
  const [fmt, setFmt] = useState('decimal');
  const [legs, setLegs] = useState([
    { bookmaker: '', outcome: 'Local', odds: '' },
    { bookmaker: '', outcome: 'Visitante', odds: '' },
  ]);
  const [stake, setStake] = useState('100');
  const [round, setRound] = useState('0');
  const [event, setEvent] = useState('');
  const [sport, setSport] = useState('Fútbol');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const decimals = legs.map((l) => (fmt === 'american' ? americanToDecimal(num(l.odds)) : num(l.odds)));
  const valid = decimals.length >= 2 && decimals.every((o) => o > 1);
  const calc = useMemo(
    () => (valid ? calcArbitrage(decimals, num(stake) || 0, { round: Number(round) }) : null),
    [JSON.stringify(decimals), stake, round, valid]
  );

  const setLeg = (i, patch) => setLegs((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLeg = () => setLegs((p) => [...p, { bookmaker: '', outcome: `Resultado ${p.length + 1}`, odds: '' }]);
  const removeLeg = (i) => setLegs((p) => (p.length > 2 ? p.filter((_, idx) => idx !== i) : p));

  async function save() {
    if (!calc) return;
    if (!event.trim()) { Alert.alert('Falta el evento', 'Escribe un nombre de evento para guardar.'); return; }
    setSaving(true);
    try {
      const betLegs = legs.map((l, i) => ({
        bookmaker: l.bookmaker || `Casa ${i + 1}`,
        outcome: l.outcome || `Resultado ${i + 1}`,
        odds: decimals[i],
        stake: calc.stakes[i],
      }));
      await api.createBet({
        event: event.trim(), sport, legs: betLegs,
        total_stake: calc.totalStake, expected_profit: calc.guaranteedProfit,
        profit_pct: calc.profitPctRealized, placed_at: date, status: 'pending',
      });
      Alert.alert('Guardada ✅', 'La apuesta se registró como pendiente.');
      setEvent('');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  const isArb = calc?.isArb;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: space[4], gap: space[4] }} keyboardShouldPersistTaps="handled">
      <Card style={{ alignItems: 'center', gap: 8 }}>
        {calc ? (
          <>
            <Badge label={isArb ? '⚡ Surebet' : 'Sin arbitraje'} color={isArb ? colors.profit : colors.loss} />
            <Text style={[styles.bigPct, { color: isArb ? colors.profit : colors.loss }]}>{pct(calc.profitPctRealized, { sign: true })}</Text>
            <Text style={styles.muted}>
              {isArb ? `Beneficio garantizado ${money(calc.guaranteedProfit, { sign: true })}` : 'Estas cuotas no garantizan beneficio'}
            </Text>
          </>
        ) : (
          <Text style={styles.muted}>Introduce al menos 2 cuotas para calcular</Text>
        )}
      </Card>

      <Card style={{ gap: 14 }}>
        <View style={styles.segmented}>
          {[['decimal', 'Decimal'], ['american', 'Americana']].map(([f, l]) => (
            <Pressable key={f} onPress={() => setFmt(f)} style={[styles.seg, fmt === f && styles.segActive]}>
              <Text style={[styles.segText, fmt === f && { color: colors.ink }]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Field label="Inversión total" keyboardType="numeric" value={stake} onChangeText={setStake} style={{ flex: 1 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.lbl}>Redondeo</Text>
            <View style={styles.segmented}>
              {['0', '1', '5'].map((r) => (
                <Pressable key={r} onPress={() => setRound(r)} style={[styles.seg, round === r && styles.segActive]}>
                  <Text style={[styles.segText, round === r && { color: colors.ink }]}>{r === '0' ? '—' : r}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {legs.map((l, i) => (
          <View key={i} style={{ gap: 8, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border, paddingTop: i > 0 ? 12 : 0 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Field placeholder={`Casa ${i + 1}`} value={l.bookmaker} onChangeText={(t) => setLeg(i, { bookmaker: t })} style={{ flex: 1 }} />
              <Field placeholder={fmt === 'american' ? '+120' : '2.10'} keyboardType="numeric" value={l.odds} onChangeText={(t) => setLeg(i, { odds: t })} style={{ width: 96 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Field placeholder="Resultado" value={l.outcome} onChangeText={(t) => setLeg(i, { outcome: t })} style={{ flex: 1 }} />
              {legs.length > 2 && (
                <Pressable onPress={() => removeLeg(i)} style={styles.del}><Text style={{ color: colors.loss, fontSize: 16 }}>✕</Text></Pressable>
              )}
            </View>
            {calc && (
              <Text style={styles.stakeLine}>
                Apostar <Text style={{ color: colors.ink, fontWeight: '700' }}>{money(calc.stakes[i])}</Text>  ·  retorno {money(calc.payouts[i])}
              </Text>
            )}
          </View>
        ))}
        <Btn title="+ Añadir resultado" variant="ghost" onPress={addLeg} />
      </Card>

      <Card style={{ gap: 14 }}>
        <Text style={styles.h2}>Registrar apuesta</Text>
        <Field label="Evento" value={event} onChangeText={setEvent} placeholder="Real Madrid vs Barcelona" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Field label="Deporte" value={sport} onChangeText={setSport} style={{ flex: 1 }} />
          <Field label="Fecha" value={date} onChangeText={setDate} style={{ flex: 1 }} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        </View>
        <Btn title={saving ? 'Guardando…' : 'Guardar apuesta'} onPress={save} disabled={!calc || saving} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bigPct: { fontSize: 40, fontWeight: '800' },
  muted: { color: colors.muted, textAlign: 'center' },
  h2: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  lbl: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 3, gap: 3, borderWidth: 1, borderColor: colors.border },
  seg: { flex: 1, paddingVertical: 9, borderRadius: 6, alignItems: 'center' },
  segActive: { backgroundColor: colors.borderStrong },
  segText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  del: { width: 46, height: 46, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stakeLine: { color: colors.faint, fontSize: 13 },
});
