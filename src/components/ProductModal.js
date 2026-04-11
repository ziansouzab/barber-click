import { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export function ProductModal({ visible, onClose, onSave, onDelete, product }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (visible) {
      setName(product?.name ?? '');
      setPrice(product?.price != null ? String(product.price) : '');
    }
  }, [visible, product]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Preencha o nome do produto.');
      return;
    }
    const parsedPrice = Number(price.replace(',', '.'));
    if (!price.trim() || Number.isNaN(parsedPrice)) {
      alert('Informe um preço válido.');
      return;
    }
    onSave({ name: name.trim(), price: parsedPrice });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{product ? 'Editar produto' : 'Novo produto'}</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Corte masculino"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Preço (R$)</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="Ex: 35.00"
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>

          {product && (
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete} activeOpacity={0.85}>
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1D',
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
  saveButton: {
    backgroundColor: '#0F9D58',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#C0392B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6A6A6A',
    fontWeight: '600',
  },
});
