import { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useBarbershops } from '../../../context/BarbershopContext';
import { useAuth } from '../../../context/AuthContext';
import { ProductModal } from '../../../components/ProductModal';
import { Stack } from 'expo-router';


export const options = {
  headerShown: true,
  title: 'Detalhes',
};

export default function BarbershopDetailScreen() {
  const { id } = useLocalSearchParams();
  const { barbershops, addProduct, updateProduct, deleteProduct } = useBarbershops();
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [showInfo, setShowInfo] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const shop = barbershops.find((b) => b.id === id);

  if (!shop) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Estabelecimento nao encontrado.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const ratingLabel = hasRating ? shop.rating.toFixed(1) : 'Novo';
  const hasLocation = shop.location && shop.location.latitude && shop.location.longitude;
  const isOwner = user?.isBarber && user.id === shop.owner;
  const photoSize = (width - 40 - 16) / 3;
  const products = shop.products || [];

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  const handleSaveProduct = (data) => {
    if (editingProduct) {
      updateProduct(shop.id, editingProduct.id, data);
    } else {
      addProduct(shop.id, data);
    }
    setProductModalOpen(false);
  };

  const handleDeleteProduct = () => {
    if (editingProduct) {
      deleteProduct(shop.id, editingProduct.id);
    }
    setProductModalOpen(false);
  };

  const formatPrice = (value) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`;

  return (
      <View style={styles.safeArea}>
      <Stack.Screen options={{ title: shop.name, headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image
          source={typeof shop.imageUri === 'number' ? shop.imageUri : { uri: shop.imageUri }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        { isOwner && (
          <TouchableOpacity style={styles.editButton} onPress={ () => router.push(`/business/${id}/update`)}>
              <FontAwesome name="pencil" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        )}


        <View style={styles.header}>
          <Text style={styles.name}>{shop.name}</Text>

          <View style={styles.metaRow}>
            <FontAwesome name="star" size={14} color={hasRating ? '#F5A623' : '#B0B0B0'} />
            <Text style={[styles.rating, !hasRating && styles.ratingNew]}>{ratingLabel}</Text>

            <Text style={styles.separator}>•</Text>

            <FontAwesome name="map-marker" size={14} color="#0F9D58" />
            <Text style={styles.metaText} numberOfLines={1}> {shop.endereco}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.tabBar}
          onPress={() => setShowInfo(!showInfo)}
          activeOpacity={0.7}
        >
            <Text style={styles.tabText}>Mais Informações</Text>
            <FontAwesome
              name={showInfo ? "chevron-up" : "chevron-down"}
              size={12}
              color="#1D1D1D"
              style={{ marginLeft: 8 }}
            />
        </TouchableOpacity>

        {showInfo && (
          <View style={styles.infoContent}>
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

            {shop.horarios && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Horário de funcionamento</Text>
                {shop.horarios.map((item) => (
                  <View key={item.dia} style={styles.horarioRow}>
                    <Text style={styles.horarioDia}>{item.dia}</Text>
                    <Text style={styles.horarioValor}>
                      {item.aberto ? item.abertura + ' às ' + item.fechamento : 'Fechado'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos</Text>
          {products.length === 0 && !isOwner && (
            <Text style={{ color: '#999', marginTop: 10 }}>Esse estabelecimento ainda não adicionou produtos.</Text>
          )}
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[styles.productItem, { width: photoSize, height: photoSize }]}
                onPress={() => isOwner && openEditProduct(product)}
                activeOpacity={isOwner ? 0.7 : 1}
              >
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
              </TouchableOpacity>
            ))}

            {isOwner && (
              <TouchableOpacity
                style={[styles.addProductButton, { width: photoSize, height: photoSize }]}
                onPress={openCreateProduct}
                activeOpacity={0.7}
              >
                <FontAwesome name="plus" size={28} color="#0F9D58" />
                <Text style={styles.addProductText}>Adicionar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <ProductModal
        visible={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        product={editingProduct}
      />
    </View>
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
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1D',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
  },
  ratingNew: {
    color: '#6F6F6F',
  },
  separator: {
    marginHorizontal: 8,
    color: '#CCC',
    fontSize: 14,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: 25,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D1D1D',
  },
  infoContent: {
    backgroundColor: '#FAFAFA',
    paddingBottom: 10,
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 5,
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
  description: {
    fontSize: 14,
    color: '#5A5A5A',
    lineHeight: 20,
  },
  mapWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  map: {
    width: '100%',
    height: 180,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productItem: {
    borderRadius: 12,
    backgroundColor: '#F1F8F4',
    borderWidth: 1,
    borderColor: '#D3EAD9',
    padding: 10,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D1D1D',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F9D58',
  },
  addProductButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  addProductText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F9D58',
  },
  editButton: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 10,
    marginHorizontal: 20,
    marginTop: 5,
    borderRadius: 8,
    elevation: 3,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
