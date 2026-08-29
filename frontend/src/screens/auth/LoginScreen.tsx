import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { loginUser } from '../../services/api/authService';
import { useAuth } from '../../store';

const LoginScreen = () => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your phone number and password.');
      return;
    }

    try {
      setLoading(true);
      const { user, token } = await loginUser(phone, password);
      await login(user, token);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSpacer} />

          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/icons/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="PowerUp logo"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.heading}>Log In</Text>
            <Text style={styles.subheading}>Welcome to PowerUp Community Source Sharing!</Text>

            <View style={styles.inputRow}>
              <Text style={styles.icon}>📞</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                autoCapitalize="none"
                placeholderTextColor="#a1a1aa"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.icon}>🔑</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#a1a1aa"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>

            <Text style={styles.forgotText}>Forgot Password?</Text>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  topSpacer: {
    height: 16,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 18,
  },
  logoImage: {
    width: 330,
    height: 330,
  },
  formSection: {
    paddingTop: 10,
  },
  heading: {
    fontSize: 50,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 2,
    letterSpacing: -1.5,
  },
  subheading: {
    fontSize: 20,
    color: '#2c2c2e',
    marginBottom: 22,
    fontWeight: '400',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#d8d8dc',
    paddingBottom: 10,
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    color: '#8d8d93',
    width: 30,
    textAlign: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 19,
    color: '#111827',
    paddingVertical: 8,
  },
  eyeButton: {
    paddingLeft: 8,
  },
  eyeIcon: {
    fontSize: 22,
    color: '#86868b',
  },
  forgotText: {
    fontSize: 16,
    color: '#3a3a3d',
    marginTop: 10,
    marginBottom: 24,
    textAlign: 'left',
  },
  button: {
    backgroundColor: '#d9d9dc',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});

export default LoginScreen;
