import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const AQUALAN_BLUE = '#0077B6';
const AQUALAN_LIGHT_BLUE = '#00B4D8';
const AQUALAN_DARK = '#023E8A';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (icon: string) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      water: 'water',
      leaf: 'leaf',
      flask: 'flask',
      beaker: 'beaker',
      cup: 'cafe',
      cafe: 'cafe',
    };
    return icons[icon] || 'cube';
  };

  const navigateToProducts = (categoryId?: string) => {
    if (categoryId) {
      router.push({ pathname: '/products', params: { category: categoryId } });
    } else {
      router.push('/products');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="water" size={32} color="#FFFFFF" />
            <Text style={styles.logoText}>AQUALAN</Text>
          </View>
          <Text style={styles.tagline}>Distribuidora de Agua</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=800' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Agua Mineral 100% Natural</Text>
            <Text style={styles.heroSubtitle}>
              Del Manantial de San Andrés, León
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => navigateToProducts()}
            >
              <Text style={styles.heroButtonText}>Ver Productos</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={28} color={AQUALAN_BLUE} />
            <Text style={styles.featureTitle}>Entrega 24/48h</Text>
            <Text style={styles.featureText}>En Euskadi</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="leaf" size={28} color={AQUALAN_BLUE} />
            <Text style={styles.featureTitle}>Eco-friendly</Text>
            <Text style={styles.featureText}>Productos sostenibles</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={28} color={AQUALAN_BLUE} />
            <Text style={styles.featureTitle}>Calidad</Text>
            <Text style={styles.featureText}>Agua certificada</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Nuestros Productos</Text>
          {loading ? (
            <ActivityIndicator size="large" color={AQUALAN_BLUE} />
          ) : (
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => navigateToProducts(category.id)}
                >
                  <View style={styles.categoryIconContainer}>
                    <Ionicons
                      name={getCategoryIcon(category.icon)}
                      size={32}
                      color={AQUALAN_BLUE}
                    />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDescription} numberOfLines={2}>
                    {category.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Water Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Agua del Manantial de San Andrés</Text>
          <Text style={styles.infoText}>
            El agua mineral natural San Andrés proviene de un acuífero a 360 metros
            de profundidad, originado en la Cordillera Cantábrica. Filtrada por
            gravas y arenas silíceas, es pura y de mineralización débil.
          </Text>
          <View style={styles.infoFeatures}>
            <View style={styles.infoFeatureItem}>
              <Ionicons name="checkmark-circle" size={20} color={AQUALAN_LIGHT_BLUE} />
              <Text style={styles.infoFeatureText}>Baja en sodio</Text>
            </View>
            <View style={styles.infoFeatureItem}>
              <Ionicons name="checkmark-circle" size={20} color={AQUALAN_LIGHT_BLUE} />
              <Text style={styles.infoFeatureText}>Ideal para dietas</Text>
            </View>
            <View style={styles.infoFeatureItem}>
              <Ionicons name="checkmark-circle" size={20} color={AQUALAN_LIGHT_BLUE} />
              <Text style={styles.infoFeatureText}>Apta para bebés</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>¿Listo para pedir?</Text>
          <Text style={styles.ctaText}>
            Realiza tu pedido ahora y recíbelo en 24/48 horas
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigateToProducts()}
          >
            <Text style={styles.ctaButtonText}>Hacer Pedido</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AQUALAN © 2025</Text>
          <Text style={styles.footerSubtext}>Distribuidora de Agua Embotellada</Text>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  heroSection: {
    position: 'relative',
    height: 280,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 119, 182, 0.85)',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AQUALAN_LIGHT_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'flex-start',
    gap: 8,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AQUALAN_DARK,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoSection: {
    backgroundColor: AQUALAN_DARK,
    padding: 24,
    margin: 20,
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  infoFeatures: {
    marginTop: 16,
    gap: 8,
  },
  infoFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoFeatureText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  ctaSection: {
    backgroundColor: AQUALAN_LIGHT_BLUE,
    padding: 24,
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ctaText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  ctaButtonText: {
    color: AQUALAN_BLUE,
    fontSize: 16,
    fontWeight: '600',
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
  },
});
