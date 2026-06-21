import { useState, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../auth';
import { StatCard, Card, Empty, Btn } from '../components/ui';
import BetItem from '../components/BetItem';
import { money, pct, MONTHS_ES } from '../lib/format';
import { colors, space } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([api.summary(), api.listBets()]);
      setSummary(s);
      setRecent(b.bets.slice(0, 5));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const pc = (n) => (n > 0.001 ? colors.profit : n < -0.001 ? colors.loss : colors.ink);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space[4], gap: space[4] }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {summary && (
        <>
          <View style={styles.grid}>
            <StatCard label="Beneficio total" value={money(summary.totalProfit, { sign: true })} color={pc(summary.totalProfit)} sub={`${summary.count} apuestas`} />
            <StatCard label="Este mes" value={money(summary.monthProfit, { sign: true })} color={pc(summary.monthProfit)} sub={MONTHS_ES[new Date().getMonth()]} />
            <StatCard label="ROI" value={pct(summary.roi, { sign: true })} color={pc(summary.roi)} sub={`${money(summary.totalStaked)}`} />
            <StatCard label="Acierto" value={`${summary.winRate} %`} sub={`${summary.won}/${summary.settled} · ${summary.pending} pdtes.`} />
          </View>

          <Card style={{ padding: 0 }}>
            <View style={styles.head}>
              <Text style={styles.h2}>Últimas apuestas</Text>
              <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => navigation.navigate('Apuestas')}>Ver todas</Text>
            </View>
            {recent.length ? (
              recent.map((b, i) => (
                <View key={b.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : null}>
                  <BetItem bet={b} />
                </View>
              ))
            ) : (
              <Empty title="Sin apuestas todavía" text="Crea una surebet desde la calculadora." />
            )}
          </Card>

          <Btn title="Cerrar sesión" variant="ghost" onPress={logout} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  h2: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  error: { backgroundColor: colors.lossSoft, color: colors.loss, padding: 10, borderRadius: 8, fontSize: 13 },
});
