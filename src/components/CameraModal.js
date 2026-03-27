import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export function CameraModal({ visible, onClose, onPhotoTaken }) {
  const [facing, setFacing] = useState('back');
  const [preview, setPreview] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPreview(photo.uri);
    }
  };

  const handleConfirm = () => {
    onPhotoTaken(preview);
    setPreview(null);
  };

  const handleDiscard = () => {
    setPreview(null);
  };

  const handleClose = () => {
    setPreview(null);
    onClose();
  };

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Permita o acesso a camera para tirar fotos.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Permitir camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permissionClose} onPress={handleClose}>
            <Text style={styles.permissionCloseText}>Voltar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        {preview ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
                <FontAwesome name="times" size={22} color="#FFF" />
                <Text style={styles.actionText}>Descartar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <FontAwesome name="check" size={22} color="#FFF" />
                <Text style={styles.actionText}>Usar foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cameraContent}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <FontAwesome name="arrow-left" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </CameraView>
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              >
                <FontAwesome name="refresh" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
              <View style={{ width: 50 }} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  permissionText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0F9D58',
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  permissionClose: {
    paddingVertical: 10,
  },
  permissionCloseText: {
    color: '#999',
    fontSize: 14,
  },
  cameraContent: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
    backgroundColor: '#000',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    backgroundColor: '#000',
  },
  discardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#C0392B',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0F9D58',
  },
  actionText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
