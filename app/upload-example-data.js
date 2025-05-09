

import { ref, set, update } from "firebase/database";
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { database } from '../firebaseConfig';

const initialCategoriesData = [
  { id: '1', name: 'Mua sắm', icon: '🛒' },
  { id: '2', name: 'Đồ ăn', icon: '🍔' },
  { id: '3', name: 'Điện thoại', icon: '📱' },
  { id: '4', name: 'Giải trí', icon: '🎤' },
  { id: '5', name: 'Giáo dục', icon: '📖' },
  { id: '6', name: 'Sắc đẹp', icon: '💅' },
  { id: '7', name: 'Thể thao', icon: '🏊' },
  { id: '8', name: 'Xã hội', icon: '👥' },
  { id: '9', name: 'Vận tải', icon: '🚌' },
  { id: '10', name: 'Quần áo', icon: '👕' },
  { id: '11', name: 'Xe hơi', icon: '🚗' },
  { id: '12', name: 'Rượu', icon: '🍷' },
  { id: '13', name: 'Thuốc lá', icon: '🚭' },
  { id: '14', name: 'Thiết bị ĐT', icon: '🎧' },
  { id: '15', name: 'Du lịch', icon: '✈️' },
  { id: '16', name: 'Sức khỏe', icon: '❤️‍🩹' },
  { id: '17', name: 'Thú cưng', icon: '🐾' },
  { id: '18', name: 'Sửa chữa', icon: '🛠️' },
  { id: '19', name: 'Nhà ở', icon: '🏠' },
  { id: '20', name: 'Nhà', icon: '🏡' },
  { id: '21', name: 'Quà tặng', icon: '🎁' },
  { id: '22', name: 'Quyên góp', icon: '💖' },
  { id: '23', name: 'Vé số', icon: '🎟️' },
  { id: '24', name: 'Đồ ăn nhẹ', icon: '🍰' },
  { id: 'add', name: 'Thêm mới', icon: '+' },
];

const UploadCategoriesScreen = () => {
  const [status, setStatus] = useState('');

  // Phương thức 1: Sử dụng set() để ghi toàn bộ danh sách
  // Dữ liệu tại 'categories' sẽ bị ghi đè hoàn toàn
  const handleUploadWithSet = async () => {
    setStatus('Đang tải lên (SET)...');
    try {
      const categoriesNode = {};
      initialCategoriesData.forEach(category => {
        categoriesNode[category.id] = {
          name: category.name,
          icon: category.icon,
          // bạn có thể thêm các trường khác nếu muốn, ví dụ: order: parseInt(category.id) || 0
        };
      });

      await set(ref(database, 'categories'), categoriesNode);

      setStatus('');
      Alert.alert('Thành công', 'Danh sách danh mục đã được tải lên Firebase bằng SET!');
    } catch (error) {
      setStatus('');
      console.error("Lỗi khi tải lên (SET): ", error);
      Alert.alert('Lỗi', `Có lỗi xảy ra: ${error.message}`);
    }
  };

  // An toàn hơn vì nó chỉ cập nhật các đường dẫn được chỉ định
  const handleUploadWithUpdate = async () => {
    setStatus('Đang tải lên (UPDATE)...');
    try {
      const updates = {};
      initialCategoriesData.forEach(category => {
        // Tạo đường dẫn cho từng mục category: 'categories/ID_CUA_CATEGORY'
        updates[`categories/${category.id}`] = {
          name: category.name,
          icon: category.icon,
          // có thể thêm các trường khác nếu muốn, ví dụ: order: parseInt(category.id) || 0
        };
      });

      // ref(database) là tham chiếu đến gốc của database
      await update(ref(database), updates);

      setStatus('');
      Alert.alert('Thành công', 'Danh sách danh mục đã được tải lên Firebase bằng UPDATE!');
    } catch (error) {
      setStatus('');
      console.error("Lỗi khi tải lên (UPDATE): ", error);
      Alert.alert('Lỗi', `Có lỗi xảy ra: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Tải lên dữ liệu mẫu" onPress={handleUploadWithUpdate} color="#4CAF50" />
      </View>
      {status ? <Text style={styles.statusText}>{status}</Text> : null}
      <Text style={styles.note}>
        Lưu ý: Việc này thường chỉ cần thực hiện một lần để khởi tạo dữ liệu danh mục.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    marginVertical: 10,
  },
  statusText: {
    marginTop: 20,
    color: 'blue',
    fontSize: 16,
  },
  note: {
    marginTop: 30,
    textAlign: 'center',
    color: '#555',
    fontStyle: 'italic',
  }
});

export default UploadCategoriesScreen;