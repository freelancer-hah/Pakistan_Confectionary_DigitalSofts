import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '../../api/supabase';
import { colors } from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import CustomerAuthModal from './CustomerAuthModal';

interface CartScreenProps {
  navigation: any;
}

export default function CartScreen({ navigation }: CartScreenProps) {
  const {
    cart,
    activeTab,
    customer,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    minRequired,
    isMinOrderMet,
    addRecentOrder,
  } = useCart();

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);

  async function handleCheckout() {
    if (!customer) {
      setAuthModalVisible(true);
      return;
    }

    if (!isMinOrderMet) {
      Alert.alert(
        'Minimum Order Limit',
        `Minimum order required is Rs ${minRequired.toLocaleString()}. Current total: Rs ${cartTotal.toLocaleString()}.\nکم از کم آرڈر کی حد پوری کریں۔`
      );
      return;
    }

    setPlacingOrder(true);
    try {
      const orderNumber = `PKC-${Date.now().toString().slice(-6)}`;

      // 1. Insert order
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customer.name,
          phone: customer.phone,
          whatsapp: customer.phone,
          address: customer.address,
          city: customer.city,
          order_type: activeTab,
          total_amount: cartTotal,
          payment_method: 'Cash on Delivery (COD)',
          status: 'Pending',
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Insert order items
      if (orderData?.id) {
        const orderItems = cart.map((item) => ({
          order_id: orderData.id,
          product_id: item.product.id,
          product_name: item.product.name,
          unit: item.product.unit || 'unit',
          quantity: item.quantity,
          price: Number(item.product.price),
          total: Number(item.product.price) * item.quantity,
        }));

        const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
        if (itemsErr) console.warn('Order items insert error:', itemsErr);

        // 3. Decrement stock
        for (const item of cart) {
          const nextStock = Math.max(0, Number(item.product.stock) - item.quantity);
          await supabase
            .from('products')
            .update({ stock: nextStock })
            .eq('id', item.product.id);
        }
      }

      // 4. Save recent order
      await addRecentOrder(orderNumber);
      setPlacedOrderNumber(orderNumber);
      clearCart();
    } catch (err: any) {
      console.error('Checkout error:', err);
      Alert.alert('Order Failed', err.message || 'Could not place order.');
    } finally {
      setPlacingOrder(false);
    }
  }

  function handleSendWhatsApp(orderNum: string) {
    const text = encodeURIComponent(
      `السلام علیکم! میں نے پاکستان کنفیکشنری ایپ سے آرڈر بک کیا ہے۔\nآرڈر نمبر: ${orderNum}\nکل رقم: Rs. ${cartTotal.toLocaleString()}\nنام: ${customer?.name}\nشہر: ${customer?.city}\nبرائے مہربانی تصدیق فرما دیں۔`
    );
    Linking.openURL(`https://wa.me/923000000000?text=${text}`).catch(() => {
      Alert.alert('Notice', 'WhatsApp could not be opened.');
    });
  }

  // If order was just placed, show success view
  if (placedOrderNumber) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={36} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successUrdu}>آرڈر کامیابی سے بک ہو گیا ہے</Text>

          <View style={styles.trackingBox}>
            <Text style={styles.trackingLabel}>Your Tracking Order Number:</Text>
            <Text style={styles.trackingCode}>{placedOrderNumber}</Text>
          </View>

          <Text style={styles.successNote}>
            ہماری ٹیم جلد آپ سے رابطہ کر کے ڈلیوری کی تصدیق کرے گی۔
          </Text>

          {/* WhatsApp Action */}
          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={() => handleSendWhatsApp(placedOrderNumber)}
          >
            <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
            <Text style={styles.whatsAppBtnText}>Send Order on WhatsApp</Text>
          </TouchableOpacity>

          {/* Track order */}
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => {
              setPlacedOrderNumber(null);
              navigation.navigate('Track');
            }}
          >
            <Ionicons name="cube-outline" size={18} color={colors.slate800} />
            <Text style={styles.trackBtnText}>Track My Order / آرڈر ٹریک کریں</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueShopBtn}
            onPress={() => {
              setPlacedOrderNumber(null);
              navigation.navigate('Shop');
            }}
          >
            <Text style={styles.continueShopText}>Continue Shopping / مزید خریداری کریں</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color={colors.slate300} />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>آپ کے کارٹ میں فی الحال کوئی پروڈکٹ موجود نہیں ہے</Text>
        <TouchableOpacity
          style={styles.emptyShopBtn}
          onPress={() => navigation.navigate('Shop')}
        >
          <Text style={styles.emptyShopBtnText}>Explore Products / مال دیکھیں</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Minimum order notice */}
      <View
        style={[
          styles.minOrderNotice,
          isMinOrderMet ? styles.minOrderNoticeMet : styles.minOrderNoticeUnmet,
        ]}
      >
        <Ionicons
          name={isMinOrderMet ? 'checkmark-circle' : 'alert-circle'}
          size={18}
          color={isMinOrderMet ? colors.success : colors.primaryDark}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.minNoticeTitle,
              isMinOrderMet ? { color: colors.success } : { color: colors.primaryDark },
            ]}
          >
            {isMinOrderMet
              ? 'Minimum Order Limit Met! / کم از کم حد مکمل ہے'
              : `Minimum order is Rs ${minRequired.toLocaleString()}`}
          </Text>
          {!isMinOrderMet && (
            <Text style={styles.minNoticeSub}>
              Rs {(minRequired - cartTotal).toLocaleString()} more required to place order
            </Text>
          )}
        </View>
      </View>

      {/* Cart items */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Selected Items ({cart.length})</Text>
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearCartText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {cart.map((item) => (
          <View key={item.product.id} style={styles.cartItemRow}>
            {/* Thumbnail */}
            <View style={styles.thumbWrapper}>
              {item.product.image_url ? (
                <Image source={{ uri: item.product.image_url }} style={styles.thumbImage} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="cube" size={20} color={colors.slate400} />
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.itemPricePer}>
                Rs {Number(item.product.price).toLocaleString()} / {item.product.unit || 'unit'}
              </Text>

              <View style={styles.itemActionRow}>
                {/* Stepper */}
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateQuantity(item.product.id, -1)}
                  >
                    <Ionicons name="remove" size={14} color={colors.slate800} />
                  </TouchableOpacity>
                  <Text style={styles.stepQty}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateQuantity(item.product.id, 1)}
                  >
                    <Ionicons name="add" size={14} color={colors.slate800} />
                  </TouchableOpacity>
                </View>

                {/* Subtotal */}
                <Text style={styles.itemSubtotal}>
                  Rs {(Number(item.product.price) * item.quantity).toLocaleString()}
                </Text>

                {/* Remove */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeFromCart(item.product.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Delivery Address Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Delivery Information</Text>
          <TouchableOpacity onPress={() => setAuthModalVisible(true)}>
            <Text style={styles.editAddressText}>
              {customer ? 'Edit Details' : 'Add Details'}
            </Text>
          </TouchableOpacity>
        </View>

        {customer ? (
          <View style={styles.addressBox}>
            <View style={styles.addressRow}>
              <Ionicons name="person-outline" size={15} color={colors.slate500} />
              <Text style={styles.addressText}>{customer.name}</Text>
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="call-outline" size={15} color={colors.slate500} />
              <Text style={styles.addressText}>{customer.phone}</Text>
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={15} color={colors.slate500} />
              <Text style={styles.addressText}>
                {customer.address}, {customer.city}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.setAddressBtn}
            onPress={() => setAuthModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.setAddressBtnText}>Enter Delivery Address & Phone</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bill Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bill Summary / بل کی تفصیل</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Items Subtotal</Text>
          <Text style={styles.summaryVal}>Rs {cartTotal.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Method</Text>
          <Text style={styles.summaryVal}>Cash on Delivery (COD)</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Charges</Text>
          <Text style={styles.summaryDelivery}>To be confirmed on call</Text>
        </View>

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Payable:</Text>
          <Text style={styles.totalVal}>Rs {cartTotal.toLocaleString()}</Text>
        </View>
      </View>

      {/* Checkout Button */}
      <TouchableOpacity
        style={[
          styles.checkoutBtn,
          (!isMinOrderMet || placingOrder) && styles.checkoutBtnDisabled,
        ]}
        onPress={handleCheckout}
        disabled={!isMinOrderMet || placingOrder}
      >
        {placingOrder ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Ionicons name="shield-checkmark" size={18} color={colors.slate950} />
            <Text style={styles.checkoutBtnText}>Confirm Order (COD) / آرڈر مکمل کریں</Text>
          </>
        )}
      </TouchableOpacity>

      <CustomerAuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
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
  minOrderNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  minOrderNoticeUnmet: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  minOrderNoticeMet: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
  },
  minNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  minNoticeSub: {
    fontSize: 11,
    color: colors.slate600,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate900,
  },
  clearCartText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '700',
  },
  cartItemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  thumbWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.slate100,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate900,
  },
  itemPricePer: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  itemActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate100,
    borderRadius: 8,
    padding: 2,
  },
  stepBtn: {
    width: 24,
    height: 24,
    backgroundColor: colors.white,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepQty: {
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  deleteBtn: {
    padding: 4,
  },
  editAddressText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  addressBox: {
    gap: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 12,
    color: colors.slate700,
    fontWeight: '500',
    flex: 1,
  },
  setAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  setAddressBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.slate600,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate800,
  },
  summaryDelivery: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate900,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  checkoutBtnDisabled: {
    opacity: 0.5,
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.slate950,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate800,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyShopBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 18,
  },
  emptyShopBtnText: {
    color: colors.slate950,
    fontSize: 13,
    fontWeight: '800',
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.slate950,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
  },
  successUrdu: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 2,
  },
  trackingBox: {
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  trackingLabel: {
    fontSize: 11,
    color: colors.slate500,
    fontWeight: '600',
  },
  trackingCode: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.slate900,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  successNote: {
    fontSize: 11,
    color: colors.slate500,
    textAlign: 'center',
    marginTop: 12,
  },
  whatsAppBtn: {
    backgroundColor: '#25D366',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  whatsAppBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  trackBtn: {
    backgroundColor: colors.slate100,
    borderRadius: 14,
    width: '100%',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  trackBtnText: {
    color: colors.slate800,
    fontSize: 12,
    fontWeight: '700',
  },
  continueShopBtn: {
    paddingVertical: 10,
    marginTop: 6,
  },
  continueShopText: {
    fontSize: 12,
    color: colors.slate500,
    fontWeight: '600',
  },
});
