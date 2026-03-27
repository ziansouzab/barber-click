import { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useBarbershops } from '../../context/BarbershopContext';
import { useAuth } from '../../context/AuthContext';
import { CameraModal } from '../../components/CameraModal';
import { Stack } from 'expo-router';

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: shop.name, headerShown: true }} />
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
                <Text style={styles.locationText}>{shop.endereco}</Text>
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
            <Text style={styles.photosSubtitle}>Esse estabelecimento ainda não adicionou imagens.</Text>
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
                  onPress={() => setCameraOpen(true)}
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

      <CameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onPhotoTaken={(uri) => {
          setPhotos((prev) => [...prev, uri]);
          setCameraOpen(false);
        }}
      />
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
});
