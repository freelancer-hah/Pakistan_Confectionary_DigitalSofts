import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../api/supabase';
import { Product, ProductType } from '../../types/wholesale';
import { colors } from '../../theme/colors';
import { useCart, MIN_ORDER_WHOLESALE, MIN_ORDER_RETAIL } from '../../context/CartContext';
import CustomerAuthModal from './CustomerAuthModal';

interface ShopScreenProps {
  navigation: any;
}

export default function ShopScreen({ navigation }: ShopScreenProps) {
  const {
    cart,
    activeTab,
    setActiveTab,
    customer,
    addToCart,
    updateQuantity,
    cartTotal,
    totalItemsCount,
    minRequired,
    isMinOrderMet,
    progressPercent,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [authModalVisible, setAuthModalVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (err: any) {
      console.error('Fetch storefront products error:', err);
      Alert.alert('Error', 'Unable to fetch products catalog.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleProductAdd(product: Product) {
    if (!customer) {
      setAuthModalVisible(true);
      return;
    }

    const res = addToCart(product);
    if (!res.success && res.message) {
      Alert.alert('Notice', res.message);
    }
  }

  const displayedProducts = products.filter((p) => {
    if (p.product_type !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.unit?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 22 }}>🍬</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>PAKISTAN CONFECTIONARY</Text>
            <TouchableOpacity
              onPress={() => setAuthModalVisible(true)}
              style={styles.deliveryBadge}
            >
              <Ionicons name="location-sharp" size={12} color={colors.primaryDark} />
              <Text style={styles.deliveryText}>
                {customer ? `${customer.name} • ${customer.city}` : 'Tap to set Delivery Address'}
              </Text>
              <Ionicons name="chevron-down" size={10} color={colors.slate500} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cartHeaderBtn}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={20} color={colors.slate800} />
          {totalItemsCount > 0 && (
            <View style={styles.headerCartBadge}>
              <Text style={styles.headerCartBadgeText}>{totalItemsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Mode Switcher Tabs (Wholesale vs Retail) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.modeTab, activeTab === 'wholesale' && styles.modeTabActiveWholesale]}
          onPress={() => setActiveTab('wholesale')}
        >
          <Ionicons
            name="cube"
            size={16}
            color={activeTab === 'wholesale' ? colors.slate950 : colors.slate500}
          />
          <View style={styles.tabTextCol}>
            <Text
              style={[
                styles.modeTabText,
                activeTab === 'wholesale' && styles.modeTabTextActiveWholesale,
              ]}
            >
              Wholesale (Cartons)
            </Text>
            <Text style={styles.tabUrdu}>ہول سیل کارٹن ریٹس</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeTab === 'retail' && styles.modeTabActiveRetail]}
          onPress={() => setActiveTab('retail')}
        >
          <Ionicons
            name="pricetags"
            size={16}
            color={activeTab === 'retail' ? colors.white : colors.slate500}
          />
          <View style={styles.tabTextCol}>
            <Text
              style={[
                styles.modeTabText,
                activeTab === 'retail' && styles.modeTabTextActiveRetail,
              ]}
            >
              Retail (Pieces)
            </Text>
            <Text
              style={[
                styles.tabUrdu,
                activeTab === 'retail' && { color: '#e0f2fe' },
              ]}
            >
              پرچون پیکٹس و پیس
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Minimum Order Limit Banner */}
      <View style={styles.minOrderBanner}>
        <View style={styles.minOrderHeader}>
          <Text style={styles.minOrderLabel}>
            Min. Order Limit: <Text style={styles.minOrderVal}>Rs {minRequired.toLocaleString()}</Text>
          </Text>
          <Text style={styles.minOrderStatus}>
            {isMinOrderMet
              ? '✅ Ready to Order'
              : `Rs ${(minRequired - cartTotal).toLocaleString()} more needed`}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: isMinOrderMet ? colors.success : colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.slate400} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search candies, toffees, cartons... / تلاش کریں"
          placeholderTextColor={colors.slate400}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.slate400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Catalog List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading fresh rates & catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            totalItemsCount > 0 && { paddingBottom: 90 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchProducts();
              }}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color={colors.slate300} />
              <Text style={styles.emptyTitle}>No products found in this category</Text>
              <Text style={styles.emptySubtitle}>Try switching between Wholesale and Retail tabs</Text>
            </View>
          }
          renderItem={({ item }) => {
            const inCart = cart.find((c) => c.product.id === item.id);
            const isOutOfStock = Number(item.stock) <= 0;
            const isLowStock = Number(item.stock) > 0 && Number(item.stock) <= 10;

            return (
              <View style={styles.productCard}>
                {/* Image */}
                <View style={styles.imageCol}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.prodImage} />
                  ) : (
                    <View style={styles.imgPlaceholder}>
                      <Ionicons name="cube" size={28} color={colors.slate400} />
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.detailsCol}>
                  <View style={styles.unitRow}>
                    <View style={styles.unitTag}>
                      <Text style={styles.unitTagText}>{item.unit || 'Carton'}</Text>
                    </View>

                    {isOutOfStock ? (
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    ) : isLowStock ? (
                      <Text style={styles.lowStockText}>Low Stock ({item.stock})</Text>
                    ) : (
                      <Text style={styles.inStockText}>In Stock ({item.stock})</Text>
                    )}
                  </View>

                  <Text style={styles.prodTitle} numberOfLines={2}>
                    {item.name}
                  </Text>

                  {item.description ? (
                    <Text style={styles.prodDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}

                  {/* Price & Stepper Row */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.priceVal}>
                        Rs {Number(item.price).toLocaleString()}
                      </Text>
                      <Text style={styles.pricePer}>per {item.unit || 'unit'}</Text>
                    </View>

                    {/* Cart actions */}
                    {isOutOfStock ? (
                      <View style={styles.disabledBtn}>
                        <Text style={styles.disabledBtnText}>Sold Out</Text>
                      </View>
                    ) : inCart ? (
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepAction}
                          onPress={() => updateQuantity(item.id, -1)}
                        >
                          <Ionicons name="remove" size={14} color={colors.slate800} />
                        </TouchableOpacity>
                        <Text style={styles.stepQuantity}>{inCart.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepAction}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <Ionicons name="add" size={14} color={colors.slate800} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addCartBtn}
                        onPress={() => handleProductAdd(item)}
                      >
                        <Ionicons name="cart-outline" size={16} color={colors.slate950} />
                        <Text style={styles.addCartBtnText}>Add to Cart</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Floating Bottom Cart Summary Bar */}
      {totalItemsCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItemsCount}</Text>
            </View>
            <View>
              <Text style={styles.floatingCartTotal}>Rs {cartTotal.toLocaleString()}</Text>
              <Text style={styles.floatingCartSub}>
                {isMinOrderMet ? 'Ready to Checkout' : `Needs Rs ${(minRequired - cartTotal).toLocaleString()} more`}
              </Text>
            </View>
          </View>

          <View style={styles.floatingCartRight}>
            <Text style={styles.viewCartText}>View Cart / آرڈر دیکھیں</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.slate950} />
          </View>
        </TouchableOpacity>
      )}

      {/* Customer Delivery Details Modal */}
      <CustomerAuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.slate900,
    letterSpacing: 0.5,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  deliveryText: {
    fontSize: 11,
    color: colors.slate600,
    fontWeight: '600',
    maxWidth: 180,
  },
  cartHeaderBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerCartBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.slate950,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  modeTabActiveWholesale: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  modeTabActiveRetail: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  tabTextCol: {
    flex: 1,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate700,
  },
  modeTabTextActiveWholesale: {
    color: colors.slate950,
    fontWeight: '800',
  },
  modeTabTextActiveRetail: {
    color: colors.white,
    fontWeight: '800',
  },
  tabUrdu: {
    fontSize: 9,
    color: colors.slate500,
    marginTop: 1,
  },
  minOrderBanner: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  minOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  minOrderLabel: {
    fontSize: 11,
    color: colors.slate600,
    fontWeight: '600',
  },
  minOrderVal: {
    fontWeight: '800',
    color: colors.slate900,
  },
  minOrderStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: colors.slate100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.slate900,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 12,
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  imageCol: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.slate100,
  },
  prodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imgPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  unitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitTag: {
    backgroundColor: colors.slate100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate600,
  },
  inStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
  },
  prodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate900,
    marginTop: 2,
  },
  prodDesc: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  priceVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate900,
  },
  pricePer: {
    fontSize: 10,
    color: colors.slate400,
  },
  addCartBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addCartBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate950,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate100,
    borderRadius: 8,
    padding: 2,
  },
  stepAction: {
    width: 26,
    height: 26,
    backgroundColor: colors.white,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepQuantity: {
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate900,
  },
  disabledBtn: {
    backgroundColor: colors.slate100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disabledBtnText: {
    fontSize: 10,
    color: colors.slate400,
    fontWeight: '600',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBadge: {
    backgroundColor: colors.slate950,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  floatingCartTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.slate950,
  },
  floatingCartSub: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.slate800,
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCartText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate950,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.slate500,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate700,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 4,
  },
});
