import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';

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
  image_url: string;
}

interface DeliveryZone {
  id: string;
  name: string;
}

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCart();
      fetchDeliveryZones();
    }, [])
  );

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(items));
      setCartItems(items);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const fetchDeliveryZones = async () => {
    try {
      const response = await fetch(`${API_URL}/api/delivery-zones`);
      const data = await response.json();
      setDeliveryZones(data);
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cartItems
      .map((item) => {
        if (item.product_id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      })
      .filter((item) => item !== null) as CartItem[];
    saveCart(newCart);
  };

  const removeItem = (productId: string) => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar este producto del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const newCart = cartItems.filter(
              (item) => item.product_id !== productId
            );
            saveCart(newCart);
          },
        },
      ]
    );
  };

  const clearCart = () => {
    Alert.alert(
      'Vaciar carrito',
      '¿Estás seguro de que quieres vaciar todo el carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: () => saveCart([]),
        },
      ]
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Por favor introduce tu nombre');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('Error', 'Por favor introduce un email válido');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Por favor introduce tu teléfono');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Por favor introduce tu dirección de entrega');
      return false;
    }
    if (!selectedZone) {
      Alert.alert('Error', 'Por favor selecciona una zona de entrega');
      return false;
    }
    return true;
  };

  const submitOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        delivery_address: formData.address,
        delivery_zone: selectedZone,
        items: cartItems,
        notes: formData.notes,
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        await saveCart([]);
        setShowCheckout(false);
        setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
        setSelectedZone('');
        Alert.alert(
          '¡Pedido realizado!',
          'Tu pedido ha sido enviado correctamente. Te contactaremos pronto para confirmar la entrega.',
          [
            {
              text: 'Ver pedidos',
              onPress: () => router.push('/orders'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo procesar el pedido. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      Alert.alert('Error', 'Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (showCheckout) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Finalizar Pedido</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.checkoutForm}>
            <Text style={styles.formLabel}>Nombre completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <Text style={styles.formLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />

            <Text style={styles.formLabel}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              placeholder="+34 600 000 000"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />

            <Text style={styles.formLabel}>Zona de entrega *</Text>
            <View style={styles.zonesContainer}>
              {deliveryZones.map((zone) => (
                <TouchableOpacity
                  key={zone.id}
                  style={[
                    styles.zoneChip,
                    selectedZone === zone.id && styles.zoneChipActive,
                  ]}
                  onPress={() => setSelectedZone(zone.id)}
                >
                  <Text
                    style={[
                      styles.zoneChipText,
                      selectedZone === zone.id && styles.zoneChipTextActive,
                    ]}
                  >
                    {zone.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Dirección de entrega *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Calle, número, piso, ciudad..."
              multiline
              numberOfLines={3}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />

            <Text style={styles.formLabel}>Notas adicionales</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Instrucciones especiales, horario preferido..."
              multiline
              numberOfLines={3}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
            />

            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Resumen del pedido</Text>
              {cartItems.map((item) => (
                <View key={item.product_id} style={styles.summaryItem}>
                  <Text style={styles.summaryItemName}>
                    {item.quantity}x {item.product_name}
                  </Text>
                  <Text style={styles.summaryItemPrice}>
                    {(item.price * item.quantity).toFixed(2)}€
                  </Text>
                </View>
              ))}
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalPrice}>
                  {calculateTotal().toFixed(2)}€
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={submitOrder}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carrito</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptyText}>
            Añade productos para realizar tu pedido
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/products')}
          >
            <Text style={styles.shopButtonText}>Ver productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartList}>
            {cartItems.map((item) => (
              <View key={item.product_id} style={styles.cartItem}>
                <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {item.price.toFixed(2)}€ /{item.unit}
                  </Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.product_id, -1)}
                    >
                      <Ionicons name="remove" size={20} color={AQUALAN_BLUE} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.product_id, 1)}
                    >
                      <Ionicons name="add" size={20} color={AQUALAN_BLUE} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <Text style={styles.itemTotal}>
                    {(item.price * item.quantity).toFixed(2)}€
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeItem(item.product_id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                {calculateTotal().toFixed(2)}€
              </Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => setShowCheckout(true)}
            >
              <Text style={styles.checkoutButtonText}>Realizar Pedido</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  shopButton: {
    backgroundColor: AQUALAN_BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    color: '#333',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: AQUALAN_DARK,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AQUALAN_DARK,
  },
  checkoutButton: {
    backgroundColor: AQUALAN_BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  checkoutForm: {
    flex: 1,
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  zonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zoneChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
  },
  zoneChipActive: {
    backgroundColor: AQUALAN_BLUE,
  },
  zoneChipText: {
    fontSize: 14,
    color: AQUALAN_BLUE,
    fontWeight: '500',
  },
  zoneChipTextActive: {
    color: '#FFFFFF',
  },
  orderSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryItemName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AQUALAN_DARK,
  },
  submitButton: {
    backgroundColor: AQUALAN_BLUE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
