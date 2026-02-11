import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { resetPassword } from '../../services/auth';
import { isValidEmail } from '../../lib/utils';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Correo electrónico inválido');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Email enviado',
        'Te hemos enviado un email con instrucciones para recuperar tu contraseña',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white p-6"
    >
      <View className="flex-1 justify-center">
        {/* Header */}
        <View className="mb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary-600 text-base">← Volver</Text>
          </TouchableOpacity>
          
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Recuperar contraseña
          </Text>
          <Text className="text-base text-gray-600">
            Ingresa tu correo y te enviaremos instrucciones
          </Text>
        </View>

        {/* Form */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Correo electrónico
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleResetPassword}
          disabled={loading}
          className={`bg-primary-600 rounded-lg py-4 ${loading ? 'opacity-50' : ''}`}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
