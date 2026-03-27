import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useBarbershops } from '../../context/BarbershopContext';
import { useAuth } from '../../context/AuthContext';

export const options = {
  headerShown: true,
  title: 'Detalhes',
};

export default function BarbershopDetailScreen() {
  const { id } = useLocalSearchParams();
  const { barbershops } = useBarbershops();
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState('info');
  const [photos, setPhotos] = useState([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState('back');
  const [preview, setPreview] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const shop = barbershops.find((b) => b.id === id);

  if (!shop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Estabelecimento nao encontrado.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const ratingLabel = hasRating ? shop.rating.toFixed(1) : 'Novo';
  const hasLocation = shop.location && shop.location.latitude && shop.location.longitude;
  const isOwner = user?.isBarber && user.id === shop.owner;
  const photoSize = (width - 40 - 16) / 3;

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        alert('Permissao de camera necessaria para tirar fotos.');
        return;
      }
    }
    setCameraOpen(true);
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPreview(photo.uri);
    }
  };

  const handleConfirmPhoto = () => {
    setPhotos((prev) => [...prev, preview]);
    setPreview(null);
    setCameraOpen(false);
  };

  const handleDiscardPhoto = () => {
    setPreview(null);
  };

  const handleCloseCamera = () => {
    setPreview(null);
    setCameraOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image
          source={typeof shop.imageUrl === 'number' ? shop.imageUrl : { uri: shop.imageUrl }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        <View style={styles.header}>
          <Text style={styles.name}>{shop.name}</Text>
          <View style={styles.metaRow}>
            <FontAwesome name="star" size={16} color={hasRating ? '#F5A623' : '#B0B0B0'} />
            <Text style={[styles.rating, !hasRating && styles.ratingNew]}>{ratingLabel}</Text>
            <Text style={styles.separator}>|</Text>
            <Text style={styles.metaText}>{shop.priceRange}</Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Informacoes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
            onPress={() => setActiveTab('photos')}
          >
            <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>Clientes Satisfeitos</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'info' ? (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localizacao</Text>
              <View style={styles.locationRow}>
                <FontAwesome name="map-marker" size={16} color="#0F9D58" />
                <Text style={styles.locationText}>{shop.bairro}, {shop.cidade}</Text>
              </View>
            </View>

            {shop.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sobre</Text>
                <Text style={styles.description}>{shop.description}</Text>
              </View>
            ) : null}

            {hasLocation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mapa</Text>
                <View style={styles.mapWrapper}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: shop.location.latitude,
                      longitude: shop.location.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker coordinate={shop.location} title={shop.name} />
                  </MapView>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.photosSubtitle}>Mostre o resultado do seu trabalho!</Text>
            <View style={styles.photosGrid}>
              {photos.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={[styles.photoItem, { width: photoSize, height: photoSize }]}
                  resizeMode="cover"
                />
              ))}

              {isOwner && (
                <TouchableOpacity
                  style={[styles.addPhotoButton, { width: photoSize, height: photoSize }]}
                  onPress={handleOpenCamera}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="plus" size={28} color="#0F9D58" />
                  <Text style={styles.addPhotoText}>Adicionar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={cameraOpen} animationType="slide">
        <SafeAreaView style={styles.cameraContainer}>
          {preview ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.previewActions}>
                <TouchableOpacity style={styles.previewButtonDiscard} onPress={handleDiscardPhoto}>
                  <FontAwesome name="times" size={22} color="#FFF" />
                  <Text style={styles.previewButtonText}>Descartar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.previewButtonConfirm} onPress={handleConfirmPhoto}>
                  <FontAwesome name="check" size={22} color="#FFF" />
                  <Text style={styles.previewButtonText}>Usar foto</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.cameraContent}>
              <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                <View style={styles.cameraTopBar}>
                  <TouchableOpacity style={styles.cameraCloseButton} onPress={handleCloseCamera}>
                    <FontAwesome name="arrow-left" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </CameraView>
              <View style={styles.cameraBottomBar}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundText: {
    fontSize: 16,
    color: '#5C5C5C',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#0F9D58',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  coverImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#E0E0E0',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1D',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5A623',
  },
  ratingNew: {
    color: '#6F6F6F',
  },
  separator: {
    fontSize: 14,
    color: '#CCC',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#1D1D1D',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#5A5A5A',
  },
  description: {
    fontSize: 14,
    color: '#5A5A5A',
    lineHeight: 20,
  },
  mapWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  map: {
    width: '100%',
    height: 200,
  },
  photosSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  addPhotoButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F9D58',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContent: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraTopBar: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBottomBar: {
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
  previewButtonDiscard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#C0392B',
  },
  previewButtonConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0F9D58',
  },
  previewButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
