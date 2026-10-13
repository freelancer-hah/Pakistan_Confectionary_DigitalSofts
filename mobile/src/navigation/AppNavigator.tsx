import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabase';
import { colors } from '../theme/colors';
import { useCart, CustomerProfile } from '../context/CartContext';

// Auth Screen (Customer Login / Register & Admin Login)
import AuthScreen from '../screens/AuthScreen';

// Customer Screens
import ShopScreen from '../screens/customer/ShopScreen';
import CartScreen from '../screens/customer/CartScreen';
import TrackingScreen from '../screens/customer/TrackingScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';

// Admin Screens
import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import InventoryScreen from '../screens/InventoryScreen';
import AddProductScreen from '../screens/AddProductScreen';

const CustomerTab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();

const STORAGE_KEY_ROLE = '@wholesale_user_role';

export default function AppNavigator() {
  const { totalItemsCount, setCustomer } = useCart();
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<'customer' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check existing session and role
    async function initAuth() {
      try {
        const [{ data }, savedRole] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem(STORAGE_KEY_ROLE),
        ]);

        setSession(data.session);

        if (data.session) {
          const role = (savedRole as 'customer' | 'admin') ||
            (data.session.user.user_metadata?.role === 'customer' ? 'customer' : 'admin');
          setUserRole(role);

          // If customer, ensure profile is loaded into context
          if (role === 'customer' && data.session.user.user_metadata) {
            const meta = data.session.user.user_metadata;
            const profile: CustomerProfile = {
              name: meta.name || data.session.user.email?.split('@')[0] || 'Customer',
              phone: meta.phone || '03001234567',
              email: data.session.user.email,
              city: meta.city || 'Karachi',
              address: meta.address || 'Market Shop',
            };
            setCustomer(profile);
          }
        }
      } catch (err) {
        console.warn('Init auth error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // 2. Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setUserRole(null);
        await AsyncStorage.removeItem(STORAGE_KEY_ROLE);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLoginSuccess(role: 'customer' | 'admin') {
    setUserRole(role);
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, role);
  }

  // Customer Log Out
  async function handleCustomerLogout() {
    Alert.alert(
      'Log Out / لاگ آؤٹ',
      'Are you sure you want to sign out of your account?\nکیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await AsyncStorage.removeItem(STORAGE_KEY_ROLE);
              setUserRole(null);
              setSession(null);
              setCustomer(null);
            } catch (err: any) {
              Alert.alert('Logout Error', err.message);
            }
          },
        },
      ]
    );
  }

  // Admin Log Out
  async function handleAdminLogout() {
    Alert.alert(
      'Sign Out Admin / ایڈمن لاگ آؤٹ',
      'Do you want to sign out of the Admin console?\nکیا آپ ایڈمن سے لاگ آؤٹ کرنا چاہتے ہیں؟',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await AsyncStorage.removeItem(STORAGE_KEY_ROLE);
              setUserRole(null);
              setSession(null);
            } catch (err: any) {
              Alert.alert('Logout Error', err.message);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // =========================================================================
  // NOT LOGGED IN -> Dedicated Auth Screen
  // =========================================================================
  if (!session || !userRole) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // =========================================================================
  // LOGGED IN AS ADMIN -> Dedicated Admin Panel
  // =========================================================================
  if (userRole === 'admin') {
    return (
      <NavigationContainer>
        <AdminTab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: {
              backgroundColor: colors.white,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            },
            headerTitleStyle: {
              fontSize: 17,
              fontWeight: '800',
              color: colors.slate900,
            },
            tabBarStyle: {
              backgroundColor: colors.white,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: colors.primaryDark,
            tabBarInactiveTintColor: colors.slate400,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
            },
            tabBarIcon: ({ focused, color }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'cube';

              if (route.name === 'Dashboard') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Orders') {
                iconName = focused ? 'receipt' : 'receipt-outline';
              } else if (route.name === 'Stock') {
                iconName = focused ? 'cube' : 'cube-outline';
              } else if (route.name === 'AddProduct') {
                iconName = focused ? 'add-circle' : 'add-circle-outline';
              }

              return <Ionicons name={iconName} size={22} color={color} />;
            },
          })}
        >
          <AdminTab.Screen
            name="Dashboard"
            options={{
              title: 'Admin Overview',
              tabBarLabel: 'Dashboard',
              headerRight: () => (
                <TouchableOpacity
                  onPress={handleAdminLogout}
                  style={styles.headerLogoutBtn}
                >
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              ),
            }}
          >
            {(props) => <DashboardScreen {...props} onLogout={handleAdminLogout} />}
          </AdminTab.Screen>

          <AdminTab.Screen
            name="Orders"
            component={OrdersScreen}
            options={{
              title: 'Orders Desk',
              tabBarLabel: 'Orders',
            }}
          />

          <AdminTab.Screen
            name="Stock"
            component={InventoryScreen}
            options={{
              title: 'Stock Catalog',
              tabBarLabel: 'Stock',
              headerShown: false,
            }}
          />

          <AdminTab.Screen
            name="AddProduct"
            component={AddProductScreen}
            options={{
              title: 'Add Product',
              tabBarLabel: 'Add Item',
            }}
          />
        </AdminTab.Navigator>
      </NavigationContainer>
    );
  }

  // =========================================================================
  // LOGGED IN AS CUSTOMER -> Dedicated Customer Storefront
  // =========================================================================
  return (
    <NavigationContainer>
      <CustomerTab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: colors.white,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '800',
            color: colors.slate900,
          },
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primaryDark,
          tabBarInactiveTintColor: colors.slate400,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'storefront';

            if (route.name === 'Shop') {
              iconName = focused ? 'storefront' : 'storefront-outline';
            } else if (route.name === 'Cart') {
              iconName = focused ? 'cart' : 'cart-outline';
            } else if (route.name === 'Track') {
              iconName = focused ? 'navigate' : 'navigate-outline';
            } else if (route.name === 'Account') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <CustomerTab.Screen
          name="Shop"
          component={ShopScreen}
          options={{
            headerShown: false,
            tabBarLabel: 'Shop',
          }}
        />

        <CustomerTab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            title: 'Shopping Cart',
            tabBarLabel: 'Cart',
            tabBarBadge: totalItemsCount > 0 ? totalItemsCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: colors.primary,
              color: colors.slate950,
              fontWeight: '900',
              fontSize: 10,
            },
          }}
        />

        <CustomerTab.Screen
          name="Track"
          component={TrackingScreen}
          options={{
            title: 'Track Order',
            tabBarLabel: 'Track',
          }}
        />

        <CustomerTab.Screen
          name="Account"
          options={{
            title: 'My Profile',
            tabBarLabel: 'Profile',
            headerRight: () => (
              <TouchableOpacity
                onPress={handleCustomerLogout}
                style={styles.headerLogoutBtn}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            ),
          }}
        >
          {() => <CustomerProfileScreen onLogout={handleCustomerLogout} />}
        </CustomerTab.Screen>
      </CustomerTab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerLogoutBtn: {
    marginRight: 16,
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
  },
});
