import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabase';
import { Order, OrderStatus } from '../types/wholesale';
import { colors } from '../theme/colors';

const STATUS_OPTIONS: OrderStatus[] = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (!error) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        Alert.alert('Status Updated', `Order marked as ${newStatus}`);
      } else {
        Alert.alert('Error', error.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update status');
    }
  }

  function handleWhatsApp(order: Order) {
    const phoneNum = order.whatsapp || order.phone;
    const cleanPhone = phoneNum.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `السلام علیکم ${order.customer_name}! پاکستان کنفیکشنری سے آپ کے آرڈر (${order.order_number}) مالیت Rs. ${Number(order.total_amount).toLocaleString()} کی تصدیق اور ترسیل کے حوالے سے رابطہ کیا گیا ہے۔`
    );
    const url = `whatsapp://send?phone=${cleanPhone}&text=${message}`;
    Linking.openURL(url).catch(() => {
      // Fallback to web link
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
    });
  }

  function handleCall(phone: string) {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call');
    });
  }

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      o.city.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const confirmedCount = orders.filter((o) => o.status === 'Confirmed').length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.slate400} style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order #, Customer, Phone..."
            placeholderTextColor={colors.slate400}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.slate400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabPill, statusFilter === 'all' && styles.tabActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.tabText, statusFilter === 'all' && styles.tabTextActive]}>
              All ({orders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, statusFilter === 'Pending' && styles.tabActive]}
            onPress={() => setStatusFilter('Pending')}
          >
            <Text style={[styles.tabText, statusFilter === 'Pending' && styles.tabTextActive]}>
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, statusFilter === 'Confirmed' && styles.tabActive]}
            onPress={() => setStatusFilter('Confirmed')}
          >
            <Text style={[styles.tabText, statusFilter === 'Confirmed' && styles.tabTextActive]}>
              Confirmed ({confirmedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, statusFilter === 'Delivered' && styles.tabActive]}
            onPress={() => setStatusFilter('Delivered')}
          >
            <Text style={[styles.tabText, statusFilter === 'Delivered' && styles.tabTextActive]}>
              Delivered ({deliveredCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.mutedText}>Loading Orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders();
              }}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cart-outline" size={40} color={colors.slate300} />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.mutedText}>کوئی آرڈر نہیں ملا</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              {/* Order Card Header */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumber}>{item.order_number}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'Pending' && { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder },
                    item.status === 'Confirmed' && { backgroundColor: colors.infoLight, borderColor: colors.infoBorder },
                    item.status === 'Delivered' && { backgroundColor: colors.successLight, borderColor: colors.successBorder },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.status === 'Pending' && { color: colors.danger },
                      item.status === 'Confirmed' && { color: colors.info },
                      item.status === 'Delivered' && { color: colors.success },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Customer Info */}
              <View style={styles.customerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.customer_name ? item.customer_name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{item.customer_name}</Text>
                  <Text style={styles.customerPhone}>{item.phone}</Text>
                </View>

                <View style={styles.amountCol}>
                  <Text style={styles.amountText}>Rs {Number(item.total_amount).toLocaleString()}</Text>
                  <Text style={styles.codLabel}>کیش آن ڈیلیوری</Text>
                </View>
              </View>

              {/* Actions Footer */}
              <View style={styles.cardActions}>
                {/* 1-Tap Status Quick Switch */}
                <TouchableOpacity
                  style={styles.statusActionBtn}
                  onPress={() => {
                    Alert.alert(
                      'Update Order Status',
                      `Order #${item.order_number}`,
                      STATUS_OPTIONS.map((st) => ({
                        text: st,
                        onPress: () => updateOrderStatus(item.id, st),
                      })).concat([{ text: 'Cancel', style: 'cancel' } as any])
                    );
                  }}
                >
                  <Ionicons name="swap-horizontal" size={14} color={colors.slate700} />
                  <Text style={styles.statusActionText}>Change Status</Text>
                </TouchableOpacity>

                <View style={styles.buttonGroup}>
                  {/* WhatsApp Button */}
                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={() => handleWhatsApp(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color={colors.white} />
                  </TouchableOpacity>

                  {/* Call Button */}
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(item.phone)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={14} color={colors.slate700} />
                  </TouchableOpacity>

                  {/* Details Eye Button */}
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => setSelectedOrder(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye" size={15} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          visible={!!selectedOrder}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Order Details</Text>
                  <Text style={styles.modalOrderNumber}>{selectedOrder.order_number}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.slate600} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionHeader}>Customer & Address</Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: '700' }}>Name: </Text>
                  {selectedOrder.customer_name}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: '700' }}>Phone: </Text>
                  {selectedOrder.phone}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: '700' }}>City: </Text>
                  {selectedOrder.city}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: '700' }}>Address: </Text>
                  {selectedOrder.address}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionHeader}>
                  Ordered Items ({selectedOrder.order_items?.length || 0})
                </Text>
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                  selectedOrder.order_items.map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{it.product_name}</Text>
                        <Text style={styles.itemSub}>
                          {it.quantity} {it.unit} × Rs {Number(it.price).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={styles.itemTotal}>Rs {Number(it.total).toLocaleString()}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.mutedText}>No item details found</Text>
                )}
              </View>

              <View style={styles.modalTotalRow}>
                <Text style={styles.totalLabel}>Total COD Bill</Text>
                <Text style={styles.totalValue}>
                  Rs {Number(selectedOrder.total_amount).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    backgroundColor: colors.white,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.slate900,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  tabPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.slate100,
  },
  tabActive: {
    backgroundColor: colors.slate900,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate600,
  },
  tabTextActive: {
    color: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  mutedText: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate800,
    marginTop: 8,
  },
  listContent: {
    padding: 14,
    gap: 12,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    paddingBottom: 8,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.slate900,
  },
  orderDate: {
    fontSize: 10,
    color: colors.slate400,
    marginTop: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
  },
  customerPhone: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 1,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.slate900,
  },
  codLabel: {
    fontSize: 9,
    color: colors.slate400,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    paddingTop: 10,
    marginTop: 2,
  },
  statusActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.slate50,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate700,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  whatsappBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.slate900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalOrderNumber: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.slate100,
  },
  modalSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate500,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalText: {
    fontSize: 12,
    color: colors.slate800,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
  },
  itemSub: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 1,
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.slate900,
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate700,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryDark,
  },
});
