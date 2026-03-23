import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Tab() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text>teste</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
