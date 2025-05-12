// app/category-settings.js
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { onValue, ref, remove } from 'firebase/database';
import { useEffect, useState } from 'react'; // Bỏ useCallback vì cấu trúc fetch thay đổi
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { database } from '../firebaseConfig';

export default function CategorySettingsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const initialActiveTab = params.type === 'income' ? 'income' : 'expense';
    const [activeTab, setActiveTab] = useState(initialActiveTab);

    // State cho từng loại dữ liệu
    const [defaultExpenseCats, setDefaultExpenseCats] = useState([]);
    const [defaultIncomeCats, setDefaultIncomeCats] = useState([]);
    const [userExpenseCats, setUserExpenseCats] = useState([]);
    const [userIncomeCats, setUserIncomeCats] = useState([]);

    // State cho danh sách hiển thị cuối cùng (kết hợp)
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [incomeCategories, setIncomeCategories] = useState([]);

    const [userId, setUserId] = useState(null);

    // State loading/error chi tiết hơn
    const [loadingDefaults, setLoadingDefaults] = useState(true);
    const [loadingUserCats, setLoadingUserCats] = useState(true);
    const [errorDefaults, setErrorDefaults] = useState(null);
    const [errorUserCats, setErrorUserCats] = useState(null);

    // 1. Lắng nghe trạng thái đăng nhập
    useEffect(() => {
        setLoadingUserCats(true); // Bắt đầu coi như load user state
        const authInstance = getAuth();
        const unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
            if (user) {
                setUserId(user.uid);
                setErrorUserCats(null); // Reset lỗi user khi đăng nhập
            } else {
                setUserId(null);
                setUserExpenseCats([]); // Xóa user cats khi logout
                setUserIncomeCats([]);
                // Không set lỗi ở đây vì vẫn có thể xem default cats
                setLoadingUserCats(false); // Không load user cats nữa
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Fetch danh mục mặc định (từ /categories)
    useEffect(() => {
        setLoadingDefaults(true);
        setErrorDefaults(null);
        const defaultCategoriesRef = ref(database, 'categories');

        const unsubscribeDefaults = onValue(defaultCategoriesRef, (snapshot) => {
            const data = snapshot.val();
            const loadedDefaultsExpenses = [];
            const loadedDefaultsIncomes = [];
            if (data) {
                for (const key in data) {
                    if (key !== 'add' && data[key] && data[key].name && data[key].icon) {
                        const categoryData = {
                            id: key,
                            ...data[key], // name, icon, type
                            isDefault: true, // Đánh dấu là mặc định
                        };
                        // Phân loại mặc định
                        if (categoryData.type === 'expense') {
                            loadedDefaultsExpenses.push(categoryData);
                        } else if (categoryData.type === 'income') {
                            loadedDefaultsIncomes.push(categoryData);
                        }
                    }
                }
            }
            setDefaultExpenseCats(loadedDefaultsExpenses);
            setDefaultIncomeCats(loadedDefaultsIncomes);
            setLoadingDefaults(false);
        }, (firebaseError) => {
            console.error("Lỗi khi tải danh mục mặc định: ", firebaseError);
            setErrorDefaults("Không thể tải danh mục mặc định.");
            setLoadingDefaults(false);
            setDefaultExpenseCats([]);
            setDefaultIncomeCats([]);
        });

        return () => unsubscribeDefaults();
    }, []); // Chạy 1 lần

    // 3. Fetch danh mục của user (từ users/{userId}/categories)
    useEffect(() => {
        if (!userId) {
            // Nếu không có user, đảm bảo user cats trống và không loading
            setUserExpenseCats([]);
            setUserIncomeCats([]);
            setLoadingUserCats(false);
            return;
        }

        setLoadingUserCats(true);
        setErrorUserCats(null);
        const userCategoriesRef = ref(database, `users/${userId}/categories`);

        const unsubscribeUserCats = onValue(userCategoriesRef, (snapshot) => {
            const data = snapshot.val();
            const loadedUserExpenses = [];
            const loadedUserIncomes = [];
            if (data) {
                for (const key in data) {
                    if (data[key] && data[key].name && data[key].icon) {
                        const categoryData = {
                            id: key,
                            ...data[key], // name, icon, type
                            isDefault: false, // Đánh dấu là của user
                        };
                        if (categoryData.type === 'expense') {
                            loadedUserExpenses.push(categoryData);
                        } else if (categoryData.type === 'income') {
                            loadedUserIncomes.push(categoryData);
                        }
                    }
                }
            }
            setUserExpenseCats(loadedUserExpenses);
            setUserIncomeCats(loadedUserIncomes);
            setLoadingUserCats(false);
        }, (firebaseError) => {
            console.error(`Lỗi khi tải danh mục cho user ${userId}: `, firebaseError);
            setErrorUserCats("Không thể tải danh mục của bạn.");
            setLoadingUserCats(false);
            setUserExpenseCats([]);
            setUserIncomeCats([]);
        });

        return () => unsubscribeUserCats();
    }, [userId]); // Chạy lại khi userId thay đổi

    // 4. Kết hợp danh sách để hiển thị
    useEffect(() => {
        // Kết hợp Expenses: User cats trước, rồi đến Default cats
        const combinedExpenses = [...userExpenseCats, ...defaultExpenseCats];
        // Loại bỏ trùng lặp tên, ưu tiên user cats
        const uniqueExpenses = combinedExpenses.reduce((acc, current) => {
            if (!acc.some(item => item.name === current.name)) {
                acc.push(current);
            } else {
                // Nếu trùng tên, kiểm tra xem cái hiện tại có phải của user không
                const existingIndex = acc.findIndex(item => item.name === current.name);
                if (!current.isDefault && acc[existingIndex].isDefault) {
                    acc[existingIndex] = current; // Ưu tiên cái của user
                }
            }
            return acc;
        }, []);
        setExpenseCategories(uniqueExpenses);

        // Kết hợp Incomes tương tự
        const combinedIncomes = [...userIncomeCats, ...defaultIncomeCats];
        const uniqueIncomes = combinedIncomes.reduce((acc, current) => {
            if (!acc.some(item => item.name === current.name)) {
                acc.push(current);
            } else {
                const existingIndex = acc.findIndex(item => item.name === current.name);
                if (!current.isDefault && acc[existingIndex].isDefault) {
                    acc[existingIndex] = current;
                }
            }
            return acc;
        }, []);
        setIncomeCategories(uniqueIncomes);

    }, [defaultExpenseCats, defaultIncomeCats, userExpenseCats, userIncomeCats]); // Chạy lại khi có dữ liệu mới

    // 5. Hàm xóa (Chỉ xóa được danh mục của user)
    const handleDeleteCategory = async (category) => {
        // Kiểm tra xem có phải danh mục của user không
        if (category.isDefault) {
            Alert.alert('Thông báo', 'Không thể xóa danh mục mặc định.');
            return;
        }
        if (!userId) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
            return;
        }

        Alert.alert(
            "Xác nhận xóa",
            `Bạn có chắc chắn muốn xóa danh mục "${category.name}" không?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        const categoryRef = ref(database, `users/${userId}/categories/${category.id}`);
                        try {
                            await remove(categoryRef);
                            Alert.alert('Thành công', 'Đã xóa danh mục.');
                        } catch (e) {
                            console.error("Lỗi khi xóa danh mục: ", e);
                            Alert.alert('Lỗi', 'Không thể xóa danh mục. Vui lòng thử lại.');
                        }
                    }
                }
            ]
        );
    };

    // 6. Hàm sửa (Chỉ sửa được danh mục của user)
    const handleEditCategory = (category) => {
        if (category.isDefault) {
            Alert.alert('Thông báo', 'Không thể sửa danh mục mặc định.');
            return;
        }
        if (!userId) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
            return;
        }
        // Màn hình edit cần được thiết kế để chỉ cho phép sửa danh mục của user
        router.push({
            pathname: '/edit-category-form',
            params: { ...category, currentTab: activeTab } // Truyền id, name, icon, type
        });
    };

    // 7. Render Item (Thêm kiểm tra isDefault để ẩn nút xóa/sửa)
    const renderCategoryItem = ({ item }) => (
        <View style={styles.categoryItemContainer}>
            {/* Chỉ hiển thị nút xóa nếu là danh mục của user (!item.isDefault) */}
            <TouchableOpacity
                onPress={() => handleDeleteCategory(item)}
                style={[styles.actionButton, item.isDefault && styles.hiddenButton]} // Thêm style ẩn
                disabled={item.isDefault} // Vô hiệu hóa nút
            >
                <Ionicons
                    name="remove-circle-outline"
                    size={26}
                    // Đổi màu nếu là default để biểu thị không xóa được
                    color={item.isDefault ? '#cccccc' : '#FF6347'}
                />
            </TouchableOpacity>

            <View style={styles.categoryInfo}>
                <Ionicons
                    name={item.icon ? item.icon : 'help-circle-outline'}
                    size={24}
                    color="#555"
                    style={styles.categoryIcon} />
                <Text style={[styles.categoryName, item.isDefault && styles.defaultCategoryName]}>
                    {item.name}
                    {/* {item.isDefault ? ' (Mặc định)' : ''} */}
                </Text>
            </View>

            {/* Chỉ hiển thị nút sửa nếu là danh mục của user (!item.isDefault) */}
            <TouchableOpacity
                onPress={() => handleEditCategory(item)}
                style={[styles.actionButton, item.isDefault && styles.hiddenButton]} // Thêm style ẩn
                disabled={item.isDefault} // Vô hiệu hóa nút
            >
                <Ionicons
                    name="create-outline"
                    size={24}
                    // Đổi màu nếu là default
                    color={item.isDefault ? '#cccccc' : '#007AFF'}
                />
            </TouchableOpacity>
        </View>
    );

    // --- JSX và Render Logic ---
    const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    const isLoading = loadingDefaults || (!!userId && loadingUserCats); // Loading nếu load default hoặc user (khi đã login)
    const overallError = errorDefaults || errorUserCats; // Lỗi tổng hợp


    // Render Loading
    if (isLoading && currentCategories.length === 0 && !overallError) { // Chỉ show loading toàn màn hình nếu chưa có gì để hiển thị
        return (
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ title: 'Cài đặt danh mục', headerTitleAlign: 'center', headerStyle: { backgroundColor: '#FFD700' }, headerTintColor: '#333' }} />
                <View style={styles.centeredMessage}>
                    <ActivityIndicator size="large" color="#FFB300" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Render Error (Bao gồm cả lỗi chưa đăng nhập từ auth listener)
    if (overallError && !userId && !loadingDefaults && defaultExpenseCats.length === 0 && defaultIncomeCats.length === 0) {
        // Nếu có lỗi user (chưa login) VÀ lỗi default HOẶC không load được default -> báo lỗi
        return (
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ /* ... options ... */ }} />
                <View style={styles.centeredMessage}>
                    <Text style={styles.errorText}>{overallError || "Vui lòng đăng nhập và thử lại."}</Text>
                </View>
            </SafeAreaView>
        );
    }


    // Render Chính
    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ /* ... options ... */ }} />

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {/* ... Tab items ... */}
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'expense' && styles.activeTabItem]}
                    onPress={() => setActiveTab('expense')}>
                    <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>Chi tiêu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'income' && styles.activeTabItem]}
                    onPress={() => setActiveTab('income')}>
                    <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>Thu nhập</Text>
                </TouchableOpacity>
            </View>

            {/* Hiển thị lỗi nhỏ nếu có */}
            {overallError && <Text style={styles.inlineErrorText}>Lưu ý: {overallError}</Text>}
            {/* Hiển thị loading nhỏ nếu đang tải nền */}
            {isLoading && <ActivityIndicator style={{ marginVertical: 5 }} size="small" color="#FFB300" />}


            {/* FlatList */}
            <FlatList
                data={currentCategories} // Danh sách đã kết hợp
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.list}
                ListEmptyComponent={
                    !isLoading && !overallError ? // Chỉ hiển thị khi không load, không lỗi
                        <Text style={styles.emptyListText}>
                            {userId ? `Bạn chưa tạo danh mục ${activeTab === 'expense' ? 'chi tiêu' : 'thu nhập'} nào.` : 'Không có danh mục mặc định nào.'}
                        </Text>
                        : null
                }
                contentContainerStyle={styles.listContentContainer}
            />

            {/* Nút Thêm (Chỉ hiển thị nếu đã đăng nhập) */}
            {userId && (
                <TouchableOpacity
                    style={styles.addCategoryButton}
                    onPress={() => {
                        router.push({ pathname: '/create-category-form', params: { type: activeTab } });
                    }}>
                    <Ionicons name="add-circle-outline" size={22} color="#fff" style={styles.addCategoryButtonIcon} />
                    <Text style={styles.addCategoryButtonText}>Thêm danh mục {activeTab === 'expense' ? 'chi' : 'thu'}</Text>
                </TouchableOpacity>
            )}
            {!userId && !loadingDefaults && !errorDefaults && (
                <View style={styles.loginPrompt}>
                    <Text style={styles.loginPromptText}>Vui lòng đăng nhập để thêm/sửa danh mục của bạn.</Text>
                    {/* Có thể thêm nút điều hướng tới trang Login */}
                    {/* <TouchableOpacity onPress={() => router.push('/login')}>
                         <Text style={styles.loginButtonText}>Đăng nhập</Text>
                     </TouchableOpacity> */}
                </View>
            )}

        </SafeAreaView>
    );
}

// --- Styles (Thêm style cho nút ẩn và tên mặc định) ---
const styles = StyleSheet.create({
    // ... (các style cũ giữ nguyên) ...
    safeArea: { flex: 1, backgroundColor: '#f0f0f0', },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555', },
    errorText: { color: 'red', textAlign: 'center', padding: 10, fontSize: 16 },
    inlineErrorText: { // Lỗi hiển thị nhỏ
        color: 'red',
        textAlign: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#fff8e1',
        fontSize: 14,
    },
    headerBackButton: { marginLeft: Platform.OS === 'ios' ? 10 : 0, paddingHorizontal: 10, paddingVertical: 5, },
    tabContainer: { flexDirection: 'row', backgroundColor: '#FFD700', marginBottom: 1, },
    tabItem: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD700', borderBottomWidth: 3, borderBottomColor: 'transparent', },
    activeTabItem: { borderBottomColor: '#333', },
    tabText: { fontSize: 16, fontWeight: '500', color: '#555', },
    activeTabText: { color: '#000', fontWeight: 'bold', },
    list: { flex: 1, backgroundColor: '#fff', },
    listContentContainer: { flexGrow: 1, paddingBottom: 10, },
    categoryItemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee', },
    categoryInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginRight: 5 }, // Thêm marginRight
    categoryIcon: { fontSize: 24, marginRight: 15, color: '#555', minWidth: 25, textAlign: 'center', },
    categoryName: { fontSize: 16, color: '#333', },
    defaultCategoryName: { // Style riêng cho tên danh mục mặc định (ví dụ: in nghiêng)
        fontStyle: 'italic',
        color: '#666',
    },
    actionButton: { padding: 8, },
    hiddenButton: { // Style để "ẩn" nút (giảm độ mờ hoặc không render)
        opacity: 0.3, // Làm mờ đi
        // Hoặc có thể set width/height = 0 nếu muốn ẩn hoàn toàn
    },
    addCategoryButton: { flexDirection: 'row', backgroundColor: '#FFB300', paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginHorizontal: 15, marginBottom: Platform.OS === 'ios' ? 25 : 15, marginTop: 10, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, },
    addCategoryButtonIcon: { marginRight: 8, },
    addCategoryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', },
    emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#777', paddingHorizontal: 20 },
    loginPrompt: { // Style cho thông báo yêu cầu đăng nhập
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    loginPromptText: {
        fontSize: 15,
        color: '#555',
        textAlign: 'center',
        marginBottom: 10,
    },
    loginButtonText: { // Style cho nút đăng nhập (nếu thêm)
        fontSize: 16,
        color: '#007AFF',
        fontWeight: 'bold',
    }
});