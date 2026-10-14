import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { CustomerProfile, useCart } from '../../context/CartContext';
import { supabase } from '../../api/supabase';

interface CustomerAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const POPULAR_CITIES = ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala'];

export default function CustomerAuthModal({ visible, onClose, onSuccess }: CustomerAuthModalProps) {
  const { customer, setCustomer } = useCart();

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [city, setCity] = useState(customer?.city || 'Karachi');
  const [address, setAddress] = useState(customer?.address || '');

  async function handleSave() {
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      Alert.alert('Incomplete Info', 'Please enter your Name, Phone Number, City, and Address / برائے مہربانی تمام تفصیلات درج فرمائیں۔');
      return;
    }

    const cleanedPhone = phone.trim().replace(/[\s-]/g, '');
    const formattedPhone = cleanedPhone.startsWith('03') 
      ? '+92' + cleanedPhone.substring(1) 
      : cleanedPhone.startsWith('923') 
        ? '+' + cleanedPhone 
        : cleanedPhone.startsWith('+923') 
          ? cleanedPhone 
          : '+92' + cleanedPhone;

    const profile: CustomerProfile = {
      name: name.trim(),
      phone: formattedPhone,
      email: email.trim() || undefined,
      city: city.trim(),
      address: address.trim(),
    };

    // Save directly to Supabase 'customers' table
    try {
      await supabase.from('customers').upsert(
        {
          name: name.trim(),
          phone: formattedPhone,
          email: email.trim() || null,
          city: city.trim(),
          address: address.trim(),
          pin: '1234',
          is_verified: true,
          verification_method: 'mobile_app_direct',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone' }
      );
    } catch (e) {
      console.warn('Mobile DB save note:', e);
    }

    setCustomer(profile);
    onClose();
    if (onSuccess) onSuccess();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Delivery Details</Text>
              <Text style={styles.subtitle}>ڈیلیوری کی تفصیلات و کسٹمر پروفائل</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.slate600} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
            {/* Name */}
            <Text style={styles.label}>Full Name / دکان یا کسٹمر کا نام *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kamran Traders"
              placeholderTextColor={colors.slate400}
              value={name}
              onChangeText={setName}
            />

            {/* Phone */}
            <Text style={styles.label}>Mobile / WhatsApp Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="03001234567"
              placeholderTextColor={colors.slate400}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {/* Email */}
            <Text style={styles.label}>Gmail / Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="yourname@gmail.com"
              placeholderTextColor={colors.slate400}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* City */}
            <Text style={styles.label}>City / شہر *</Text>
            <TextInput
              style={styles.input}
              placeholder="Karachi, Lahore..."
              placeholderTextColor={colors.slate400}
              value={city}
              onChangeText={setCity}
            />

            {/* City chips */}
            <View style={styles.cityChips}>
              {POPULAR_CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityChip, city === c && styles.cityChipActive]}
                  onPress={() => setCity(c)}
                >
                  <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Address */}
            <Text style={styles.label}>Full Delivery Address / دکان کا مکمل پتہ *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Shop #, Market Name, Area / گلی، مارکیٹ، علاقہ"
              placeholderTextColor={colors.slate400}
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle" size={18} color={colors.white} />
              <Text style={styles.saveBtnText}>Save & Continue / محفوظ کریں</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
  },
  subtitle: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.slate100,
  },
  body: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate700,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.slate900,
    marginBottom: 12,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  cityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.slate100,
  },
  cityChipActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cityChipText: {
    fontSize: 11,
    color: colors.slate600,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
