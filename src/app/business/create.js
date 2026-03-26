import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import { useBarbershops } from '../../context/BarbershopContext';
import { useAuth } from '../../context/AuthContext';

export const options = {
  headerShown: true,
  title: 'Adicionar estabelecimento',
};

export default function CreateBarbershopScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addBarbershop } = useBarbershops();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceRange, setPriceRange] = useState('$$');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('Buscando sua localização atual...');

  useEffect(() => {
    handleUseCurrentLocation();
  }, []);

  const hasPermissionIssue = useMemo(() => locationMessage.includes('negada'), [locationMessage]);

  const handleSubmit = () => {
    if (!name.trim() || !bairro.trim() || !cidade.trim()) {
      alert('Preencha pelo menos o nome, bairro e cidade antes de salvar.');
      return;
    }

    if (!location || location.latitude === undefined) {
      alert('Selecione o ponto do estabelecimento no mapa.');
      return;
    }

    addBarbershop({
      name: name.trim(),
      owner: user.id,
      description: description.trim(),
      priceRange: priceRange.trim() || '$$',
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      imageUrl: imageUrl.trim() || DEFAULT_IMAGE,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    });

    alert('Estabelecimento cadastrado com sucesso!');
    router.replace('/(tabs)/business');
  };

  const handleUseCurrentLocation = async () => {

      setIsLoadingLocation(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            setLocationMessage('Permissão de localização negada. Toque no mapa para escolher o endereço.');
            return;
        }

        const position = await Location.getCurrentPositionAsync();
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setLocation(coords)
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005
        })
        setLocationMessage('Revise o ponto no mapa ou toque para ajustar.');
      
      } catch (error) {
          setLocationMessage('Não foi possível obter sua localização. Selecione manualmente no mapa.');
      } finally {
          setIsLoadingLocation(false);
      };
  };

  if (!user?.isBarber) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedTitle}>Acesso restrito</Text>
          <Text style={styles.lockedMessage}>Somente barbeiros autenticados podem cadastrar estabelecimentos.</Text>
          <TouchableOpacity style={styles.lockedButton} onPress={() => router.replace('/(tabs)/auth')}>
            <Text style={styles.lockedButtonText}>Ir para login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Cadastrar novo estabelecimento</Text>
        <Text style={styles.subtitle}>Preencha as informações básicas e selecione o ponto exato no mapa.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome fantasia</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Barber Lounge"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição curta</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Fale sobre o ambiente, especialidades, diferenciais..."
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Bairro</Text>
            <TextInput
              value={bairro}
              onChangeText={setBairro}
              placeholder="Bairro"
              style={styles.input}
            />
          </View>

          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput
              value={cidade}
              onChangeText={setCidade}
              placeholder="Cidade"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Faixa de preço</Text>
            <TextInput
              value={priceRange}
              onChangeText={setPriceRange}
              placeholder="Ex: $$ - $$$"
              style={styles.input}
            />
          </View>

          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Foto (URL)</Text>
            <TextInput
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="Imagem de destaque"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Text style={styles.label}>Localização no mapa</Text>
            <TouchableOpacity style={styles.mapRefresh} onPress={handleUseCurrentLocation}>
              <Text style={styles.mapRefreshText}>Usar minha localização</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.mapHint, hasPermissionIssue && styles.permissionWarning]}>{locationMessage}</Text>

          <View style={styles.mapWrapper}>
            {isLoadingLocation && (
              <View style={styles.mapOverlay}>
                <ActivityIndicator size="large" color="#0F9D58" />
              </View>
            )}

            <MapView
              style={styles.map}
              region={
                !location?
                {
                  latitude: 0,
                  longitude: 0,
                  latitudeDelta: 0,
                  longitudeDelta: 1000,
                } :
                mapRegion
              }
              onPress={(event) => {
                setLocation(event.nativeEvent.coordinate);
                setLocationMessage('Ponto atualizado. Confirme o cadastro abaixo.');
              }}
            >
              {location && location.latitude && (
                <Marker coordinate={location} />
              )}
            </MapView>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitButtonText}>Salvar estabelecimento</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1D',
  },
  subtitle: {
    fontSize: 14,
    color: '#5A5A5A',
    lineHeight: 18,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C3C',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    fontSize: 14,
    color: '#222222',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  mapSection: {
    gap: 8,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapHint: {
    fontSize: 12,
    color: '#6A6A6A',
  },
  permissionWarning: {
    color: '#C0392B',
  },
  mapWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  map: {
    width: '100%',
    height: 240,
  },
  mapOverlay: {
    position: 'absolute',
    zIndex: 10,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapRefresh: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  mapRefreshText: {
    color: '#0F9D58',
    fontWeight: '600',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#0F9D58',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  lockedMessage: {
    fontSize: 14,
    color: '#5C5C5C',
    textAlign: 'center',
    lineHeight: 18,
  },
  lockedButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#0F9D58',
  },
  lockedButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
