// app/add-transaction.js
import { Stack, useRouter } from 'expo-router';

import { onValue, push, ref, serverTimestamp, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import AddTransactionUI from '../components/AddTransactionUI';
import TransactionInputArea from '../components/TransactionInputArea';
import { database } from '../firebaseConfig';
// Import getAuth từ firebase/auth
import { getAuth } from 'firebase/auth';


const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function AddTransactionScreenRoute() {
 const router = useRouter();
 const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);
 const [showInputArea, setShowInputArea] = useState(false);

 const [expenseCats, setExpenseCats] = useState([]);
 const [incomeCats, setIncomeCats] = useState([
  { id: 'salary', name: 'Lương', icon: '💰', type: 'income' },
  { id: 'bonus', name: 'Thưởng', icon: '🏆', type: 'income' },
  { id: 'gift_in', name: 'Được tặng', icon: '💝', type: 'income'},
  { id: 'freelance', name: 'Làm thêm', icon: '🧑‍💻', type: 'income'},
  { id: 'investment', name: 'Đầu tư', icon: '📈', type: 'income'},
  { id: 'other_income', name: 'Thu nhập khác', icon: '💸', type: 'income'},
 ]);
 const [loadingExpenses, setLoadingExpenses] = useState(true);
 const [errorExpenses, setErrorExpenses] = useState(null);


 const auth = getAuth();



 useEffect(() => {
  // Logic lấy danh mục vẫn giữ nguyên, không cần UID ở đây
  const categoriesRef = ref(database, 'categories');
  const unsubscribeExpenses = onValue(categoriesRef, (snapshot) => {
   const data = snapshot.val();
   if (data) {
    const categoriesArray = Object.keys(data)
     .map(key => ({
      id: key,
      name: data[key].name,
      icon: data[key].icon,
      type: data[key].type || 'expense',
     }))
     .filter(category => category.id !== 'add');
    setExpenseCats(categoriesArray);
    setErrorExpenses(null);
   } else {
    setExpenseCats([]);
   }
   setLoadingExpenses(false);
  }, (error) => {
   console.error("Lỗi khi lấy danh mục chi tiêu từ Firebase: ", error);
   setErrorExpenses("Không thể tải danh mục chi tiêu.");
   setLoadingExpenses(false);
  });
  return () => unsubscribeExpenses();
 }, []);


 const handleCategorySelect = (categoryDetails) => {
  setSelectedCategoryDetails(categoryDetails);
  setShowInputArea(true);
 };

 const handleNewCategoryPress = (details) => {
  if (showInputArea) {
    setShowInputArea(false);
    setSelectedCategoryDetails(null);
  }
  router.push({ pathname: '/category-settings', params: { type: details.type } });
 };

 const handleSaveTransactionInput = async (transactionDetails) => {
  if (!selectedCategoryDetails) {
   Alert.alert('Lỗi', 'Không có thông tin danh mục được chọn.');
   return;
  }

    // --- START: Lấy UID người dùng và chuẩn bị dữ liệu ---
    const user = auth.currentUser; // Lấy người dùng hiện tại
    if (!user) {
      Alert.alert('Lỗi', 'Bạn cần đăng nhập để lưu giao dịch.');
      // Có thể chuyển hướng người dùng đến màn hình đăng nhập ở đây
      return;
    }
  const userId = user.uid; // Lấy UID của người dùng


  const transactionData = {
   categoryId: selectedCategoryDetails.id,
   categoryName: selectedCategoryDetails.name,
   categoryIcon: selectedCategoryDetails.icon,
   transactionType: selectedCategoryDetails.transactionType || (selectedCategoryDetails.type === 'income' ? 'income' : 'expense'),
   amount: transactionDetails.amount,
   note: transactionDetails.note,
   date: transactionDetails.date.toISOString(),
   createdAt: serverTimestamp(),
      userId: userId, // Thêm trường userId vào dữ liệu
  };
    // --- END: Lấy UID người dùng và chuẩn bị dữ liệu ---

  console.log('Chuẩn bị lưu giao dịch:', transactionData); // LOG để kiểm tra dữ liệu

  try {
      // Thay đổi đường dẫn lưu giao dịch để bao gồm userId
   const transactionsRef = ref(database, `users/${userId}/transactions`);
   const newTransactionRef = push(transactionsRef); // Tạo một key duy nhất cho giao dịch mới
   await set(newTransactionRef, transactionData); // Sử dụng set để ghi dữ liệu vào key đó

   Alert.alert('Thành công', `Đã lưu giao dịch cho: ${transactionData.categoryName}`);
   setShowInputArea(false);
   setSelectedCategoryDetails(null);
   // router.back(); // Tùy chọn
  } catch (error) {
   console.error("Lỗi khi lưu giao dịch lên Firebase: ", error);
   Alert.alert('Lỗi', `Không thể lưu giao dịch: ${error.message}`);

  }
 };

 const handleCancelTransactionInput = () => {
  setShowInputArea(false);
  setSelectedCategoryDetails(null);
 };

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
      <TouchableOpacity
        onPress={() => {
          if (showInputArea) {
            handleCancelTransactionInput();
          } else {
            router.back();
          }
        }}
        style={styles.headerButton}
      >
       <Text style={styles.headerButtonTextCancel}>Hủy</Text>
      </TouchableOpacity>
     ),
     headerStyle: { backgroundColor: '#FFD700' },
     headerShadowVisible: true,
    }}
   />
   <AddTransactionUI
    initialTab="Chi tiêu"
    expenseCategories={expenseCats}
    incomeCategories={incomeCats}
    onCategorySelect={handleCategorySelect}
    onNewCategoryPress={handleNewCategoryPress}
   />

   <Modal
    animationType="slide"
    transparent={true}
    visible={showInputArea}
    onRequestClose={handleCancelTransactionInput}
   >
    <TouchableWithoutFeedback onPress={handleCancelTransactionInput}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContentContainer}>
            {selectedCategoryDetails && (
              <TransactionInputArea
                selectedCategory={selectedCategoryDetails}
                initialAmount="0"
                initialNote=""
                onSaveTransaction={handleSaveTransactionInput}
                onCancelTransaction={handleCancelTransactionInput}
              />
            )}

          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
   </Modal>
  </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 screenContainer: {
  flex: 1,
  backgroundColor: '#fff',
 },
 headerButton: {
  paddingHorizontal: Platform.OS === 'ios' ? 10 : 15,
  paddingVertical: 5,
 },
 headerButtonTextCancel: {
  color: '#FF6347',
  fontSize: 16,
 },
 centeredMessage: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
  backgroundColor: '#fff',
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
 modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end',
 },
 modalContentContainer: {
  height: SCREEN_HEIGHT * 0.65,
  backgroundColor: '#F0F0F0',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingTop: 5,
 },
});

