import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../auth';
import { Btn, Field, Card, VertixMark } from '../components/ui';
import { colors, space, radius } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <VertixMark size={38} />
          <Text style={styles.brand}><Text style={{ color: colors.profit }}>V</Text>ertix</Text>
        </View>
        <Text style={styles.title}>Inicia sesión</Text>
        <Text style={styles.sub}>Accede a tu registro de surebets</Text>
        <Card style={{ gap: 16, width: '100%' }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="tucorreo@email.com" />
          <Field label="Contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••••" />
          <Btn title={busy ? 'Entrando…' : 'Entrar'} onPress={submit} disabled={busy} />
        </Card>
        <Text style={styles.alt} onPress={() => navigation.navigate('Register')}>
          ¿No tienes cuenta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Regístrate</Text>
        </Text>
        <Text style={styles.demo}>Demo: demo@surebets.app / demo1234</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: space[5], gap: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: space[3] },
  mark: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  brand: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub: { color: colors.muted, textAlign: 'center', marginBottom: space[3] },
  error: { backgroundColor: colors.lossSoft, color: colors.loss, padding: 10, borderRadius: radius.sm, fontSize: 13 },
  alt: { color: colors.muted, textAlign: 'center', marginTop: space[4] },
  demo: { color: colors.faint, textAlign: 'center', fontSize: 12, marginTop: 4 },
});
