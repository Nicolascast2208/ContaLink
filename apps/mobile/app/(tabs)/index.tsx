import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary-600 p-6 pb-12">
        <Text className="text-2xl font-bold text-white mb-2">
          ¡Hola, {user.displayName}!
        </Text>
        <Text className="text-primary-100">
          Bienvenido a ContaLink
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="px-4 -mt-8">
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              Resumen
            </Text>
            <TouchableOpacity>
              <Ionicons name="refresh-outline" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1 items-center border-r border-gray-200">
              <Text className="text-3xl font-bold text-primary-600 mb-1">
                0
              </Text>
              <Text className="text-sm text-gray-600">
                Total facturas
              </Text>
            </View>
            
            <View className="flex-1 items-center border-r border-gray-200">
              <Text className="text-3xl font-bold text-warning-600 mb-1">
                0
              </Text>
              <Text className="text-sm text-gray-600">
                Pendientes
              </Text>
            </View>
            
            <View className="flex-1 items-center">
              <Text className="text-3xl font-bold text-success-600 mb-1">
                $0
              </Text>
              <Text className="text-sm text-gray-600">
                Total
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Acciones rápidas
          </Text>
          
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/scan')}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
          >
            <View className="bg-primary-100 p-3 rounded-full mr-4">
              <Ionicons name="scan-outline" size={24} color="#0ea5e9" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                Escanear factura
              </Text>
              <Text className="text-sm text-gray-600">
                Captura o sube una foto
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/invoices')}
            className="bg-white rounded-xl p-4 flex-row items-center shadow-sm"
          >
            <View className="bg-secondary-100 p-3 rounded-full mr-4">
              <Ionicons name="document-text-outline" size={24} color="#8b5cf6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                Ver todas las facturas
              </Text>
              <Text className="text-sm text-gray-600">
                Gestiona tus documentos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Actividad reciente
          </Text>
          
          <View className="bg-white rounded-xl p-6 items-center shadow-sm">
            <Ionicons name="file-tray-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-600 mt-3">
              No hay actividad reciente
            </Text>
            <Text className="text-sm text-gray-400 mt-1 text-center">
              Escanea tu primera factura para comenzar
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
