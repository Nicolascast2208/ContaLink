import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { uploadImage, generateFileName } from '../../services/storage';
import { createInvoice } from '../../services/firestore';
import { Timestamp } from 'firebase/firestore';

export default function ScanScreen() {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'ContaLink necesita acceso a tu cámara y galería para escanear facturas'
      );
      return false;
    }
    return true;
  };

  const pickImageFromGalery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: false
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generar nombre único para el archivo
      const fileName = generateFileName(user.uid);

      // Subir imagen a Firebase Storage
      const uploadResult = await uploadImage(
        selectedImage,
        fileName,
        (progress) => setUploadProgress(progress)
      );

      // Crear documento en Firestore con status pending_ocr
      // Nota: companyId debe venir del contexto o selección del usuario
      const companyId = user.defaultCompanyId || 'temp-company-id';
      
      await createInvoice(companyId, {
        type: 'factura',
        number: 0, // Se llenará después del OCR
        date: Timestamp.now(),
        emisorRut: '',
        emisorRazonSocial: '',
        receptorRut: '',
        receptorRazonSocial: '',
        netoAmount: 0,
        ivaAmount: 0,
        totalAmount: 0,
        items: [],
        status: 'pending_ocr',
        imageUrl: uploadResult.downloadURL,
        ocrRawText: '',
        createdBy: user.uid,
        companyId,
        processedAt: null,
        verifiedAt: null
      });

      Alert.alert(
        '¡Éxito!',
        'La factura se ha subido correctamente y está siendo procesada',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedImage(null);
              setUploadProgress(0);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error al subir:', error);
      Alert.alert('Error', error.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 p-6">
        {!selectedImage ? (
          <>
            {/* Instructions */}
            <View className="mb-8">
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                Escanear factura
              </Text>
              <Text className="text-base text-gray-600">
                Captura o selecciona una foto de tu factura para digitalizarla automáticamente
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="space-y-4">
              <TouchableOpacity
                onPress={takePhoto}
                className="bg-primary-600 rounded-xl p-6 flex-row items-center"
              >
                <View className="bg-white/20 p-3 rounded-full mr-4">
                  <Ionicons name="camera" size={32} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white mb-1">
                    Tomar foto
                  </Text>
                  <Text className="text-primary-100">
                    Usa tu cámara para capturar la factura
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickImageFromGalery}
                className="bg-secondary-600 rounded-xl p-6 flex-row items-center"
              >
                <View className="bg-white/20 p-3 rounded-full mr-4">
                  <Ionicons name="images" size={32} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white mb-1">
                    Seleccionar de galería
                  </Text>
                  <Text className="text-secondary-100">
                    Escoge una foto existente
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Tips */}
            <View className="mt-8 bg-gray-50 rounded-xl p-4">
              <View className="flex-row items-start mb-2">
                <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
                <Text className="text-sm font-semibold text-gray-900 ml-2">
                  Consejos para mejores resultados:
                </Text>
              </View>
              <Text className="text-sm text-gray-600 ml-7">
                • Asegúrate de que la factura esté bien iluminada{'\n'}
                • Evita sombras y reflejos{'\n'}
                • Captura el documento completo{'\n'}
                • Mantén la cámara estable y enfocada
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Preview */}
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Vista previa
            </Text>
            
            <View className="bg-gray-100 rounded-xl overflow-hidden mb-4">
              <Image
                source={{ uri: selectedImage }}
                style={{ width: '100%', height: 400 }}
                resizeMode="contain"
              />
            </View>

            {/* Progress */}
            {uploading && (
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Subiendo...</Text>
                  <Text className="text-sm font-semibold text-primary-600">
                    {Math.round(uploadProgress)}%
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary-600"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </View>
              </View>
            )}

            {/* Actions */}
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={() => setSelectedImage(null)}
                disabled={uploading}
                className="flex-1 bg-gray-200 rounded-lg py-4"
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpload}
                disabled={uploading}
                className={`flex-1 bg-primary-600 rounded-lg py-4 ${uploading ? 'opacity-50' : ''}`}
              >
                {uploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold">
                    Subir y procesar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
