// app/create-category-form.js
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
// Import các hàm firebase cần thiết
import { push, ref, set } from 'firebase/database';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
// Đảm bảo import đúng auth và database từ file config
import { getAuth } from 'firebase/auth';
import { database } from '../firebaseConfig';
// --- Constants and Icon Data (Giữ nguyên) ---
const { width } = Dimensions.get('window');
const NUM_COLUMNS = 5;
const ICON_ITEM_MARGIN = 15;
const ICON_SIZE = 30;
const ICON_CONTAINER_SIZE = (width - 40 - (NUM_COLUMNS + 1) * ICON_ITEM_MARGIN) / NUM_COLUMNS;
const FLATLIST_PADDING_HORIZONTAL = 20;

const iconData = {
    'Giải trí': [
        { name: 'game-controller-outline', label: 'Game' },
        { name: 'skull-outline', label: 'Ma' }, // Changed 'ghost' to 'skull'
        { name: 'triangle-outline', label: 'Kim tự tháp' }, // Changed 'pyramid'
        { name: 'american-football-outline', label: 'Bóng bầu dục' },
        { name: 'search-outline', label: 'Tìm kiếm' },
        { name: 'tennisball-outline', label: 'Tennis' }, // Check if this is valid, else use 'ellipse'
        { name: 'grid-outline', label: 'Ô vuông' },
        { name: 'newspaper-outline', label: 'Báo' },
        { name: 'play-circle-outline', label: 'Phát' },
        { name: 'rocket-outline', label: 'Tên lửa' },
        { name: 'tv-outline', label: 'TV' },
        { name: 'headset-outline', label: 'Tai nghe' },
        { name: 'pencil-outline', label: 'Bút chì' },
        { name: 'cube-outline', label: 'Cờ vua' },
        { name: 'bowling-ball-outline', label: 'Bowling' },
        { name: 'walk-outline', label: 'Trượt patin' },
        { name: 'film-outline', label: 'Phim' },
        { name: 'musical-notes-outline', label: 'Nhạc' },
        { name: 'happy-outline', label: 'Vui vẻ' },
        { name: 'sparkles-outline', label: 'Lấp lánh' },
    ],
    'Đồ ăn': [
        { name: 'fast-food-outline', label: 'Fast Food' },
        { name: 'pizza-outline', label: 'Pizza' },
        { name: 'ice-cream-outline', label: 'Kem' },
        { name: 'cafe-outline', label: 'Cafe' },
        { name: 'nutrition-outline', label: 'Dinh dưỡng' }, // Keep if valid
        { name: 'restaurant-outline', label: 'Nhà hàng' },
        { name: 'beer-outline', label: 'Bia' },
        { name: 'wine-outline', label: 'Rượu' },
        { name: 'logo-apple', label: 'Táo' }, // Changed 'apple'
        { name: 'gift-outline', label: 'Kẹo' }, // Changed 'candy'
        { name: 'fish-outline', label: 'Cá' },
        { name: 'egg-outline', label: 'Trứng' },
    ],
    'Mua sắm': [
        { name: 'cart-outline', label: 'Giỏ hàng' },
        { name: 'bag-handle-outline', label: 'Túi xách' },
        { name: 'pricetag-outline', label: 'Thẻ giá' },
        { name: 'wallet-outline', label: 'Ví tiền' },
        { name: 'card-outline', label: 'Thẻ' },
        { name: 'basket-outline', label: 'Giỏ' },
        { name: 'receipt-outline', label: 'Hóa đơn' },
        { name: 'cash-outline', label: 'Tiền mặt' },
        { name: 'gift-outline', label: 'Quà' },
    ],
    'Vận tải': [
        { name: 'car-sport-outline', label: 'Ô tô' },
        { name: 'bus-outline', label: 'Xe buýt' },
        { name: 'train-outline', label: 'Tàu hỏa' },
        { name: 'bicycle-outline', label: 'Xe đạp' },
        { name: 'walk-outline', label: 'Đi bộ' },
        { name: 'airplane-outline', label: 'Máy bay' },
        { name: 'boat-outline', label: 'Thuyền' },
        { name: 'subway-outline', label: 'Tàu điện ngầm' }, // Keep if valid
        { name: 'car-outline', label: 'Taxi' },
    ],
    'Sức khỏe': [
        { name: 'heart-outline', label: 'Tim' },
        { name: 'medkit-outline', label: 'Bộ y tế' },
        { name: 'fitness-outline', label: 'Thể hình' },
        { name: 'nutrition-outline', label: 'Dinh dưỡng' },
        { name: 'bandage-outline', label: 'Băng gạc' },
    ],
    'Nhà ở': [
        { name: 'home-outline', label: 'Nhà' },
        { name: 'build-outline', label: 'Xây dựng' },
        { name: 'hammer-outline', label: 'Búa' },
        { name: 'key-outline', label: 'Chìa khóa' },
        { name: 'bulb-outline', label: 'Bóng đèn' },
    ]
};

const expenseIconGroups = ['Giải trí', 'Đồ ăn', 'Mua sắm', 'Vận tải', 'Sức khỏe', 'Nhà ở'];
const incomeIconGroups = ['Giải trí', 'Đồ ăn', 'Mua sắm', 'Vận tải', 'Sức khỏe', 'Nhà ở']; // Tạm thời giống Chi tiêu

const getInitialIconName = (initialTab) => {
    const relevantGroups = initialTab === 'Chi tiêu' ? expenseIconGroups : incomeIconGroups;
    for (const groupName of relevantGroups) {
        if (iconData[groupName]?.[0]?.name) {
            return iconData[groupName][0].name;
        }
    }
    // Trả về một icon mặc định nếu không tìm thấy icon nào phù hợp
    return 'add-circle-outline';
};
// --- Kết thúc Constants và Icon Data ---


export default function CategorySettingsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const initialActiveTab = params.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
    const initialIcon = getInitialIconName(initialActiveTab);

    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [categoryName, setCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(initialIcon);

    // Function to handle saving the new category
    const handleSaveCategory = () => {
        if (!categoryName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục.');
            return;
        }
        if (!selectedIcon) {
            Alert.alert('Lỗi', 'Vui lòng chọn một biểu tượng.');
            return;
        }

        // 1. Xác định User ID
        const authInstance = getAuth(); // <--- LẤY AUTH INSTANCE TRỰC TIẾP
        const currentUser = authInstance.currentUser; // Sử dụng auth đã import
        if (!currentUser) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để thực hiện thao tác này.');
            return;
        }
        const userId = currentUser.uid;

        // 2. --- THAY ĐỔI ĐƯỜNG DẪN LƯU ---
        // Đường dẫn tới node categories của user hiện tại
        const userCategoriesPath = `users/${userId}/categories`;

        // 3. Tạo reference mới trong đường dẫn ĐÚNG
        const newCategoryRef = push(ref(database, userCategoriesPath));

        // 4. --- THAY ĐỔI DỮ LIỆU LƯU ---
        const newCategoryData = {
            name: categoryName.trim(),
            icon: selectedIcon,
            // Chuyển đổi 'Chi tiêu'/'Thu nhập' thành 'expense'/'income'
            type: activeTab === 'Thu nhập' ? 'income' : 'expense',
            // Không cần lưu userId và createdAt trong object này nữa (trừ khi bạn có lý do cụ thể)
            // userId: userId,
            // createdAt: new Date().toISOString(),
        };

        // 5. Thực hiện ghi dữ liệu
        set(newCategoryRef, newCategoryData)
            .then(() => {
                Alert.alert('Thành công', 'Danh mục đã được thêm!');
                console.log(`Saved new category to ${userCategoriesPath}: ${JSON.stringify(newCategoryData)}`);
                setCategoryName('');
                setSelectedIcon(getInitialIconName(activeTab));
                router.back();
            })
            .catch((error) => {
                console.error("Firebase Error: Lỗi khi thêm danh mục:", error);
                Alert.alert('Lỗi Firebase', `Không thể thêm danh mục: ${error.message}`);
            });
    };

    // --- Các hàm render và JSX (Giữ nguyên) ---
    const renderHeaderLeft = () => (
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.headerButtonTextCancel}>Hủy</Text>
        </TouchableOpacity>
    );

    const renderHeaderRight = () => (
        <TouchableOpacity onPress={handleSaveCategory} style={styles.headerButton}>
            <Ionicons name="checkmark" size={24} color="#000" />
        </TouchableOpacity>
    );

    const renderIconItem = ({ item }) => {
        const isSelected = selectedIcon === item.name;
        return (
            <TouchableOpacity
                style={[
                    styles.iconItemContainer,
                    { marginRight: ICON_ITEM_MARGIN, marginBottom: ICON_ITEM_MARGIN }
                ]}
                onPress={() => setSelectedIcon(item.name)}
            >
                <View style={[
                    styles.iconCircle,
                    { width: ICON_CONTAINER_SIZE, height: ICON_CONTAINER_SIZE, borderRadius: ICON_CONTAINER_SIZE / 2 },
                    isSelected && styles.selectedIconCircle
                ]}>
                    <Ionicons name={item.name} size={ICON_SIZE} color={isSelected ? '#000' : '#555'} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderIconGrid = () => {
        const relevantGroups = activeTab === 'Chi tiêu' ? expenseIconGroups : incomeIconGroups;
        const groupedDisplayData = [];
        const processedIconNames = new Set();

        relevantGroups.forEach(groupName => {
            if (iconData[groupName] && iconData[groupName].length > 0) {
                const groupItems = iconData[groupName]
                    .filter(item => !processedIconNames.has(item.name))
                    .map(item => {
                        processedIconNames.add(item.name);
                        return { ...item, type: 'icon', id: `icon-${item.name}-${groupName}` };
                    });

                if (groupItems.length > 0) {
                    groupedDisplayData.push({ type: 'header', title: groupName, id: `header-${groupName}` });
                    groupedDisplayData.push({ type: 'grid', items: groupItems, id: `grid-${groupName}` });
                }
            }
        });

        const renderFlatListItem = ({ item }) => {
            if (item.type === 'header') {
                return (
                    <View style={styles.iconGroupHeader}>
                        <Text style={styles.iconGroupHeaderText}>{item.title}</Text>
                    </View>
                );
            } else if (item.type === 'grid') {
                return (
                    <View style={styles.iconGridRowContainer}>
                        {item.items.map(iconItem => (
                            <View key={iconItem.id}>
                                {renderIconItem({ item: iconItem })}
                            </View>
                        ))}
                    </View>
                );
            }
            return null;
        };

        return (
            <FlatList
                data={groupedDisplayData}
                renderItem={renderFlatListItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.iconGridContainer}
                style={{ flex: 1 }} // Quan trọng để FlatList có thể scroll
            />
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                 options={{
                     title: 'Thêm danh mục',
                     headerTitleAlign: 'center',
                     headerLeft: renderHeaderLeft, // Sử dụng hàm render
                     headerRight: renderHeaderRight, // Sử dụng hàm render
                     headerStyle: { backgroundColor: '#FFD700' },
                     headerTintColor: '#000',
                     headerTitleStyle: { color: '#000', fontWeight: 'bold' },
                     headerShadowVisible: false,
                 }}
            />

            <View style={styles.tabContainer}>
                 {['Chi tiêu', 'Thu nhập'].map((tabName) => (
                     <TouchableOpacity
                         key={tabName}
                         style={[ styles.tabButton, activeTab === tabName && styles.activeTabButton ]}
                         onPress={() => {
                             setActiveTab(tabName);
                             setSelectedIcon(getInitialIconName(tabName));
                             setCategoryName('');
                         }}
                     >
                         <Text style={[ styles.tabButtonText, activeTab === tabName && styles.activeTabButtonText ]}>
                             {tabName}
                         </Text>
                     </TouchableOpacity>
                 ))}
             </View>

             <View style={styles.inputAreaContainer}>
                 <View style={styles.inputIconContainer}>
                     {selectedIcon ? (
                         <Ionicons name={selectedIcon} size={ICON_SIZE + 5} color="#000" />
                     ) : (
                         <View style={styles.inputIconPlaceholder} />
                     )}
                 </View>
                 <TextInput
                     style={styles.categoryNameInput}
                     placeholder="Vui lòng nhập tên danh mục"
                     placeholderTextColor="#888"
                     value={categoryName}
                     onChangeText={setCategoryName}
                 />
             </View>

             {/* Đảm bảo FlatList được render trong View cha */}
             {renderIconGrid()}

        </View>
    );
}

// --- Styles (Giữ nguyên) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: FLATLIST_PADDING_HORIZONTAL, },
    headerButton: { paddingHorizontal: 15, paddingVertical: 10, },
    headerButtonTextCancel: { color: '#000', fontSize: 16, },
    tabContainer: { flexDirection: 'row', marginTop: 15, marginBottom: 20, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#ccc', },
    tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', },
    activeTabButton: { backgroundColor: '#000', },
    tabButtonText: { fontSize: 15, fontWeight: '500', color: '#000', },
    activeTabButtonText: { color: '#fff', fontWeight: 'bold', },
    inputAreaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 5, marginBottom: 25, },
    inputIconContainer: { width: ICON_CONTAINER_SIZE, height: ICON_CONTAINER_SIZE, borderRadius: ICON_CONTAINER_SIZE / 2, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginRight: 10, },
    inputIconPlaceholder: { width: ICON_SIZE + 5, height: ICON_SIZE + 5, },
    categoryNameInput: { flex: 1, height: 45, fontSize: 16, color: '#333', backgroundColor: 'transparent', },
    iconGridContainer: { paddingBottom: 30, },
    iconGroupHeader: { marginBottom: 15, marginTop: 10, },
    iconGroupHeaderText: { fontSize: 17, fontWeight: 'bold', color: '#333', },
    iconGridRowContainer: { flexDirection: 'row', flexWrap: 'wrap', },
    iconItemContainer: { alignItems: 'center', marginRight: ICON_ITEM_MARGIN, marginBottom: ICON_ITEM_MARGIN },
    iconCircle: { width: ICON_CONTAINER_SIZE, height: ICON_CONTAINER_SIZE, borderRadius: ICON_CONTAINER_SIZE / 2, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', },
    selectedIconCircle: { backgroundColor: '#FFD700', borderColor: '#FFD700', },
});