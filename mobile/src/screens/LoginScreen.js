import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fs, spacing, fontSizes, borderRadius } from '../utils/responsive';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    setErrorMessage(''); // Очищаем предыдущие ошибки
    
    if (!username || !password) {
      setErrorMessage('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Ошибка входа');
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Контейнер с ограниченной шириной для больших экранов */}
          <View style={styles.formWrapper}>
          <View style={styles.header}>
              <Ionicons name="school" size={width > 768 ? 70 : 80} color="#fff" />
            <Text style={styles.title}>Cognitive Kids</Text>
            <Text style={styles.subtitle}>Развитие когнитивных способностей</Text>
          </View>

          <View style={styles.form}>
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="#667eea" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Имя пользователя"
                value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    setErrorMessage(''); // Очищаем ошибку при вводе
                  }}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#667eea" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Пароль"
                value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage(''); // Очищаем ошибку при вводе
                  }}
                secureTextEntry
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Войти</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Для получения учетной записи обратитесь к администратору
          </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Центрируем по горизонтали
    paddingHorizontal: spacing.lg,
  },
  formWrapper: {
    width: '100%',
    maxWidth: width > 768 ? 500 : '100%', // Ограничиваем ширину на больших экранах
    alignSelf: 'center',
    ...(width > 768 && Platform.OS === 'web' && {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
      padding: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: width > 768 ? 40 : hp(50),
  },
  title: {
    fontSize: width > 768 ? 36 : fontSizes.huge,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: width > 768 ? 16 : fontSizes.lg,
    color: '#fff',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    paddingHorizontal: width > 768 ? 20 : spacing.md,
    paddingVertical: width > 768 ? 5 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: width > 768 ? 15 : spacing.md,
    fontSize: width > 768 ? 16 : fontSizes.lg,
    color: '#333',
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingVertical: width > 768 ? 16 : spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: width > 768 ? 18 : fontSizes.xl,
    fontWeight: 'bold',
  },
  footer: {
    color: '#fff',
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: fontSizes.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});

export default LoginScreen;

