import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import BetItem from '../components/BetItem';
import { Card, Empty } from '../components/ui';
import { colors, space, radius } from '../theme';

const FILTERS = [
  { k: '', l: 'Todas' },
  { k: 'pending', l: 'Pendientes' },
  { k: 'won', l: 'Ganadas' },
  { k: 'lost', l: 'Perdidas' },
  { k: 'void', l: 'Anuladas' },
];

function IconBtn({ name, color, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.iconBtn} hitSlop={8}>
      <Ionicons name={name} size={18} color={color} />
    </Pressable>
  );
}

export default function BetsScreen() {
  const [filter, setFilter] = useState('');
  const [bets, setBets] = useState([]);

  const load = useCallback(async () => {
    try {
      const r = await api.listBets(filter ? { status: filter } : {});
      setBets(r.bets);
    } catch (e) { /* noop */ }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function mark(bet, status) {
    if (status === 'lost' && Alert.prompt) {
      Alert.prompt('Resultado real (€)', 'Usa un número negativo si perdiste dinero:', async (v) => {
        await api.updateBet(bet.id, { status, actual_profit: parseFloat(String(v).replace(',', '.')) || 0 });
        load();
      }, 'plain-text', '0');
      return;
    }
    (async () => { await api.updateBet(bet.id, { status, ...(status === 'lost' ? { actual_profit: 0 } : {}) }); load(); })();
  }

  function remove(bet) {
    Alert.alert('Eliminar apuesta', `¿Eliminar "${bet.event}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await api.deleteBet(bet.id); load(); } },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable key={f.k} onPress={() => setFilter(f.k)} style={[styles.chip, filter === f.k && styles.chipActive]}>
              <Text style={[styles.chipText, filter === f.k && { color: colors.ink }]}>{f.l}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: space[4], gap: space[3] }}>
        {bets.length ? (
          bets.map((b) => (
            <Card key={b.id} style={{ padding: 0 }}>
              <BetItem
                bet={b}
                actions={
                  b.status === 'pending' ? (
                    <>
                      <IconBtn name="checkmark" color={colors.profit} onPress={() => mark(b, 'won')} />
                      <IconBtn name="close" color={colors.loss} onPress={() => mark(b, 'lost')} />
                      <IconBtn name="trash-outline" color={colors.faint} onPress={() => remove(b)} />
                    </>
                  ) : (
                    <>
                      <Pressable onPress={() => mark(b, 'pending')} hitSlop={8}><Text style={{ color: colors.muted, fontWeight: '600' }}>Reabrir</Text></Pressable>
                      <IconBtn name="trash-outline" color={colors.faint} onPress={() => remove(b)} />
                    </>
                  )
                }
              />
            </Card>
          ))
        ) : (
          <Empty title="No hay apuestas" text="Crea una surebet desde la calculadora." />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { padding: space[3], gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  iconBtn: { width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
