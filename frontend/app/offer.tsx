import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getApiUrl, hasBackend } from '../lib/api';

const AQUALAN_BLUE = '#0077B6';
const AQUALAN_LIGHT_BLUE = '#00B4D8';
const AQUALAN_DARK = '#023E8A';

const PROVINCIAS = [
  { value: 'bizkaia', label: 'Bizkaia' },
  { value: 'gipuzkoa', label: 'Gipuzkoa' },
  { value: 'alava', label: 'Álava' },
  { value: 'cantabria', label: 'Cantabria' },
  { value: 'navarra', label: 'Navarra' },
  { value: 'otra', label: 'Otra' },
];

const PRODUCTOS_OFERTA = [
  { value: 'botellones', label: 'Botellones 19L/11L' },
  { value: 'ecobox', label: 'Ecobox (15L/5L)' },
  { value: 'botellines', label: 'Botellines' },
  { value: 'dispensador', label: 'Dispensador Frío/Caliente' },
  { value: 'fuentes-red', label: 'Fuente de Red' },
  { value: 'cafe', label: 'Café en Cápsulas' },
  { value: 'vasos', label: 'Vasos Compostables' },
];

export default function OfferScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    empresa: '',
    nombre: '',
    telefono: '',
    email: '',
    ubicacion: '',
    otra_provincia: '',
    ciudad: '',
    productos: [] as string[],
    mensaje: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleProducto = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      productos: prev.productos.includes(value)
        ? prev.productos.filter((p) => p !== value)
        : [...prev.productos, value],
    }));
  };

  const handleSubmit = async () => {
    const {
      empresa,
      nombre,
      telefono,
      email,
      ubicacion,
      otra_provincia,
      ciudad,
      productos,
      mensaje,
    } = formData;

    setError(null);

    if (
      !empresa.trim() ||
      !nombre.trim() ||
      !telefono.trim() ||
      !email.trim() ||
      !ubicacion ||
      !ciudad.trim()
    ) {
      setError('Por favor, rellena todos los campos obligatorios marcados con *.');
      return;
    }
    if (ubicacion === 'otra' && !otra_provincia.trim()) {
      setError('Por favor, especifica la provincia.');
      return;
    }
    if (productos.length === 0) {
      setError('Selecciona al menos un producto que te interese.');
      return;
    }
    if (!hasBackend()) {
      setError('Backend no configurado. Configura EXPO_PUBLIC_BACKEND_URL para enviar la solicitud.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        empresa: empresa.trim(),
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        ubicacion,
        otra_provincia: ubicacion === 'otra' ? otra_provincia.trim() : undefined,
        ciudad: ciudad.trim(),
        productos,
        mensaje: mensaje?.trim() || undefined,
      };
      const res = await fetch(`${getApiUrl()}/api/offer-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json().catch(() => ({})) as { detail?: string | { msg?: string }[] };
        const d = data?.detail;
        const msg =
          typeof d === 'string'
            ? d
            : Array.isArray(d)
              ? d.map((x) => x.msg).filter(Boolean).join('. ')
              : null;
        if (res.status === 404) {
          setError(
            'La ruta de ofertas no existe en el servidor. Reinicia el backend desde la carpeta backend: ' +
            'python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000'
          );
        } else {
          setError(msg || 'No se pudo enviar la solicitud. Inténtalo más tarde.');
        }
      }
    } catch (e: unknown) {
      console.error(e);
      const isNetworkError =
        e instanceof TypeError &&
        (e.message === 'Failed to fetch' || (e as Error).message?.includes('fetch'));
      setError(
        isNetworkError
          ? 'No se puede conectar con el servidor. Comprueba que el backend está en marcha (ej. en http://localhost:8000).'
          : 'Ha ocurrido un error al enviar la solicitud. Inténtalo de nuevo en unos minutos.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={AQUALAN_DARK} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Solicitud de oferta</Text>
            <Text style={styles.headerSubtitle}>
              Cuéntanos qué necesitas y te enviaremos una propuesta personalizada.
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos de contacto</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre de la Empresa *</Text>
              <TextInput
                style={styles.input}
                value={formData.empresa}
                onChangeText={(t) => setFormData((p) => ({ ...p, empresa: t }))}
                placeholder="Ej: Empresa S.L."
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tu Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(t) => setFormData((p) => ({ ...p, nombre: t }))}
                placeholder="Tu nombre completo"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Teléfono *</Text>
              <TextInput
                style={styles.input}
                value={formData.telefono}
                onChangeText={(t) => setFormData((p) => ({ ...p, telefono: t }))}
                placeholder="946 212 789"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(t) => setFormData((p) => ({ ...p, email: t }))}
                placeholder="tu@empresa.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Provincia *</Text>
              <View style={styles.chipsRow}>
                {PROVINCIAS.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.chip,
                      formData.ubicacion === p.value && styles.chipSelected,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        ubicacion: p.value,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.ubicacion === p.value && styles.chipTextSelected,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {formData.ubicacion === 'otra' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Especifica la provincia *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.otra_provincia}
                  onChangeText={(t) => setFormData((p) => ({ ...p, otra_provincia: t }))}
                  placeholder="Escribe el nombre de tu provincia"
                  placeholderTextColor="#999"
                />
              </View>
            )}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ciudad *</Text>
              <TextInput
                style={styles.input}
                value={formData.ciudad}
                onChangeText={(t) => setFormData((p) => ({ ...p, ciudad: t }))}
                placeholder="Ej: Bilbao, Donostia..."
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Productos de interés</Text>
            <Text style={styles.helperText}>
              Selecciona los productos que te gustaría recibir en la oferta. *
            </Text>
            {PRODUCTOS_OFERTA.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={styles.checkboxRow}
                onPress={() => toggleProducto(p.value)}
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.productos.includes(p.value) && styles.checkboxChecked,
                  ]}
                >
                  {formData.productos.includes(p.value) && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mensaje adicional</Text>
            <Text style={styles.helperText}>Cuéntanos tus necesidades específicas (opcional).</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.mensaje}
              onChangeText={(t) => setFormData((p) => ({ ...p, mensaje: t }))}
              placeholder="Ej: Número de puestos, consumo aproximado, tipo de instalación..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#C62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>ENVIAR SOLICITUD</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.privacyNote}>
            🔒 Tus datos están seguros. No compartimos información con terceros.
          </Text>
        </ScrollView>

        {success && (
          <View style={styles.successOverlay}>
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={64} color={AQUALAN_LIGHT_BLUE} />
              <Text style={styles.successTitle}>¡Gracias!</Text>
              <Text style={styles.successText}>
                Hemos recibido tu solicitud. Pronto te contestaremos con una oferta personalizada.
              </Text>
              <TouchableOpacity style={styles.successButton} onPress={handleCloseSuccess}>
                <Text style={styles.successButtonText}>Volver al inicio</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FC',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AQUALAN_DARK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AQUALAN_DARK,
    marginBottom: 10,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D7DE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  chipSelected: {
    backgroundColor: AQUALAN_BLUE,
  },
  chipText: {
    fontSize: 13,
    color: '#333',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: AQUALAN_BLUE,
    borderColor: AQUALAN_BLUE,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    flex: 1,
  },
  submitButton: {
    backgroundColor: AQUALAN_BLUE,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  privacyNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    maxWidth: 340,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AQUALAN_DARK,
    marginTop: 12,
  },
  successText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: AQUALAN_BLUE,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 18,
  },
  successButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

