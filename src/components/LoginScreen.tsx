import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authenticateUser } from '../services/authService';
import { useScanStore } from '../store/scanStore';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const openSplash = useScanStore(state => state.openSplash);
  const setAuthenticatedUser = useScanStore(
    state => state.setAuthenticatedUser,
  );
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit =
    login.trim().length > 0 && password.length > 0 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      setErrorMessage('Informe login e senha para continuar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await authenticateUser({
        login: login.trim(),
        password,
      });
      setAuthenticatedUser(user.name);
      openSplash();
    } catch (error) {
      setErrorMessage(
        (error as Error).message || 'Nao foi possivel autenticar.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 28,
            paddingBottom: insets.bottom + 28,
          },
        ]}
      >
        <View style={styles.brand}>
          <Image
            source={require('../../assets/logo-pf.png')}
            style={styles.logo}
            resizeMode="cover"
          />
          <Text style={styles.title}>MasterWood</Text>
          <Text style={styles.subtitle}>Acesso ao leitor de codigos</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Login</Text>
            <TextInput
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              placeholder="Digite seu login"
              placeholderTextColor="#8b7b62"
              returnKeyType="next"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                placeholder="Digite sua senha"
                placeholderTextColor="#8b7b62"
                returnKeyType="done"
                secureTextEntry={!isPasswordVisible}
                style={styles.passwordInput}
                onSubmitEditing={handleSubmit}
              />
              <Pressable
                accessibilityLabel={
                  isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'
                }
                accessibilityRole="button"
                disabled={isSubmitting}
                hitSlop={8}
                onPress={() => setIsPasswordVisible(current => !current)}
                style={styles.passwordVisibilityButton}
              >
                <Text style={styles.passwordVisibilityText}>
                  {isPasswordVisible ? 'Ocultar' : 'Mostrar'}
                </Text>
              </Pressable>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fffaf0" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16352f',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  brand: {
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 250, 240, 0.55)',
  },
  title: {
    color: '#fffaf0',
    fontSize: 31,
    fontWeight: '900',
  },
  subtitle: {
    color: '#d8c7a6',
    fontSize: 15,
    fontWeight: '700',
  },
  form: {
    gap: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d8c7a6',
    backgroundColor: '#fffaf0',
    padding: 18,
  },
  field: {
    gap: 7,
  },
  label: {
    color: '#6b604e',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8c7a6',
    backgroundColor: '#f5f0e6',
    color: '#17231f',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 14,
  },
  passwordInputContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8c7a6',
    backgroundColor: '#f5f0e6',
  },
  passwordInput: {
    flex: 1,
    color: '#17231f',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 14,
  },
  passwordVisibilityButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  passwordVisibilityText: {
    color: '#1f6f91',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  errorText: {
    color: '#8d2b20',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  errorBox: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(141, 43, 32, 0.28)',
    backgroundColor: 'rgba(141, 43, 32, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#35a4ff',
    paddingHorizontal: 18,
  },
  buttonDisabled: {
    backgroundColor: '#91a9b2',
  },
  buttonText: {
    color: '#fffaf0',
    fontSize: 16,
    fontWeight: '900',
  },
});
