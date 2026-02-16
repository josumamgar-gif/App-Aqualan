import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

const AQUALAN_BLUE = '#0077B6';
const AQUALAN_LIGHT_BLUE = '#00B4D8';
const AQUALAN_DARK = '#023E8A';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_zone: string;
  items: CartItem[];
  notes?: string;
  total: number;
  status: string;
  created_at: string;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async (searchEmail?: string) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/orders`;
      if (searchEmail) {
        url += `?email=${encodeURIComponent(searchEmail)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setOrders(data);
      setSearched(true);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (email) {
      fetchOrders(email);
    } else {
      setRefreshing(false);
    }
  }, [email]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pendiente: '#FFA500',
      confirmado: '#4CAF50',
      en_camino: '#2196F3',
      entregado: '#8BC34A',
      cancelado: '#F44336',
    };
    return colors[status] || '#999';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_camino: 'En camino',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      pendiente: 'time',
      confirmado: 'checkmark-circle',
      en_camino: 'car',
      entregado: 'checkmark-done-circle',
      cancelado: 'close-circle',
    };
    return icons[status] || 'help-circle';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="mail-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Introduce tu email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => fetchOrders(email)}
        >
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {!searched ? (
        <View style={styles.infoContainer}>
          <Ionicons name="document-text-outline" size={64} color="#CCC" />
          <Text style={styles.infoTitle}>Consulta tus pedidos</Text>
          <Text style={styles.infoText}>
            Introduce el email con el que realizaste tus pedidos para ver su estado
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AQUALAN_BLUE} />
          <Text style={styles.loadingText}>Buscando pedidos...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No hay pedidos</Text>
          <Text style={styles.emptyText}>
            No se encontraron pedidos para este email
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AQUALAN_BLUE]}
            />
          }
        >
          {orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() =>
                setExpandedOrder(
                  expandedOrder === order.id ? null : order.id
                )
              }
              activeOpacity={0.8}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderIdContainer}>
                  <Ionicons
                    name={getStatusIcon(order.status)}
                    size={24}
                    color={getStatusColor(order.status)}
                  />
                  <View>
                    <Text style={styles.orderId}>
                      Pedido #{order.id.slice(-8).toUpperCase()}
                    </Text>
                    <Text style={styles.orderDate}>
                      {formatDate(order.created_at)}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(order.status) },
                    ]}
                  >
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.orderItemsCount}>
                  {order.items.length} producto(s)
                </Text>
                <Text style={styles.orderTotal}>
                  {order.total.toFixed(2)}€
                </Text>
              </View>

              {expandedOrder === order.id && (
                <View style={styles.orderDetails}>
                  <View style={styles.divider} />
                  
                  <Text style={styles.detailLabel}>Productos:</Text>
                  {order.items.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <Text style={styles.orderItemName}>
                        {item.quantity}x {item.product_name}
                      </Text>
                      <Text style={styles.orderItemPrice}>
                        {(item.price * item.quantity).toFixed(2)}€
                      </Text>
                    </View>
                  ))}

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={18} color={AQUALAN_BLUE} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Dirección:</Text>
                      <Text style={styles.detailValue}>
                        {order.delivery_address}
                      </Text>
                      <Text style={styles.detailSubvalue}>
                        Zona: {order.delivery_zone}
                      </Text>
                    </View>
                  </View>

                  {order.notes && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={18} color={AQUALAN_BLUE} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Notas:</Text>
                        <Text style={styles.detailValue}>{order.notes}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.expandIndicator}>
                <Ionicons
                  name={expandedOrder === order.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#999"
                />
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FC',
  },
  header: {
    backgroundColor: AQUALAN_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: AQUALAN_BLUE,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  orderItemsCount: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AQUALAN_DARK,
  },
  orderDetails: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  orderItemName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailSubvalue: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
});
