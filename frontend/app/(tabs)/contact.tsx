import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AQUALAN_BLUE = '#0077B6';
const AQUALAN_LIGHT_BLUE = '#00B4D8';
const AQUALAN_DARK = '#023E8A';

export default function ContactScreen() {
  const openPhone = () => {
    Linking.openURL('tel:946212789');
  };

  const openEmail = () => {
    Linking.openURL('mailto:info@aqualan.es');
  };

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/34669335093');
  };

  const openInstagram = () => {
    Linking.openURL('https://www.instagram.com/_aqualan_/');
  };

  const openMaps = () => {
    Linking.openURL(
      'https://www.google.com/maps/search/?api=1&query=Erreka+Bazterrak+Kalea+13+Basauri+Bizkaia'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacto</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1637905351378-67232a5f0c9b?w=800' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Ionicons name="water" size={48} color="#FFFFFF" />
            <Text style={styles.heroTitle}>AQUALAN</Text>
            <Text style={styles.heroSubtitle}>
              Distribuidora de Agua Embotellada
            </Text>
          </View>
        </View>

        {/* Contact Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity style={styles.contactCard} onPress={openPhone}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="call" size={28} color={AQUALAN_BLUE} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Teléfono</Text>
              <Text style={styles.cardValue}>946 212 789</Text>
              <Text style={styles.cardHint}>Toca para llamar</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#25D36620' }]}>
              <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>WhatsApp</Text>
              <Text style={styles.cardValue}>+34 669 335 093</Text>
              <Text style={styles.cardHint}>Pedidos rápidos</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={openEmail}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="mail" size={28} color={AQUALAN_BLUE} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Email</Text>
              <Text style={styles.cardValue}>info@aqualan.es</Text>
              <Text style={styles.cardHint}>Toca para enviar email</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={openInstagram}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#E4405F20' }]}>
              <Ionicons name="logo-instagram" size={28} color="#E4405F" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Instagram</Text>
              <Text style={styles.cardValue}>@_aqualan_</Text>
              <Text style={styles.cardHint}>Síguenos</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={openMaps}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="location" size={28} color={AQUALAN_BLUE} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Dirección</Text>
              <Text style={styles.cardValue}>Erreka Bazterrak Kalea, 13</Text>
              <Text style={styles.cardHint}>Urbi, 48970 Basauri, Bizkaia</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* Delivery Zones */}
        <View style={styles.zonesSection}>
          <Text style={styles.sectionTitle}>Zonas de Entrega</Text>
          <Text style={styles.sectionSubtitle}>Entrega en 24/48 horas</Text>
          <View style={styles.zonesList}>
            {['Bizkaia', 'Gipuzkoa', 'Álava', 'Cantabria', 'Navarra'].map(
              (zone) => (
                <View key={zone} style={styles.zoneItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={AQUALAN_LIGHT_BLUE}
                  />
                  <Text style={styles.zoneName}>{zone}</Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>Horario de Atención</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleDay}>Lunes - Viernes</Text>
              <Text style={styles.scheduleTime}>8:00 - 18:00</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleDay}>Sábados</Text>
              <Text style={styles.scheduleTime}>9:00 - 14:00</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleDay}>Domingos</Text>
              <Text style={styles.scheduleTimeClosed}>Cerrado</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AQUALAN © 2025</Text>
          <Text style={styles.footerSubtext}>
            Agua Mineral Natural del Manantial de San Andrés
          </Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 119, 182, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  cardsContainer: {
    padding: 16,
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  cardHint: {
    fontSize: 12,
    color: AQUALAN_LIGHT_BLUE,
    marginTop: 2,
  },
  zonesSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AQUALAN_DARK,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  zonesList: {
    marginTop: 16,
    gap: 10,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneName: {
    fontSize: 15,
    color: '#333',
  },
  scheduleSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scheduleDay: {
    fontSize: 15,
    color: '#333',
  },
  scheduleTime: {
    fontSize: 15,
    fontWeight: '600',
    color: AQUALAN_BLUE,
  },
  scheduleTimeClosed: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF4444',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});
