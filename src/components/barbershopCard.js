import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export function BarbershopCard({ name, rating, endereco, imageUrl, onPress }) {
  const hasRating = typeof rating === 'number' && rating > 0;
  const ratingLabel = hasRating ? rating.toFixed(1) : 'Novo';

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image} 
        resizeMode="cover"
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        
        <View style={styles.metaContainer}>
          <FontAwesome name="star" size={14} color={hasRating ? '#F5A623' : '#B0B0B0'} />
          <Text style={[styles.rating, !hasRating && styles.ratingNew]}>{ratingLabel}</Text>
        </View>

        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>{endereco}</Text>
        </View>
        
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 5,
    backgroundColor: '#E0E0E0', 
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5A623',
    marginLeft: 4,
  },
  ratingNew: {
    color: '#6F6F6F',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  price: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
});
