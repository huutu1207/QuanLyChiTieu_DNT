// app/category-settings.js
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
// Bỏ import Ionicons 
import { MaterialIcons } from '@expo/vector-icons';
import { onValue, ref, remove } from 'firebase/database'; // Import các hàm Firebase cần thiết
import { database } from '../firebaseConfig'; // Đảm bảo firebaseConfig được import

// Tên các node trên Firebase
const EXPENSE_CATEGORIES_NODE = 'categories'; 
const INCOME_CATEGORIES_NODE = 'income_categories'; 

export default function CategorySettingsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const initialActiveTab = params.type === 'income' ? 'income' : 'expense';
    const [activeTab, setActiveTab] = useState(initialActiveTab);

    const [expenseCategories, setExpenseCategories] = useState([]);
    const [incomeCategories, setIncomeCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadCategories = useCallback(async (type) => {
        setLoading(true);
        setError(null);
        const nodeName = type === 'expense' ? EXPENSE_CATEGORIES_NODE : INCOME_CATEGORIES_NODE;
        const categoriesRef = ref(database, nodeName);

        const unsubscribe = onValue(categoriesRef, (snapshot) => {
            const data = snapshot.val();
            const loadedCategories = [];
            if (data) {
                for (const key in data) {
                    if (key !== 'add' && data[key].name && data[key].icon) {
                        loadedCategories.push({
                            id: key,
                            ...data[key], // name, icon (giờ là emoji/text)
                            type: type
                        });
                    }
                }
            }
            if (type === 'expense') {
                setExpenseCategories(loadedCategories);
            } else {
                setIncomeCategories(loadedCategories);
            }
            setLoading(false);
        }, (firebaseError) => {
            console.error(`Lỗi khi tải danh mục ${type}: `, firebaseError);
            setError(`Không thể tải danh mục ${type}. Vui lòng thử lại.`);
            setLoading(false);
            if (type === 'expense') {
                setExpenseCategories([]);
            } else {
                setIncomeCategories([]);
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        let unsubscribeExpenses;
        let unsubscribeIncomes;

        const loadInitialData = async () => {
            unsubscribeExpenses = await loadCategories('expense');
            unsubscribeIncomes = await loadCategories('income');
        }
        loadInitialData();

        return () => {
            if (unsubscribeExpenses) unsubscribeExpenses();
            if (unsubscribeIncomes) unsubscribeIncomes();
        };
    }, [loadCategories]);


    const handleDeleteCategory = async (categoryId, categoryType) => {
        Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc chắn muốn xóa danh mục này không? Hành động này không thể hoàn tác.",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        const nodeName = categoryType === 'expense' ? EXPENSE_CATEGORIES_NODE : INCOME_CATEGORIES_NODE;
                        const categoryRef = ref(database, `${nodeName}/${categoryId}`);
                        try {
                            await remove(categoryRef);
                            console.log('Đã xóa danh mục:', categoryId, 'loại:', categoryType);
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

    const handleEditCategory = (category) => {
        router.push({
            pathname: '/edit-category-form',
            params: { ...category, currentTab: activeTab }
        });
    };

    const renderCategoryItem = ({ item }) => (
        <View style={styles.categoryItemContainer}>
            <TouchableOpacity onPress={() => handleDeleteCategory(item.id, item.type)} style={styles.actionButton}>
                <MaterialIcons name="remove-circle-outline" size={26} color="#FF6347" />
            </TouchableOpacity>
            <View style={styles.categoryInfo}>
                {/* Thay thế Ionicons bằng Text để hiển thị emoji/ký tự */}
                <Text style={styles.categoryIconText}>{item.icon || '📄'}</Text>
                <Text style={styles.categoryName}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={() => handleEditCategory(item)} style={styles.actionButton}>
                <MaterialIcons name="edit" size={24} color="#007AFF" />
            </TouchableOpacity>
        </View>
    );

    const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

    if (loading && currentCategories.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ title: 'Cài đặt danh mục', headerTitleAlign: 'center', headerStyle: { backgroundColor: '#FFD700' }, headerTintColor: '#333' }} />
                <View style={styles.centeredMessage}>
                    <ActivityIndicator size="large" color="#FFB300" />
                    <Text style={styles.loadingText}>Đang tải danh mục...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen
                options={{
                    title: 'Cài đặt danh mục',
                    headerTitleAlign: 'center',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                            {/* Thay thế Ionicons bằng Text cho nút back */}
                            <Text style={styles.headerBackIconText}>‹</Text>
                        </TouchableOpacity>
                    ),
                    headerStyle: { backgroundColor: '#FFD700' },
                    headerTintColor: '#333',
                }}
            />

            <View style={styles.tabContainer}>
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

            {loading && currentCategories.length > 0 && <ActivityIndicator style={{marginVertical: 10}} size="small" color="#FFB300" />}
            {error && <Text style={styles.errorText}>{error}</Text>}

            <FlatList
                data={currentCategories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.list}
                ListEmptyComponent={!loading ? <Text style={styles.emptyListText}>Không có danh mục nào cho mục {activeTab === 'expense' ? 'chi tiêu' : 'thu nhập'}.</Text> : null}
                contentContainerStyle={{ flexGrow: 1 }}
            />

            <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={() => {
                    router.push({ pathname: '/create-category-form', params: { type: activeTab } });
                }}>
                {/* Thay thế Ionicons bằng Text cho nút thêm */}
                <Text style={styles.addCategoryButtonIcon}>➕</Text>
                <Text style={styles.addCategoryButtonText}>Thêm danh mục {activeTab === 'expense' ? 'chi' : 'thu'}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    centeredMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        padding: 10,
        backgroundColor: '#ffe0e0',
        margin: 10,
        borderRadius: 5,
    },
    headerBackButton: { // Style cho TouchableOpacity của nút back
        marginLeft: Platform.OS === 'ios' ? 10 : 0,
        paddingHorizontal: 10, // Thêm padding ngang cho dễ bấm
        paddingVertical: 5,
    },
    headerBackIconText: { // Style cho Text của icon back
        fontSize: Platform.OS === 'ios' ? 32 : 28, // Kích thước lớn hơn cho iOS
        color: '#333',
        fontWeight: Platform.OS === 'ios' ? '300' : 'normal', // Mỏng hơn trên iOS
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFD700',
    },
    tabItem: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFD700',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabItem: {
        borderBottomColor: '#333',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#555',
    },
    activeTabText: {
        color: '#000',
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
        backgroundColor: '#fff',
    },
    categoryItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    // Style cho Text hiển thị icon (emoji) trong danh sách
    categoryIconText: {
        fontSize: 22, // Điều chỉnh kích thước emoji nếu cần
        marginRight: 15,
        color: '#444', // Có thể không cần nếu emoji đã có màu
        minWidth: 25, // Đảm bảo có không gian tối thiểu cho icon
        textAlign: 'center',
    },
    categoryName: {
        fontSize: 16,
        color: '#333',
    },
    actionButton: {
        padding: 8,
    },
    addCategoryButton: {
        flexDirection: 'row',
        backgroundColor: '#FFB300',
        paddingVertical: 15,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 15,
        marginBottom: Platform.OS === 'ios' ? 25 : 15,
        marginTop: 10,
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    // Style cho Text hiển thị icon (emoji) trên nút "Thêm danh mục"
    addCategoryButtonIcon: {
        fontSize: 22, // Kích thước emoji
        color: '#fff', // Màu trắng cho emoji
        marginRight: 0, // Bỏ marginLeft của addCategoryButtonText nếu icon đứng trước
    },
    addCategoryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8, // Giữ lại marginLeft nếu icon đứng trước
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#777',
        flex: 1,
        textAlignVertical: 'center',
    },
});
