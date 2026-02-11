import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatDate, formatRut } from '../../lib/utils';
import { INVOICE_TYPE_LABELS, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '../../lib/constants';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // TODO: Implementar hook para cargar factura por ID
  const loading = false;
  const invoice = null;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">
          Factura no encontrada
        </Text>
        <Text className="text-base text-gray-600 text-center mb-6">
          No se pudo cargar la información de esta factura
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Código del render de la factura (placeholder hasta tener datos reales)
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Factura #{id}
        </Text>
        <Text className="text-gray-600">
          Detalle de la factura aquí...
        </Text>
      </View>
    </ScrollView>
  );
}
