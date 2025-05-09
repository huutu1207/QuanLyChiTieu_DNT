// app/add-transaction.js
import { Stack, useRouter } from 'expo-router';
import { onValue, ref } from 'firebase/database'; // Import các hàm Firebase cần thiết
import { useEffect, useState } from 'react'; // Thêm useState và useEffect
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View, // Thêm View
} from 'react-native';
import AddTransactionUI from '../components/AddTransactionUI'; // Giả sử đường dẫn này đúng
import { database } from '../firebaseConfig'; // Đảm bảo firebaseConfig được import

export default function AddTransactionScreenRoute() {
  const router = useRouter();
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);

  // States cho việc lấy dữ liệu danh mục chi tiêu từ Firebase
  const [expenseCats, setExpenseCats] = useState([]);
  const [incomeCats, setIncomeCats] = useState([ // dữ liệu tĩnh tạm thời 
    { id: 'salary', name: 'Lương', icon: '💰' },
    { id: 'bonus', name: 'Thưởng', icon: '🏆' },
    { id: 'gift_in', name: 'Được tặng', icon: '💝'},
    { id: 'freelance', name: 'Làm thêm', icon: '🧑‍💻'},
    { id: 'investment', name: 'Đầu tư', icon: '📈'},
    { id: 'other_income', name: 'Thu nhập khác', icon: '💸'},
  ]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [errorExpenses, setErrorExpenses] = useState(null);

  useEffect(() => {
    // Tham chiếu đến node 'categories' trong Firebase Realtime Database
    const categoriesRef = ref(database, 'categories');

    const unsubscribeExpenses = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoriesArray = Object.keys(data)
          .map(key => ({
            id: key,
            name: data[key].name,
            icon: data[key].icon,
          }))
          .filter(category => category.id !== 'add'); // Loại bỏ nút 'add' nếu có trong DB

        setExpenseCats(categoriesArray);
        setErrorExpenses(null);
      } else {
        setExpenseCats([]);
        // Bạn có thể đặt setErrorExpenses("Không tìm thấy danh mục chi tiêu.") nếu muốn
      }
      setLoadingExpenses(false);
    }, (error) => {
      console.error("Lỗi khi lấy danh mục chi tiêu từ Firebase: ", error);
      setErrorExpenses("Không thể tải danh mục chi tiêu. Vui lòng thử lại.");
      setLoadingExpenses(false);
    });

    // Hủy lắng nghe khi component unmount
    return () => {
      unsubscribeExpenses();
    };
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy một lần

  const handleCategorySelect = (categoryDetails) => {
    console.log('Đã chọn danh mục:', categoryDetails);
    setSelectedCategoryDetails(categoryDetails);
  };

  const handleNewCategoryPress = (details) => {
    console.log('Yêu cầu thêm danh mục mới cho:', details.type);
    router.push({ pathname: '/category-settings', params: { type: details.type } });
  };

  // Chức năng lưu giao dịch (ví dụ)
  const handleSaveTransaction = () => {
    if (!selectedCategoryDetails) {
      Alert.alert('Chưa chọn danh mục', 'Vui lòng chọn một danh mục trước khi lưu.');
      return;
    }
    console.log('Lưu giao dịch với chi tiết:', selectedCategoryDetails);
    // Thêm logic lưu trữ thực tế ở đây
    Alert.alert('Đã lưu', `Đã lưu giao dịch cho danh mục: ${selectedCategoryDetails.name}`);
    router.back();
  };

  // UI cho trạng thái loading
  if (loadingExpenses) {
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
            headerStyle: { backgroundColor: '#FFD700' },
            headerShadowVisible: true,
          }}
        />
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Đang tải danh mục...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // UI cho trạng thái lỗi (nếu không có danh mục nào được tải)
  if (errorExpenses && expenseCats.length === 0) {
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
            headerStyle: { backgroundColor: '#FFD700' },
            headerShadowVisible: true,
          }}
        />
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>{errorExpenses}</Text>
          {/* Bạn có thể thêm nút "Thử lại" ở đây */}
        </View>
      </SafeAreaView>
    );
  }

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
          headerStyle: { backgroundColor: '#FFD700' },
          headerShadowVisible: true,
        }}
      />
      <AddTransactionUI
        initialTab="Chi tiêu"
        expenseCategories={expenseCats} // Truyền danh mục chi tiêu từ Firebase
        incomeCategories={incomeCats}   // Truyền danh mục thu nhập (hiện tại là tĩnh)
        onCategorySelect={handleCategorySelect}
        onNewCategoryPress={handleNewCategoryPress}
      />
      {/* Nút lưu có thể đặt ở đây hoặc trong header */}
      {/* <TouchableOpacity style={styles.saveButton} onPress={handleSaveTransaction}>
        <Text style={styles.saveButtonText}>LƯU GIAO DỊCH</Text>
      </TouchableOpacity> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff', // Thay đổi màu nền để phần nội dung là trắng
  },
  headerButton: {
    paddingHorizontal: Platform.OS === 'ios' ? 10 : 15,
    paddingVertical: 5,
  },
  headerButtonTextCancel: {
    color: '#FF6347',
    fontSize: 16,
  },
  headerButtonTextSave: { // Style cho nút Lưu nếu bạn thêm vào header
    color: '#4CAF50', // Màu xanh lá cho nút Lưu
    fontSize: 16,
    fontWeight: 'bold',
  },
  centeredMessage: { // Style cho View chứa ActivityIndicator hoặc Text lỗi
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff', // Đảm bảo nền trắng
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});
