import {Text, StyleSheet, TouchableOpacity, View} from 'react-native';
import { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';




export function AddPhotoButton({ onPress, style}) {
    const [cameraOpen, setCameraOpen] = useState(false);

    return (
        <View>
          <TouchableOpacity
              style={[styles.addPhotoButton, style]}
              onPress={onPress}
              activeOpacity={0.7}
              >
              <FontAwesome name="plus" size={28} color="#0F9D58" />
              <Text style={styles.addPhotoText}>Adicionar</Text>
            </TouchableOpacity>

        </View>
    )
};

const styles = StyleSheet.create({
    addPhotoButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 6,
    width: 120,
    height: 120
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F9D58',
  }
}
);    