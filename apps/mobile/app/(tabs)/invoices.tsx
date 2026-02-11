import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InvoicesScreen() {
  const loading = false;
  const invoices: any[] = []; // TODO: Implementar hook useInvoices

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (invoices.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-6">
          <View className="bg-white rounded-full p-6 mb-4">
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            No hay facturas aún
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Escanea tu primera factura para comenzar a organizarlas digitalmente
          </Text>
          <TouchableOpacity className="bg-primary-600 px-6 py-3 rounded-lg">
            <Text className="text-white font-semibold">
              Escanear factura
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-semibold text-gray-900">
                {item.emisorRazonSocial || 'Sin nombre'}
              </Text>
              <View className={`px-3 py-1 rounded-full bg-${item.status === 'verified' ? 'success' : 'warning'}-100`}>
                <Text className={`text-xs font-medium text-${item.status === 'verified' ? 'success' : 'warning'}-700`}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-600 mb-2">
              RUT: {item.emisorRut}
            </Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-primary-600">
                ${item.totalAmount.toLocaleString('es-CL')}
              </Text>
              <Text className="text-xs text-gray-500">
                {new Date(item.date.toDate()).toLocaleDateString('es-CL')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
