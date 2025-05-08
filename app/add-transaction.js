// app/add-transaction.js
import React, { useState } from 'react'; // Thêm useState
import { SafeAreaView, TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native'; // Thêm Alert
import { Stack, useRouter } from 'expo-router';
import AddTransactionUI from '../components/AddTransactionUI'; // Giả sử đường dẫn này đúng

export default function AddTransactionScreenRoute() {
  const router = useRouter();
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null); // State để lưu danh mục đã chọn

  const handleCategorySelect = (categoryDetails) => {
    console.log('Đã chọn danh mục:', categoryDetails);
    setSelectedCategoryDetails(categoryDetails); // Lưu trữ danh mục vừa chọn vào state
  };

  const handleNewCategoryPress = (details) => {
    console.log('Yêu cầu thêm danh mục mới cho:', details.type);
    // Điều hướng đến màn hình tạo danh mục mới
    router.push({ pathname: '/category-settings', params: { type: details.type } });
  };

  const handleSaveTransaction = () => {
    if (!selectedCategoryDetails) {
      Alert.alert('Chưa chọn danh mục', 'Vui lòng chọn một danh mục trước khi lưu.');
      return;
    }

    // Ở đây, sẽ thêm các thông tin khác của giao dịch như số tiền, ngày, ghi chú...
    // tạm thời chỉ có thông tin danh mục.
    console.log('Lưu giao dịch với chi tiết:', selectedCategoryDetails);
    // Alert.alert('Đã lưu', `Đã lưu giao dịch cho danh mục: ${selectedCategoryDetails.name}`);

    // Thực hiện logic lưu trữ dữ liệu (vào AsyncStorage, SQLite, API...)

    router.back(); // Quay lại màn hình trước sau khi lưu
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Stack.Screen
        options={{
          title: 'Thêm',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Text style={styles.headerButtonTextCancel}>Hủy</Text>
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFD700' }, // Màu nền cho header
          headerShadowVisible: true, // Hiển thị đường viền mờ dưới header
        }}
      />
      <AddTransactionUI
        initialTab="Chi tiêu" // Bạn có thể đặt tab mặc định
        onCategorySelect={handleCategorySelect}
        onNewCategoryPress={handleNewCategoryPress}
        // expenseCategories={customCategories} // Nếu bạn có danh sách danh mục tùy chỉnh từ một nguồn khác
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFD700', // Màu nền chung của màn hình
  },
  headerButton: {
    paddingHorizontal: Platform.OS === 'ios' ? 10 : 15, // Tăng padding cho Android
    paddingVertical: 5,
  },
  headerButtonTextCancel: {
    color: '#FF6347', // Màu chữ cho nút Hủy (Tomato Red)
    fontSize: 16,
  },
  headerButtonTextSave: {
    color: '#FF6347', // Màu chữ cho nút Lưu
    fontSize: 16,
    fontWeight: 'bold',
  },
});