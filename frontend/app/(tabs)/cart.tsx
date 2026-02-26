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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { getApiUrl, hasBackend } from '../../lib/api';

const AQUALAN_BLUE = '#0077B6';
const AQUALAN_LIGHT_BLUE = '#00B4D8';
const AQUALAN_DARK = '#023E8A';

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  image_url: string;
}

interface DeliveryInfo {
  found: boolean;
  message: string;
  date: string | null;
  day_name: string | null;
}

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCart();
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

  const fetchDeliveryDate = async (city: string) => {
    if (!city.trim()) {
      setDeliveryInfo(null);
      return;
    }
    if (!hasBackend()) return;
    try {
      const response = await fetch(`${getApiUrl()}/api/delivery-date?city=${encodeURIComponent(city)}`);
      const data = await response.json();
      setDeliveryInfo(data);
    } catch (error) {
      console.error('Error fetching delivery date:', error);
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
    const doRemove = () => {
      const newCart = cartItems.filter(
        (item) => item.product_id !== productId
      );
      saveCart(newCart);
    };
    const isWeb = typeof document !== 'undefined';
    if (isWeb) {
      if (window.confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
        doRemove();
      }
    } else {
      Alert.alert(
        'Eliminar producto',
        '¿Estás seguro de que quieres eliminar este producto del carrito?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: doRemove },
        ]
      );
    }
  };

  const clearCart = () => {
    const isWeb = typeof document !== 'undefined';
    if (isWeb) {
      if (window.confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
        saveCart([]);
      }
    } else {
      Alert.alert(
        'Vaciar carrito',
        '¿Estás seguro de que quieres vaciar todo el carrito?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Vaciar', style: 'destructive', onPress: () => saveCart([]) },
        ]
      );
    }
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
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Por favor introduce tu ciudad');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Por favor introduce tu dirección de entrega');
      return false;
    }
    return true;
  };

  const submitOrder = async () => {
    if (!validateForm()) return;
    if (!hasBackend()) {
      Alert.alert(
        'Backend no configurado',
        'Configura EXPO_PUBLIC_BACKEND_URL para poder enviar pedidos.'
      );
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        delivery_city: formData.city,
        delivery_address: formData.address,
        items: cartItems,
        notes: formData.notes,
      };

      const response = await fetch(`${getApiUrl()}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        // Guardar pedido localmente para "Mis pedidos"
        try {
          const stored = await AsyncStorage.getItem('local_orders');
          const list = stored ? JSON.parse(stored) : [];
          list.unshift(order);
          await AsyncStorage.setItem('local_orders', JSON.stringify(list));
        } catch (e) {
          console.error('Error guardando pedido local:', e);
        }
        // Mostrar en el popup la fecha de entrega que devuelve el backend
        const dateStr = order.delivery_date;
        const dayName = order.delivery_day;
        let message = 'Te contactaremos para confirmar la fecha de entrega.';
        if (dayName && dateStr) {
          const [y, m, d] = dateStr.split('-');
          message = `Tu pedido llegará el ${dayName} ${d}/${m}/${y}`;
        }
        setDeliveryInfo({ message, date: dateStr, day_name: dayName });
        await saveCart([]);
        setShowCheckout(false);
        setShowSuccessModal(true);
      } else {
        const errText = await response.text();
        Alert.alert('Error', 'No se pudo procesar el pedido. Inténtalo de nuevo.');
        console.error('Order error:', response.status, errText);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      Alert.alert('Error', 'Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setFormData({ name: '', email: '', phone: '', city: '', address: '', notes: '' });
    setDeliveryInfo(null);
    router.push('/orders');
  };

  // Success Modal
  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>¡Pedido Enviado!</Text>
          <Text style={styles.successMessage}>
            Tu pedido ha sido recibido correctamente.
          </Text>
          
          {deliveryInfo && (
            <View style={styles.deliveryInfoBox}>
              <Ionicons name="calendar" size={24} color={AQUALAN_BLUE} />
              <Text style={styles.deliveryInfoText}>
                {deliveryInfo.message}
              </Text>
            </View>
          )}
          
          <Text style={styles.successSubMessage}>
            Te contactaremos pronto para confirmar los detalles.
          </Text>
          
          <TouchableOpacity
            style={styles.successButton}
            onPress={closeSuccessModal}
          >
            <Text style={styles.successButtonText}>Ver mis pedidos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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

            <Text style={styles.formLabel}>Ciudad *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Bilbao, Getxo, Barakaldo..."
              value={formData.city}
              onChangeText={(text) => {
                setFormData({ ...formData, city: text });
                fetchDeliveryDate(text);
              }}
            />
            
            {deliveryInfo && (
              <View style={[
                styles.deliveryPreview,
                deliveryInfo.found ? styles.deliveryFound : styles.deliveryNotFound
              ]}>
                <Ionicons 
                  name={deliveryInfo.found ? "calendar" : "information-circle"} 
                  size={20} 
                  color={deliveryInfo.found ? AQUALAN_BLUE : "#FF9800"} 
                />
                <Text style={[
                  styles.deliveryPreviewText,
                  !deliveryInfo.found && { color: '#FF9800' }
                ]}>
                  {deliveryInfo.message}
                </Text>
              </View>
            )}

            <Text style={styles.formLabel}>Dirección de entrega *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Calle, número, piso..."
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
                  <Text style={styles.summaryItemUnit}>
                    {item.unit}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={submitOrder}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Enviando...' : 'Enviar Pedido'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        <SuccessModal />
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
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  <Text style={styles.itemUnit}>{item.unit}</Text>
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
                <TouchableOpacity
                  onPress={() => removeItem(item.product_id)}
                  style={styles.removeButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Eliminar del carrito"
                >
                  <Ionicons name="close-circle" size={32} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>{cartItems.length} producto(s)</Text>
              <Text style={styles.totalItems}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} unidades
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
      <SuccessModal />
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
    alignItems: 'center',
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
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
  itemUnit: {
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
  removeButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
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
  totalItems: {
    fontSize: 18,
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
  deliveryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 10,
  },
  deliveryFound: {
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
  },
  deliveryNotFound: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  deliveryPreviewText: {
    fontSize: 14,
    color: AQUALAN_BLUE,
    fontWeight: '500',
    flex: 1,
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
  summaryItemUnit: {
    fontSize: 14,
    color: '#999',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  deliveryInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    width: '100%',
  },
  deliveryInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: AQUALAN_BLUE,
    flex: 1,
  },
  successSubMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: AQUALAN_BLUE,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
