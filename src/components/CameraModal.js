import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export function CameraModal({ visible, onClose, onPhotoTaken }) {
  const [preview, setPreview] = useState(null);
  const [facing, setFacing] = useState('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaStatus, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();
  
  const cameraRef = useRef(null);

  const handleOpenGallery = async () => {
    if (!mediaStatus?.granted) {
      const permission = await requestMediaPermission();
      if (!permission.granted) {
        alert('Permissão de galeria necessária.');
        return;
      }
    }
    
    const assets = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!assets.canceled) {
      setPreview(assets.assets[0].uri);
    }
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPreview(photo.uri);
    }
  };

  const handleConfirm = () => {
    onPhotoTaken(preview);
    handleClose();
  };

  const handleClose = () => {
    setPreview(null);
    onClose();
  };

  if (!cameraPermission?.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Precisamos de acesso à câmera.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>Permitir Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryLink} onPress={handleOpenGallery}>
            <FontAwesome name="image" size={16} color="#FFF" />
            <Text style={styles.galleryLinkText}>Abrir Galeria</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permissionClose} onPress={onClose}>
            <Text style={styles.permissionCloseText}>Cancelar</Text>
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
            <Image source={{ uri: preview }} style={styles.previewImage} resizeMode='contain'/>
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.discardButton} onPress={() => setPreview(null)}>
                <FontAwesome name="trash" size={22} color="#FF4444" />
                <Text style={styles.actionText}>Descartar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <FontAwesome name="check" size={22} color="#0F9D58" />
                <Text style={styles.actionText}>Usar foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cameraContent}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
              <TouchableOpacity style={styles.closeButtonTop} onPress={handleClose}>
                <FontAwesome name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </CameraView>

            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.sideButton} onPress={handleOpenGallery}>
                <FontAwesome name="image" size={22} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sideButton}
                onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
              >
                <FontAwesome name="refresh" size={22} color="#FFF" />
              </TouchableOpacity>
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
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  galleryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 25,
  },
  galleryLinkText: {
    color: '#FFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  permissionClose: {
    marginTop: 10,
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
    justifyContent: 'flex-start',
  },
  closeButtonTop: {
    marginTop: 20,
    marginLeft: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    height: 120,
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFF',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    height: 100,
    backgroundColor: '#000',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  discardButton: {
    alignItems: 'center',
    gap: 5,
  },
  confirmButton: {
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
  }
});