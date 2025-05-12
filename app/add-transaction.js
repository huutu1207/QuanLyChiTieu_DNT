// app/add-transaction.js
import { Stack, useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { onValue, push, ref, serverTimestamp, set } from 'firebase/database';
import { useEffect, useState } from 'react'; // Bỏ useCallback nếu không dùng nữa
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

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function AddTransactionScreenRoute() {
    const router = useRouter();
    const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);
    const [showInputArea, setShowInputArea] = useState(false);

    // --- State cho danh mục chi tiêu ---
    const [defaultExpenseCats, setDefaultExpenseCats] = useState([]);
    const [userExpenseCats, setUserExpenseCats] = useState([]);
    const [finalExpenseCats, setFinalExpenseCats] = useState([]); // Đổi tên từ expenseCats

    // --- State cho danh mục thu nhập ---
    const [defaultIncomeCats, setDefaultIncomeCats] = useState([]);
    const [userIncomeCats, setUserIncomeCats] = useState([]);
    const [finalIncomeCats, setFinalIncomeCats] = useState([]); // Thay thế incomeCats hardcoded

    // --- State cho trạng thái loading và error ---
    const [loadingDefaults, setLoadingDefaults] = useState(true);
    const [loadingUserCats, setLoadingUserCats] = useState(true);
    const [errorDefaults, setErrorDefaults] = useState(null);
    const [errorUserCats, setErrorUserCats] = useState(null);
    const [userId, setUserId] = useState(null);

    const auth = getAuth();

    // 1. Lắng nghe trạng thái đăng nhập
    useEffect(() => {
        setLoadingUserCats(true);
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                setErrorUserCats(null);
            } else {
                setUserId(null);
                setUserExpenseCats([]);
                setUserIncomeCats([]); // Reset user income cats khi logout
                setErrorUserCats(null);
                setLoadingUserCats(false);
            }
        });
        return () => unsubscribeAuth();
    }, [auth]);

    // 2. Fetch danh mục mặc định từ /categories
    useEffect(() => {
        const defaultCategoriesRef = ref(database, 'categories');
        setLoadingDefaults(true);

        const unsubscribeDefaults = onValue(defaultCategoriesRef, (snapshot) => {
            const data = snapshot.val();
            const loadedDefaultExpenses = [];
            const loadedDefaultIncomes = []; // Thêm mảng cho default income

            if (data) {
                Object.keys(data).forEach(key => {
                    // Bỏ qua các mục 'add_' đặc biệt dùng để upload, không phải category thực sự để chọn
                    if (key.startsWith('add_') || key == 'add') return;

                    const category = {
                        id: key,
                        isDefault: true,
                        ...data[key], // name, icon, type
                    };
                    // Phân loại dựa trên trường 'type'
                    if (category.type === 'expense') {
                        loadedDefaultExpenses.push(category);
                    } else if (category.type === 'income') {
                        loadedDefaultIncomes.push(category);
                    }
                });
            }
            setDefaultExpenseCats(loadedDefaultExpenses);
            setDefaultIncomeCats(loadedDefaultIncomes); // Cập nhật default income
            setErrorDefaults(null);
            setLoadingDefaults(false);
        }, (error) => {
            console.error("Lỗi khi lấy danh mục mặc định: ", error);
            setErrorDefaults("Không thể tải danh mục mặc định.");
            setDefaultExpenseCats([]);
            setDefaultIncomeCats([]); // Reset khi có lỗi
            setLoadingDefaults(false);
        });
        return () => unsubscribeDefaults();
    }, []);

    // 3. Fetch danh mục riêng của người dùng từ users/{userId}/categories
    useEffect(() => {
        if (!userId) {
            setUserExpenseCats([]);
            setUserIncomeCats([]); // Reset user income
            setErrorUserCats(null);
            setLoadingUserCats(false);
            return;
        }

        const userCategoriesRef = ref(database, `users/${userId}/categories`);
        setLoadingUserCats(true);

        const unsubscribeUserCats = onValue(userCategoriesRef, (snapshot) => {
            const data = snapshot.val();
            const loadedUserExpenses = [];
            const loadedUserIncomes = []; // Thêm mảng cho user income

            if (data) {
                Object.keys(data).forEach(key => {
                    const category = {
                        id: key,
                        isDefault: false,
                        ...data[key], // name, icon, type
                    };
                     // Phân loại dựa trên trường 'type'
                    if (category.type === 'expense') {
                        loadedUserExpenses.push(category);
                    } else if (category.type === 'income') {
                        loadedUserIncomes.push(category);
                    }
                });
            }
            setUserExpenseCats(loadedUserExpenses);
            setUserIncomeCats(loadedUserIncomes); // Cập nhật user income
            setErrorUserCats(null);
            setLoadingUserCats(false);
        }, (error) => {
            console.error(`Lỗi khi lấy danh mục cho user ${userId}: `, error);
            setErrorUserCats("Không thể tải danh mục của bạn.");
            setUserExpenseCats([]);
            setUserIncomeCats([]); // Reset khi có lỗi
            setLoadingUserCats(false);
        });
        return () => unsubscribeUserCats();
    }, [userId]);

    // 4. Kết hợp danh sách EXPENSE
    useEffect(() => {
        const combined = [...userExpenseCats, ...defaultExpenseCats];
        const uniqueCombined = combined.reduce((acc, current) => {
            const existingIndex = acc.findIndex(item => item.name === current.name);
            if (existingIndex === -1) {
                acc.push(current);
            } else {
                if (!current.isDefault && acc[existingIndex].isDefault) {
                    acc[existingIndex] = current;
                }
            }
            return acc;
        }, []);
        setFinalExpenseCats(uniqueCombined);
    }, [defaultExpenseCats, userExpenseCats]);

    // 5. Kết hợp danh sách INCOME
    useEffect(() => {
        const combined = [...userIncomeCats, ...defaultIncomeCats];
        const uniqueCombined = combined.reduce((acc, current) => {
            const existingIndex = acc.findIndex(item => item.name === current.name);
            if (existingIndex === -1) {
                acc.push(current);
            } else {
                if (!current.isDefault && acc[existingIndex].isDefault) {
                    acc[existingIndex] = current;
                }
            }
            return acc;
        }, []);
        setFinalIncomeCats(uniqueCombined);
    }, [defaultIncomeCats, userIncomeCats]);


    // --- Các hàm xử lý sự kiện (giữ nguyên) ---
    const handleCategorySelect = (categoryDetails) => {
        setSelectedCategoryDetails(categoryDetails);
        setShowInputArea(true);
    };

    const handleNewCategoryPress = (details) => {
        if (!userId) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để thêm danh mục mới.');
            return;
        }
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
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để lưu giao dịch.');
            return;
        }
        const currentUserId = currentUser.uid;

        const transactionData = {
            categoryId: selectedCategoryDetails.id,
            categoryName: selectedCategoryDetails.name,
            categoryIcon: selectedCategoryDetails.icon,
            transactionType: selectedCategoryDetails.type, // Giờ type sẽ là 'expense' hoặc 'income' từ data
            amount: transactionDetails.amount,
            note: transactionDetails.note,
            date: transactionDetails.date.toISOString(),
            createdAt: serverTimestamp(),
            userId: currentUserId,
        };

        try {
            const transactionsRef = ref(database, `users/${currentUserId}/transactions`);
            const newTransactionRef = push(transactionsRef);
            await set(newTransactionRef, transactionData);
            Alert.alert('Thành công', `Đã lưu giao dịch cho: ${transactionData.categoryName}`);
            setShowInputArea(false);
            setSelectedCategoryDetails(null);
        } catch (error) {
            console.error("Lỗi khi lưu giao dịch lên Firebase: ", error);
            Alert.alert('Lỗi', `Không thể lưu giao dịch: ${error.message}`);
        }
    };

    const handleCancelTransactionInput = () => {
        setShowInputArea(false);
        setSelectedCategoryDetails(null);
    };

    // --- Phần Render ---
    const isLoading = loadingDefaults || (!!userId && loadingUserCats) || (!userId && loadingUserCats && !errorUserCats);
    const overallError = errorDefaults || errorUserCats;

    if (isLoading) {
        // ... JSX cho màn hình Loading (giữ nguyên)
        return (
          <SafeAreaView style={styles.screenContainer}>
            <Stack.Screen options={{ /* ... */ }} />
            <View style={styles.centeredMessage}>
              <ActivityIndicator size="large" color="#333" />
              <Text style={styles.loadingText}>Đang tải danh mục...</Text>
            </View>
          </SafeAreaView>
        );
    }

    // Chỉ hiển thị lỗi toàn màn hình nếu có lỗi VÀ không có danh mục nào để hiển thị (cả expense và income)
    if (overallError && finalExpenseCats.length === 0 && finalIncomeCats.length === 0) {
        // ... JSX cho màn hình Error (giữ nguyên)
        return (
          <SafeAreaView style={styles.screenContainer}>
            <Stack.Screen options={{ /* ... */ }} />
            <View style={styles.centeredMessage}>
              <Text style={styles.errorText}>{overallError}</Text>
              {errorUserCats && !userId && <Text style={styles.errorText}>Vui lòng đăng nhập để xem/thêm danh mục riêng.</Text>}
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

            {overallError && (finalExpenseCats.length > 0 || finalIncomeCats.length > 0) && (
                <Text style={styles.inlineErrorText}>
                    Lưu ý: {overallError}
                </Text>
            )}

            <AddTransactionUI
                initialTab="Chi tiêu"
                expenseCategories={finalExpenseCats} // Sử dụng finalExpenseCats
                incomeCategories={finalIncomeCats}   // <<< SỬ DỤNG finalIncomeCats TỪ STATE
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

// --- Styles (Giữ nguyên) ---
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#fff', },
  headerButton: { paddingHorizontal: Platform.OS === 'ios' ? 10 : 15, paddingVertical: 5, },
  headerButtonTextCancel: { color: '#FF6347', fontSize: 16, fontWeight: '500', },
  centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa', },
  loadingText: { marginTop: 15, fontSize: 16, color: '#495057', },
  errorText: { fontSize: 16, color: '#dc3545', textAlign: 'center', marginBottom: 10, },
  inlineErrorText: { // Style cho lỗi hiển thị inline
    color: 'orange',
    textAlign: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff8e1',
    fontSize: 14,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end', },
  modalContentContainer: {
    height: SCREEN_HEIGHT * 0.65, // Giữ nguyên hoặc điều chỉnh // <<< DÒNG NÀY BỊ COMMENT
    maxHeight: SCREEN_HEIGHT * 0.75, // Giới hạn chiều cao tối đa
    minHeight: SCREEN_HEIGHT * 0.4,  // Chiều cao tối thiểu    // <<< DÒNG NÀY ĐANG HOẠT ĐỘNG
    backgroundColor: '#ffffff', // White background for modal
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});