// Giả sử bạn lưu file này là components/UploadCategoriesScreen.js

import { ref, set, update } from "firebase/database";
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { database } from '../firebaseConfig';
// Bạn sẽ cần import Ionicons ở nơi hiển thị các icon này, ví dụ trong HomeScreen

// Cập nhật danh sách dữ liệu danh mục ban đầu với tên icon từ Ionicons
const initialCategoriesData = [
 { id: '1', name: 'Mua sắm', icon: 'cart-outline' }, // shopping-outline
 { id: '2', name: 'Đồ ăn', icon: 'fast-food-outline' }, // fast-food-outline
 { id: '3', name: 'Điện thoại', icon: 'phone-portrait-outline' }, // phone-portrait-outline
 { id: '4', name: 'Giải trí', icon: 'game-controller-outline' }, // game-controller-outline
 { id: '5', name: 'Giáo dục', icon: 'book-outline' }, // book-outline
 { id: '6', name: 'Sắc đẹp', icon: 'sparkles-outline' }, // sparkles-outline
 { id: '7', name: 'Thể thao', icon: 'basketball-outline' }, // basketball-outline
 { id: '8', name: 'Xã hội', icon: 'people-outline' }, // people-outline
 { id: '9', name: 'Vận tải', icon: 'car-outline' }, // car-outline
 { id: '10', name: 'Quần áo', icon: 'shirt-outline' }, // shirt-outline
 { id: '11', name: 'Xe hơi', icon: 'car-outline' }, // car-outline (trùng với Vận tải, có thể chọn icon khác nếu muốn)
 { id: '12', name: 'Rượu', icon: 'wine-outline' }, // wine-outline
 { id: '13', name: 'Thuốc lá', icon: 'close-circle-outline' }, // close-circle-outline (không có icon thuốc lá trực tiếp, dùng biểu tượng phủ định)
 { id: '14', name: 'Thiết bị ĐT', icon: 'headset-outline' }, // headset-outline
 { id: '15', name: 'Du lịch', icon: 'airplane-outline' }, // airplane-outline
 { id: '16', name: 'Sức khỏe', icon: 'heart-outline' }, // heart-outline
 { id: '17', name: 'Thú cưng', icon: 'paw-outline' }, // paw-outline
 { id: '18', name: 'Sửa chữa', icon: 'build-outline' }, // build-outline
 { id: '19', name: 'Nhà ở', icon: 'home-outline' }, // home-outline
 { id: '20', name: 'Nhà', icon: 'home-outline' }, // home-outline (trùng với Nhà ở)
 { id: '21', name: 'Quà tặng', icon: 'gift-outline' }, // gift-outline
 { id: '22', name: 'Quyên góp', icon: 'heart-circle-outline' }, // heart-circle-outline
 { id: '23', name: 'Vé số', icon: 'ticket-outline' }, // ticket-outline
 { id: '24', name: 'Đồ ăn nhẹ', icon: 'nutrition-outline' }, // nutrition-outline
 { id: 'add', name: 'Thêm mới', icon: 'add-circle-outline' }, // add-circle-outline (icon cho nút thêm)
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
     icon: category.icon, // Lưu tên icon
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
     icon: category.icon, // Lưu tên icon
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
   {/* Có thể thêm nút upload SET nếu cần */}
   {/* <View style={styles.buttonContainer}>
    <Button title="Tải lên dữ liệu mẫu (SET)" onPress={handleUploadWithSet} color="#FF9800" />
   </View> */}
   <View style={styles.buttonContainer}>
    <Button title="Tải lên dữ liệu mẫu" onPress={handleUploadWithUpdate} color="#4CAF50" />
   </View>
   {status ? <Text style={styles.statusText}>{status}</Text> : null}
   <Text style={styles.note}>
    Lưu ý: Việc này thường chỉ cần thực hiện một lần để khởi tạo dữ liệu danh mục.
        Sau khi tải lên, bạn cần cập nhật code hiển thị icon trong HomeScreen.js.
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
