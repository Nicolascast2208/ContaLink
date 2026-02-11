import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getInitials, getColorFromText } from '../../lib/utils';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  if (!user) return null;

  const initials = getInitials(user.displayName);
  const avatarColor = getColorFromText(user.displayName);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 items-center border-b border-gray-200">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: avatarColor }}
        >
          <Text className="text-3xl font-bold text-white">
            {initials}
          </Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          {user.displayName}
        </Text>
        <Text className="text-base text-gray-600">
          {user.email}
        </Text>
      </View>

      {/* Menu Items */}
      <View className="mt-6 mx-4">
        <View className="bg-white rounded-xl overflow-hidden shadow-sm">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <Ionicons name="business-outline" size={24} color="#6b7280" />
            <Text className="flex-1 ml-4 text-base text-gray-900">
              Mi empresa
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <Ionicons name="settings-outline" size={24} color="#6b7280" />
            <Text className="flex-1 ml-4 text-base text-gray-900">
              Configuración
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
            <Text className="flex-1 ml-4 text-base text-gray-900">
              Ayuda y soporte
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
            <Text className="flex-1 ml-4 text-base text-gray-900">
              Acerca de ContaLink
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out Button */}
      <View className="p-4 mt-6">
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-error-600 rounded-xl p-4 flex-row items-center justify-center"
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text className="text-white font-semibold text-base ml-2">
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <View className="items-center py-6">
        <Text className="text-sm text-gray-400">
          ContaLink v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
