import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AQUALAN_BLUE = '#0077B6';
const AQUALAN_LIGHT_BLUE = '#00B4D8';
const AQUALAN_DARK = '#023E8A';

const MESES: { [key: number]: string } = {
  0: 'ENERO', 1: 'FEBRERO', 2: 'MARZO', 3: 'ABRIL', 4: 'MAYO', 5: 'JUNIO',
  6: 'JULIO', 7: 'AGOSTO', 8: 'SEPTIEMBRE', 9: 'OCTUBRE', 10: 'NOVIEMBRE', 11: 'DICIEMBRE',
};

interface CartItemOrder {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  image_url?: string;
  price?: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  delivery_address: string;
  delivery_city?: string;
  delivery_zone?: string;
  items: CartItemOrder[];
  notes?: string;
  total?: number;
  status: string;
  delivery_date?: string | null;
  delivery_day?: string | null;
  created_at: string;
}

function groupOrdersByMonth(orders: Order[]): { key: string; label: string; orders: Order[] }[] {
  const byMonth: { [key: string]: Order[] } = {};
  const sorted = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  for (const order of sorted) {
    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(order);
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, orders]) => ({ key, label: `${MESES[new Date(orders[0].created_at).getMonth()]} ${new Date(orders[0].created_at).getFullYear()}`, orders }));
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const loadLocalOrders = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('local_orders');
      setOrders(data ? JSON.parse(data) : []);
    } catch (error) {
      console.error('Error loading local orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadLocalOrders();
    }, [loadLocalOrders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLocalOrders();
  }, [loadLocalOrders]);

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

  const groups = groupOrdersByMonth(orders);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AQUALAN_BLUE} />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>Aún no tienes pedidos</Text>
          <Text style={styles.emptyText}>
            Los pedidos que realices se guardarán aquí en tu dispositivo
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AQUALAN_BLUE]}
            />
          }
        >
          {groups.map(({ key, label, orders: monthOrders }) => {
            const isMonthExpanded = expandedMonth === key;
            return (
              <View key={key} style={styles.monthSection}>
                <TouchableOpacity
                  style={styles.monthBanner}
                  onPress={() => setExpandedMonth(isMonthExpanded ? null : key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.monthBannerText}>{label}</Text>
                  <Text style={styles.monthBannerCount}>
                    {monthOrders.length} pedido{monthOrders.length !== 1 ? 's' : ''}
                  </Text>
                  <Ionicons
                    name={isMonthExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {isMonthExpanded &&
                  monthOrders.map((order) => {
                    const isOrderExpanded = expandedOrder === order.id;
                    return (
                      <TouchableOpacity
                        key={order.id}
                        style={styles.orderCard}
                        onPress={() =>
                          setExpandedOrder(isOrderExpanded ? null : order.id)
                        }
                        activeOpacity={0.8}
                      >
                        <View style={styles.orderHeader}>
                          <View style={styles.orderIdContainer}>
                            <Ionicons
                              name={getStatusIcon(order.status)}
                              size={22}
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
                          {order.total != null && (
                            <Text style={styles.orderTotal}>
                              {order.total.toFixed(2)}€
                            </Text>
                          )}
                        </View>

                        {isOrderExpanded && (
                          <View style={styles.orderDetails}>
                            <View style={styles.divider} />
                            <Text style={styles.detailLabel}>Productos:</Text>
                            {order.items.map((item, index) => (
                              <View key={index} style={styles.orderItem}>
                                <Text style={styles.orderItemName}>
                                  {item.quantity}x {item.product_name}
                                </Text>
                                <Text style={styles.orderItemUnit}>{item.unit}</Text>
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
                                {(order.delivery_city || order.delivery_zone) && (
                                  <Text style={styles.detailSubvalue}>
                                    {order.delivery_city || order.delivery_zone}
                                  </Text>
                                )}
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
                            name={isOrderExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#999"
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            );
          })}
          <View style={{ height: 24 }} />
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
  scroll: {
    flex: 1,
  },
  monthSection: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  monthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AQUALAN_DARK,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  monthBannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  monthBannerCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginRight: 8,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    marginLeft: 8,
    marginRight: 8,
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
    gap: 10,
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
    alignItems: 'center',
    paddingVertical: 6,
  },
  orderItemName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  orderItemUnit: {
    fontSize: 13,
    color: '#999',
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
