import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '../../api/supabase';
import { colors } from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import { Order } from '../../types/wholesale';

export default function TrackingScreen() {
  const { recentOrders } = useCart();
  const [searchInput, setSearchInput] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receivedAck, setReceivedAck] = useState(false);

  useEffect(() => {
    if (recentOrders.length > 0 && !order) {
      handleSearch(recentOrders[0]);
    }
  }, [recentOrders]);

  async function handleSearch(codeToQuery?: string) {
    const code = (codeToQuery || searchInput).trim();
    if (!code) {
      Alert.alert('Notice', 'Please enter your Order Tracking ID / ٹریکنگ کوڈ درج کریں۔');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSearchInput(code);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', code)
        .single();

      if (error || !data) {
        setErrorMsg('Order not found. Please check your tracking number.\nآرڈر نہیں ملا، درست ٹریکنگ کوڈ درج فرمائیں۔');
        setOrder(null);
      } else {
        setOrder(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error tracking order.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  function handleMarkReceived() {
    Alert.alert(
      'Confirm Receipt',
      'Have you received your order in full?\nکیا آپ کو مکمل مال موصول ہو چکا ہے؟',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Received',
          onPress: () => {
            setReceivedAck(true);
            Alert.alert('Thank You!', 'آپ کے تعاون کا شکریہ! آپ کا آرڈر مکمل قرار پایا۔');
          },
        },
      ]
    );
  }

  function handleHelplineWhatsApp() {
    const text = encodeURIComponent(
      `السلام علیکم! مجھے آرڈر ${order ? order.order_number : ''} کے متعلق معلومات درکار ہیں۔`
    );
    Linking.openURL(`https://wa.me/923000000000?text=${text}`).catch(() => {
      Alert.alert('Notice', 'WhatsApp could not be opened.');
    });
  }

  const isConfirmed = order?.status === 'Confirmed' || order?.status === 'Delivered';
  const isDelivered = order?.status === 'Delivered';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Bar */}
      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>Track Your Order / آرڈر ٹریک کریں</Text>
        <Text style={styles.searchSubtitle}>
          Enter your PKC tracking number to see live status
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. PKC-123456"
            placeholderTextColor={colors.slate400}
            value={searchInput}
            onChangeText={setSearchInput}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => handleSearch()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.searchBtnText}>Track</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent orders chips */}
        {recentOrders.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentLabel}>Recent Orders:</Text>
            <View style={styles.chipsRow}>
              {recentOrders.slice(0, 4).map((id) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.chip, searchInput === id && styles.chipActive]}
                  onPress={() => handleSearch(id)}
                >
                  <Text style={[styles.chipText, searchInput === id && styles.chipTextActive]}>
                    {id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Error Message */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Order Details View */}
      {order && (
        <View style={styles.resultContainer}>
          {/* Status Timeline */}
          <View style={styles.card}>
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={styles.orderNumber}>{order.order_number}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  order.status === 'Delivered'
                    ? styles.statusDelivered
                    : order.status === 'Confirmed'
                    ? styles.statusConfirmed
                    : styles.statusPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    order.status === 'Delivered'
                      ? styles.textDelivered
                      : order.status === 'Confirmed'
                      ? styles.textConfirmed
                      : styles.textPending,
                  ]}
                >
                  {order.status}
                </Text>
              </View>
            </View>

            {/* Stepper */}
            <View style={styles.timeline}>
              {/* Step 1: Received */}
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepCircleActive]}>
                  <Ionicons name="receipt" size={14} color={colors.white} />
                </View>
                <Text style={styles.stepLabel}>Order Placed</Text>
                <Text style={styles.stepUrdu}>موصول ہوا</Text>
              </View>

              <View
                style={[
                  styles.stepLine,
                  isConfirmed && { backgroundColor: colors.success },
                ]}
              />

              {/* Step 2: Confirmed */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isConfirmed && styles.stepCircleActive,
                  ]}
                >
                  <Ionicons
                    name="cube"
                    size={14}
                    color={isConfirmed ? colors.white : colors.slate400}
                  />
                </View>
                <Text style={styles.stepLabel}>Packed & Sent</Text>
                <Text style={styles.stepUrdu}>پیکنگ جاری</Text>
              </View>

              <View
                style={[
                  styles.stepLine,
                  isDelivered && { backgroundColor: colors.success },
                ]}
              />

              {/* Step 3: Delivered */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isDelivered && styles.stepCircleActive,
                  ]}
                >
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color={isDelivered ? colors.white : colors.slate400}
                  />
                </View>
                <Text style={styles.stepLabel}>Delivered</Text>
                <Text style={styles.stepUrdu}>مال پہنچ گیا</Text>
              </View>
            </View>
          </View>

          {/* Customer & Delivery Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Address / پتہ</Text>
            <Text style={styles.customerName}>{order.customer_name}</Text>
            <Text style={styles.customerPhone}>{order.phone}</Text>
            <Text style={styles.customerAddress}>
              {order.address}, {order.city}
            </Text>
          </View>

          {/* Items Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Items / آئٹمز کی تفصیل</Text>
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity} x Rs {Number(item.price).toLocaleString()} / {item.unit}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    Rs {Number(item.total).toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noItems}>No items details found</Text>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Bill Amount:</Text>
              <Text style={styles.totalValue}>
                Rs {Number(order.total_amount).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Acknowledge Button */}
          {!receivedAck ? (
            <TouchableOpacity
              style={styles.ackBtn}
              onPress={handleMarkReceived}
            >
              <Ionicons name="checkbox-outline" size={18} color={colors.white} />
              <Text style={styles.ackBtnText}>
                Confirm Order Received / مال وصول ہو گیا
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.ackSuccess}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ackSuccessText}>
                Delivery confirmed by customer / وصولی نوٹ ہو گئی
              </Text>
            </View>
          )}

          {/* Contact Helpline */}
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={handleHelplineWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={styles.helpBtnText}>Ask Question on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
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
  searchCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slate900,
  },
  searchSubtitle: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate900,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate950,
  },
  recentSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  recentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate500,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
    fontWeight: '700',
    color: colors.slate700,
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  resultContainer: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.slate900,
  },
  orderDate: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPending: {
    backgroundColor: colors.primaryLight,
  },
  statusConfirmed: {
    backgroundColor: colors.infoLight,
  },
  statusDelivered: {
    backgroundColor: colors.successLight,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  textPending: {
    color: colors.primaryDark,
  },
  textConfirmed: {
    color: colors.info,
  },
  textDelivered: {
    color: colors.success,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  stepItem: {
    alignItems: 'center',
    width: 80,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.slate200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: colors.success,
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: colors.slate200,
    marginBottom: 20,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate800,
    textAlign: 'center',
  },
  stepUrdu: {
    fontSize: 9,
    color: colors.slate500,
    textAlign: 'center',
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate900,
  },
  customerPhone: {
    fontSize: 12,
    color: colors.slate600,
    marginTop: 2,
  },
  customerAddress: {
    fontSize: 12,
    color: colors.slate600,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate900,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  noItems: {
    fontSize: 12,
    color: colors.slate400,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate900,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  ackBtn: {
    backgroundColor: colors.slate900,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ackBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  ackSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.successLight,
    padding: 12,
    borderRadius: 12,
  },
  ackSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  helpBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  helpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate800,
  },
});
