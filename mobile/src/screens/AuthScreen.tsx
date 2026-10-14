import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabase';
import { colors } from '../theme/colors';
import { useCart, CustomerProfile } from '../context/CartContext';

interface AuthScreenProps {
  onLoginSuccess: (role: 'customer' | 'admin') => void;
}

const POPULAR_CITIES = ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala'];

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const { setCustomer } = useCart();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Customer Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Customer Register Fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regCity, setRegCity] = useState('Karachi');
  const [regAddress, setRegAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Customer Sign In
  async function handleCustomerLogin() {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both Email and Password / ای میل اور پاس ورڈ درج فرمائیں');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword.trim(),
      });

      if (error) throw error;

      if (data.user) {
        // Load metadata
        const meta = data.user.user_metadata || {};
        const isUserAdmin = meta.role === 'admin' || data.user.email?.toLowerCase().includes('admin');
        if (isUserAdmin) {
          onLoginSuccess('admin');
          return;
        }

        const profile: CustomerProfile = {
          name: meta.name || data.user.email?.split('@')[0] || 'Customer',
          phone: meta.phone || '03001234567',
          email: data.user.email,
          city: meta.city || 'Karachi',
          address: meta.address || 'Market Shop',
        };
        await setCustomer(profile);

        onLoginSuccess('customer');
      }
    } catch (err: any) {
      console.error('Customer login error:', err);
      setErrorMsg(err.message || 'Invalid email or password / غلط ای میل یا پاس ورڈ ہے');
    } finally {
      setLoading(false);
    }
  }

  // 2. Customer Register (Sign Up)
  async function handleCustomerRegister() {
    if (!regName.trim() || !regPhone.trim() || !regEmail.trim() || !regPassword.trim() || !regAddress.trim() || !regCity.trim()) {
      setErrorMsg('Please fill in all required fields / تمام تفصیلات درج فرمائیں');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters / پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim().toLowerCase(),
        password: regPassword.trim(),
        options: {
          data: {
            name: regName.trim(),
            phone: regPhone.trim(),
            city: regCity.trim(),
            address: regAddress.trim(),
            role: 'customer',
          },
        },
      });

      if (error) throw error;

      const profile: CustomerProfile = {
        name: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim().toLowerCase(),
        city: regCity.trim(),
        address: regAddress.trim(),
      };
      await setCustomer(profile);

      Alert.alert(
        'Account Created! / اکاؤنٹ بن گیا',
        'Your customer account has been created successfully. Welcome to Pakistan Confectionery!\nآپ کا اکاؤنٹ بن چکا ہے، خوش آمدید۔',
        [{ text: 'Continue', onPress: () => onLoginSuccess('customer') }]
      );
    } catch (err: any) {
      console.error('Customer register error:', err);
      setErrorMsg(err.message || 'Could not create account / اکاؤنٹ بنانے میں مسئلہ پیش آیا');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Brand Banner */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 32 }}>🍬</Text>
          </View>
          <Text style={styles.brandTitle}>PAKISTAN CONFECTIONARY</Text>
          <Text style={styles.brandSubtitle}>
            تھوک و پرچون پورٹل • Wholesale & Retail Portal
          </Text>
        </View>

        {/* Auth Mode Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
            onPress={() => {
              setTab('login');
              setErrorMsg(null);
            }}
          >
            <Text style={[styles.tabBtnText, tab === 'login' && styles.tabBtnTextActive]}>
              Customer Login / لاگ ان
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
            onPress={() => {
              setTab('register');
              setErrorMsg(null);
            }}
          >
            <Text style={[styles.tabBtnText, tab === 'register' && styles.tabBtnTextActive]}>
              New Account / نیا اکاؤنٹ
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* =============================================================== */}
        {/* FORM 1: CUSTOMER LOGIN */}
        {/* =============================================================== */}
        {tab === 'login' && (
          <View style={styles.card}>
            <Text style={styles.formTitle}>Customer Login / کسٹمر لاگ ان</Text>
            <Text style={styles.formSubtitle}>
              Sign in to browse wholesale carton rates and place orders
            </Text>

            <Text style={styles.label}>Gmail / Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={colors.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="customer@gmail.com"
                placeholderTextColor={colors.slate400}
                keyboardType="email-address"
                autoCapitalize="none"
                value={loginEmail}
                onChangeText={setLoginEmail}
              />
            </View>

            <Text style={styles.label}>Password / پاس ورڈ</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={colors.slate400}
                secureTextEntry={!showLoginPassword}
                value={loginPassword}
                onChangeText={setLoginPassword}
              />
              <TouchableOpacity
                onPress={() => setShowLoginPassword(!showLoginPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.slate500}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleCustomerLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={18} color={colors.white} />
                  <Text style={styles.submitBtnText}>Sign In / لاگ ان کریں</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeLink}
              onPress={() => {
                setTab('register');
                setErrorMsg(null);
              }}
            >
              <Text style={styles.switchModeText}>
                Don't have an account? <Text style={styles.switchModeBold}>Register Here / نیا اکاؤنٹ بنائیں</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =============================================================== */}
        {/* FORM 2: NEW CUSTOMER ACCOUNT */}
        {/* =============================================================== */}
        {tab === 'register' && (
          <View style={styles.card}>
            <Text style={styles.formTitle}>Create Account / نیا اکاؤنٹ بنائیں</Text>
            <Text style={styles.formSubtitle}>
              Register once with your delivery details to order easily anytime
            </Text>

            <Text style={styles.label}>Full Name / دکان یا کسٹمر کا نام *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={colors.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Kamran Wholesale Traders"
                placeholderTextColor={colors.slate400}
                value={regName}
                onChangeText={setRegName}
              />
            </View>

            <Text style={styles.label}>Mobile / WhatsApp Number *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color={colors.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="03001234567"
                placeholderTextColor={colors.slate400}
                keyboardType="phone-pad"
                value={regPhone}
                onChangeText={setRegPhone}
              />
            </View>

            <Text style={styles.label}>Gmail / Email Address *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={colors.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="yourname@gmail.com"
                placeholderTextColor={colors.slate400}
                keyboardType="email-address"
                autoCapitalize="none"
                value={regEmail}
                onChangeText={setRegEmail}
              />
            </View>

            <Text style={styles.label}>Create Password / پاس ورڈ بنائیں *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor={colors.slate400}
                secureTextEntry={!showRegPassword}
                value={regPassword}
                onChangeText={setRegPassword}
              />
              <TouchableOpacity
                onPress={() => setShowRegPassword(!showRegPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.slate500}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>City / شہر *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="navigate-outline" size={18} color={colors.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Karachi, Lahore..."
                placeholderTextColor={colors.slate400}
                value={regCity}
                onChangeText={setRegCity}
              />
            </View>

            <View style={styles.chipsRow}>
              {POPULAR_CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, regCity === c && styles.chipActive]}
                  onPress={() => setRegCity(c)}
                >
                  <Text style={[styles.chipText, regCity === c && styles.chipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Delivery Address / مکمل پتہ *</Text>
            <View style={[styles.inputWrapper, { height: 75, alignItems: 'flex-start' }]}>
              <Ionicons name="location-outline" size={18} color={colors.slate400} style={[styles.inputIcon, { marginTop: 10 }]} />
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder="Shop #, Market Name, Area / دکان یا گلی نمبر"
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={3}
                value={regAddress}
                onChangeText={setRegAddress}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleCustomerRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color={colors.white} />
                  <Text style={styles.submitBtnText}>Create Account / رجسٹر کریں</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeLink}
              onPress={() => {
                setTab('login');
                setErrorMsg(null);
              }}
            >
              <Text style={styles.switchModeText}>
                Already have an account? <Text style={styles.switchModeBold}>Log In Here / لاگ ان کریں</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 36,
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.slate100,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnActiveAdmin: {
    backgroundColor: colors.slate900,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate600,
  },
  tabBtnTextActive: {
    color: colors.slate950,
    fontWeight: '800',
  },
  tabBtnTextActiveAdmin: {
    color: colors.white,
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    flex: 1,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.slate900,
  },
  formSubtitle: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate700,
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 6,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.slate900,
  },
  eyeBtn: {
    padding: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  chip: {
    backgroundColor: colors.slate100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    color: colors.slate600,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  adminSubmitBtn: {
    backgroundColor: colors.slate900,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate950,
  },
  switchModeLink: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  switchModeText: {
    fontSize: 12,
    color: colors.slate500,
  },
  switchModeBold: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
