import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabase';
import { Product, Order } from '../types/wholesale';
import { colors } from '../theme/colors';

interface DashboardScreenProps {
  navigation: any;
  onLogout: () => void;
}

export default function DashboardScreen({ navigation, onLogout }: DashboardScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [prodRes, orderRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (orderRes.data) setOrders(orderRes.data);
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered');
  const lowStockProducts = products.filter((p) => Number(p.stock) <= 10);
  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchDashboardData();
          }}
          colors={[colors.primary]}
        />
      }
    >
      {/* Top Bar Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 20 }}>🍬</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>PAKISTAN CONFECTIONARY</Text>
            <Text style={styles.brandUrdu}>ایڈمن پورٹل • Admin Console</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Urgent Low Stock Banner */}
      {lowStockProducts.length > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('Stock')}
          activeOpacity={0.8}
        >
          <View style={styles.alertIconBg}>
            <Ionicons name="warning-outline" size={18} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Low Stock Warning / اسٹاک کی کمی</Text>
            <Text style={styles.alertText}>
              <Text style={{ fontWeight: '900' }}>{lowStockProducts.length} products</Text> have 10 or fewer units in stock.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.primaryDark} />
        </TouchableOpacity>
      )}

      {/* 4 Summary Stat Cards */}
      <View style={styles.statsGrid}>
        {/* Total Orders */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Total Orders</Text>
            <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="receipt-outline" size={16} color={colors.primaryDark} />
            </View>
          </View>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statSubText}>{pendingOrders.length} Pending / زیر التوا</Text>
        </View>

        {/* Total Revenue */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Total Sales</Text>
            <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="cash-outline" size={16} color={colors.success} />
            </View>
          </View>
          <Text style={styles.statValue}>Rs {(totalRevenue / 1000).toFixed(0)}k</Text>
          <Text style={styles.statSubText}>Rs {totalRevenue.toLocaleString()}</Text>
        </View>

        {/* Delivered Orders */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Delivered</Text>
            <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="checkmark-done" size={16} color={colors.info} />
            </View>
          </View>
          <Text style={styles.statValue}>{deliveredOrders.length}</Text>
          <Text style={styles.statSubText}>ترسیل مکمل</Text>
        </View>

        {/* Total Catalog Items */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Total Items</Text>
            <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="cube-outline" size={16} color={colors.slate700} />
            </View>
          </View>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statSubText}>کل پروڈکٹس</Text>
        </View>
      </View>

      {/* Quick Action Navigation Cards */}
      <Text style={styles.sectionTitle}>Quick Actions / فوری رسائی</Text>
      <View style={styles.actionsList}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="cart-outline" size={20} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Customer Orders Desk</Text>
            <Text style={styles.actionUrdu}>کسٹمر آرڈرز، واٹس ایپ تصدیق و اسٹیٹس تبدیلی</Text>
          </View>
          {pendingOrders.length > 0 && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{pendingOrders.length} New</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.slate400} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Stock')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="file-tray-stacked-outline" size={20} color={colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Inventory & Stock Catalog</Text>
            <Text style={styles.actionUrdu}>کارٹن ریٹس، اسٹاک مقدار اور مال کی فہرست</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.slate400} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('AddProduct')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="add-circle-outline" size={20} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Add New Product</Text>
            <Text style={styles.actionUrdu}>کیمرے سے تصویر اور نیا ریٹ شامل کریں</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.slate400} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.slate500,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.slate900,
  },
  brandUrdu: {
    fontSize: 11,
    color: colors.slate500,
  },
  logoutBtn: {
    padding: 9,
    borderRadius: 12,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  alertIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },
  alertText: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
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
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate400,
    textTransform: 'uppercase',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.slate900,
    marginTop: 6,
  },
  statSubText: {
    fontSize: 10,
    color: colors.slate500,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate700,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsList: {
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  actionUrdu: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  badgePill: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
});
