import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { colors } from '../../theme/colors';
import { useCart, MIN_ORDER_WHOLESALE, MIN_ORDER_RETAIL } from '../../context/CartContext';
import CustomerAuthModal from './CustomerAuthModal';

interface CustomerProfileScreenProps {
  onLogout: () => void;
}

export default function CustomerProfileScreen({ onLogout }: CustomerProfileScreenProps) {
  const { customer, setCustomer, recentOrders } = useCart();
  const [modalVisible, setModalVisible] = useState(false);

  function handleHelplineCall() {
    Linking.openURL('tel:03001234567').catch(() => {
      Alert.alert('Notice', 'Unable to initiate phone call.');
    });
  }

  function handleHelplineWhatsApp() {
    const text = encodeURIComponent('السلام علیکم! مجھے پاکستان کنفیکشنری کے پروڈکٹس اور ریٹس کے متعلق رہنمائی درکار ہے۔');
    Linking.openURL(`https://wa.me/923000000000?text=${text}`).catch(() => {
      Alert.alert('Notice', 'Unable to open WhatsApp.');
    });
  }

  function handleClearProfile() {
    Alert.alert(
      'Reset Profile',
      'Are you sure you want to change customer details?\nکیا آپ کسٹمر پروفائل ری سیٹ کرنا چاہتے ہیں؟',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setCustomer(null),
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Customer Info Card */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 28 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>
              {customer?.name || 'Guest Wholesale Client'}
            </Text>
            <Text style={styles.customerCity}>
              {customer?.city ? `${customer.city}, Pakistan` : 'Pakistan'}
            </Text>
          </View>
        </View>

        {customer ? (
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={colors.slate500} />
              <Text style={styles.infoText}>{customer.phone}</Text>
            </View>
            {customer.email ? (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color={colors.slate500} />
                <Text style={styles.infoText}>{customer.email}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.slate500} />
              <Text style={styles.infoText}>{customer.address}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="pencil" size={14} color={colors.primaryDark} />
            <Text style={styles.editBtnText}>
              {customer ? 'Edit Delivery Details' : 'Set Profile Info'}
            </Text>
          </TouchableOpacity>

          {customer && (
            <TouchableOpacity style={styles.resetBtn} onPress={handleClearProfile}>
              <Text style={styles.resetBtnText}>Log Out / ری سیٹ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Orders stats card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order History Summary</Text>
        <View style={styles.historyRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{recentOrders.length}</Text>
            <Text style={styles.statLabel}>Orders Booked</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>COD</Text>
            <Text style={styles.statLabel}>Payment Method</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>Direct</Text>
            <Text style={styles.statLabel}>Factory Supply</Text>
          </View>
        </View>
      </View>

      {/* Business & Wholesale Guidelines */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Wholesale & Ordering Terms</Text>

        <View style={styles.termItem}>
          <Ionicons name="cube-outline" size={18} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.termTitle}>Wholesale Cartons Minimum Limit</Text>
            <Text style={styles.termDesc}>
              کم از کم ہول سیل کارٹن آرڈر Rs. {MIN_ORDER_WHOLESALE.toLocaleString()} کا ہونا ضروری ہے۔
            </Text>
          </View>
        </View>

        <View style={styles.termItem}>
          <Ionicons name="pricetag-outline" size={18} color={colors.info} />
          <View style={{ flex: 1 }}>
            <Text style={styles.termTitle}>Retail Packs Minimum Limit</Text>
            <Text style={styles.termDesc}>
              گھریلو و ریٹیل پیکٹس کے لیے کم از کم حد Rs. {MIN_ORDER_RETAIL.toLocaleString()} ہے۔
            </Text>
          </View>
        </View>

        <View style={styles.termItem}>
          <Ionicons name="cash-outline" size={18} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.termTitle}>Cash on Delivery (COD)</Text>
            <Text style={styles.termDesc}>
              تمام ادائیگیاں مال موصول ہونے پر کیش ادا کی جائیں گی۔
            </Text>
          </View>
        </View>
      </View>

      {/* Help & Support */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Helpline & Customer Support</Text>

        <TouchableOpacity style={styles.supportBtn} onPress={handleHelplineWhatsApp}>
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <View style={{ flex: 1 }}>
            <Text style={styles.supportBtnTitle}>WhatsApp Helpline</Text>
            <Text style={styles.supportBtnSub}>فوری معلومات، ریٹ لسٹ اور رہنمائی</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.slate400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportBtn} onPress={handleHelplineCall}>
          <Ionicons name="call" size={20} color={colors.info} />
          <View style={{ flex: 1 }}>
            <Text style={styles.supportBtnTitle}>Direct Call Support</Text>
            <Text style={styles.supportBtnSub}>براہ راست کال کریں (0300-1234567)</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.slate400} />
        </TouchableOpacity>
      </View>

      {/* Sign Out Card */}
      <TouchableOpacity
        style={styles.logoutCard}
        onPress={onLogout}
        activeOpacity={0.8}
      >
        <View style={styles.logoutIconBox}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.logoutTitle}>Log Out of Account / لاگ آؤٹ</Text>
          <Text style={styles.logoutSub}>
            اکاؤنٹ سے لاگ آؤٹ کریں اور لاگ ان پیج پر واپس جائیں
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.slate400} />
      </TouchableOpacity>

      <CustomerAuthModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slate900,
  },
  customerCity: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  infoList: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    color: colors.slate700,
    fontWeight: '500',
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.slate50,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  statLabel: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 4,
    textAlign: 'center',
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  termTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate800,
  },
  termDesc: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  supportBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate900,
  },
  supportBtnSub: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 1,
  },
  logoutCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  logoutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
  },
  logoutSub: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 2,
  },
});
