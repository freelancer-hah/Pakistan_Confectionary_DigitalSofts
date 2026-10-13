import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabase';
import { Product, ProductType } from '../types/wholesale';
import { colors } from '../theme/colors';

interface InventoryScreenProps {
  navigation: any;
}

export default function InventoryScreen({ navigation }: InventoryScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'wholesale' | 'retail' | 'low_stock'>('all');

  // Stock edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [customStock, setCustomStock] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (err: any) {
      console.error('Fetch products error:', err);
      Alert.alert('Error', 'Failed to load inventory products.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Quick delta adjustment (+1 or -1)
  async function handleStockDelta(product: Product, delta: number) {
    const nextStock = Math.max(0, Number(product.stock) + delta);
    if (nextStock === product.stock) return;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: nextStock } : p))
    );

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: nextStock })
        .eq('id', product.id);

      if (error) {
        // Rollback
        fetchProducts();
        Alert.alert('Stock Update Failed', error.message);
      }
    } catch (err: any) {
      fetchProducts();
      Alert.alert('Error', err.message || 'Unable to adjust stock.');
    }
  }

  // Exact stock edit modal
  function openEditModal(product: Product) {
    setEditingProduct(product);
    setCustomStock(String(product.stock));
    setEditModalVisible(true);
  }

  async function handleSaveCustomStock() {
    if (!editingProduct) return;
    const parsedStock = parseInt(customStock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid stock number (0 or greater).');
      return;
    }

    setSavingStock(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: parsedStock })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, stock: parsedStock } : p))
      );
      setEditModalVisible(false);
      setEditingProduct(null);
    } catch (err: any) {
      Alert.alert('Failed to Update Stock', err.message);
    } finally {
      setSavingStock(false);
    }
  }

  // Delete product with confirmation
  function handleDeleteProduct(product: Product) {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?\nکیا آپ واقعی اس پروڈکٹ کو ختم کرنا چاہتے ہیں؟`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

              if (error) throw error;
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
              Alert.alert('Success', `"${product.name}" has been removed.`);
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message);
            }
          },
        },
      ]
    );
  }

  // Filter & Search
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.unit?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'wholesale') return p.product_type === 'wholesale';
    if (selectedFilter === 'retail') return p.product_type === 'retail';
    if (selectedFilter === 'low_stock') return Number(p.stock) <= 10;
    return true;
  });

  const wholesaleCount = products.filter((p) => p.product_type === 'wholesale').length;
  const retailCount = products.filter((p) => p.product_type === 'retail').length;
  const lowStockCount = products.filter((p) => Number(p.stock) <= 10).length;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventory & Stock</Text>
          <Text style={styles.headerSubtitle}>
            {products.length} products • {lowStockCount} low stock
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.slate400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, cartons, pieces... / تلاش کریں"
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

      {/* Filter Pills */}
      <View style={styles.filterPills}>
        <TouchableOpacity
          style={[styles.pill, selectedFilter === 'all' && styles.pillActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.pillText, selectedFilter === 'all' && styles.pillTextActive]}>
            All ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, selectedFilter === 'wholesale' && styles.pillActive]}
          onPress={() => setSelectedFilter('wholesale')}
        >
          <Text style={[styles.pillText, selectedFilter === 'wholesale' && styles.pillTextActive]}>
            Wholesale ({wholesaleCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, selectedFilter === 'retail' && styles.pillActive]}
          onPress={() => setSelectedFilter('retail')}
        >
          <Text style={[styles.pillText, selectedFilter === 'retail' && styles.pillTextActive]}>
            Retail ({retailCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pill,
            selectedFilter === 'low_stock' && styles.pillDangerActive,
          ]}
          onPress={() => setSelectedFilter('low_stock')}
        >
          <Text
            style={[
              styles.pillText,
              selectedFilter === 'low_stock' && styles.pillDangerTextActive,
            ]}
          >
            Low Stock ({lowStockCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={colors.slate300} />
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or category filter</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLowStock = Number(item.stock) <= 10 && Number(item.stock) > 0;
            const isOutOfStock = Number(item.stock) <= 0;
            const isWholesale = item.product_type === 'wholesale';

            return (
              <View style={styles.productCard}>
                <View style={styles.cardHeader}>
                  {/* Thumbnail */}
                  <View style={styles.imageWrapper}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="cube" size={24} color={colors.slate400} />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.infoWrapper}>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          isWholesale ? styles.wholesaleBadge : styles.retailBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeBadgeText,
                            isWholesale ? styles.wholesaleBadgeText : styles.retailBadgeText,
                          ]}
                        >
                          {isWholesale ? 'WHOLESALE' : 'RETAIL'}
                        </Text>
                      </View>
                      <View style={styles.unitBadge}>
                        <Text style={styles.unitBadgeText}>{item.unit || 'Carton'}</Text>
                      </View>
                    </View>

                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>

                    <Text style={styles.productPrice}>
                      Rs {Number(item.price).toLocaleString()}
                      <Text style={styles.pricePerUnit}> / {item.unit || 'unit'}</Text>
                    </Text>
                  </View>

                  {/* Action Menu (Delete) */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteProduct(item)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                {/* Stock Management Footer */}
                <View style={styles.stockFooter}>
                  {/* Stock status indicator */}
                  <View style={styles.stockIndicatorRow}>
                    <Text style={styles.stockLabel}>Stock:</Text>
                    <View
                      style={[
                        styles.stockStatusBadge,
                        isOutOfStock
                          ? styles.outOfStockBadge
                          : isLowStock
                          ? styles.lowStockBadge
                          : styles.inStockBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockStatusText,
                          isOutOfStock
                            ? styles.outOfStockText
                            : isLowStock
                            ? styles.lowStockText
                            : styles.inStockText,
                        ]}
                      >
                        {isOutOfStock
                          ? 'Out of Stock'
                          : isLowStock
                          ? `Low (${item.stock})`
                          : `${item.stock} Available`}
                      </Text>
                    </View>
                  </View>

                  {/* Stepper & Edit */}
                  <View style={styles.stepperWrapper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => handleStockDelta(item, -1)}
                      disabled={Number(item.stock) <= 0}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={Number(item.stock) <= 0 ? colors.slate300 : colors.slate700}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.stockNumberBtn}
                      onPress={() => openEditModal(item)}
                    >
                      <Text style={styles.stockNumberText}>{item.stock}</Text>
                      <Ionicons name="pencil" size={10} color={colors.slate400} style={{ marginLeft: 3 }} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => handleStockDelta(item, 1)}
                    >
                      <Ionicons name="add" size={16} color={colors.slate700} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Stock Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Stock</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.slate500} />
              </TouchableOpacity>
            </View>

            {editingProduct && (
              <>
                <Text style={styles.modalProduct}>{editingProduct.name}</Text>
                <Text style={styles.modalUnit}>
                  Current: {editingProduct.stock} {editingProduct.unit}s
                </Text>

                <View style={styles.modalInputWrapper}>
                  <Text style={styles.modalInputLabel}>New Stock Count:</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={customStock}
                    onChangeText={setCustomStock}
                    autoFocus
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    onPress={handleSaveCustomStock}
                    disabled={savingStock}
                  >
                    {savingStock ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.modalSaveText}>Save Stock</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.slate800,
  },
  filterPills: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.slate900,
    borderColor: colors.slate900,
  },
  pillDangerActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate600,
  },
  pillTextActive: {
    color: colors.white,
  },
  pillDangerTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.slate500,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate700,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 4,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.slate100,
    overflow: 'hidden',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoWrapper: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wholesaleBadge: {
    backgroundColor: colors.primaryLight,
  },
  retailBadge: {
    backgroundColor: colors.infoLight,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wholesaleBadgeText: {
    color: colors.primaryDark,
  },
  retailBadgeText: {
    color: colors.info,
  },
  unitBadge: {
    backgroundColor: colors.slate100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.slate600,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate900,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 4,
  },
  pricePerUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.slate500,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
  },
  stockFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  stockIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
  },
  stockStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inStockBadge: {
    backgroundColor: colors.successLight,
  },
  lowStockBadge: {
    backgroundColor: colors.primaryLight,
  },
  outOfStockBadge: {
    backgroundColor: colors.dangerLight,
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inStockText: {
    color: colors.success,
  },
  lowStockText: {
    color: colors.primaryDark,
  },
  outOfStockText: {
    color: colors.danger,
  },
  stepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate100,
    borderRadius: 8,
    padding: 2,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  stockNumberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stockNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate800,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: colors.slate950,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
  },
  modalProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate700,
  },
  modalUnit: {
    fontSize: 12,
    color: colors.slate500,
    marginBottom: 16,
  },
  modalInputWrapper: {
    marginBottom: 20,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate600,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.slate100,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate600,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
