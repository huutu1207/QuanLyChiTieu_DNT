// app/category-settings.js
import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // Ví dụ sử dụng icons

// Dữ liệu mẫu (nên được thay thế bằng dữ liệu thực tế)
const MOCK_EXPENSE_CATEGORIES = [
  { id: '1', name: 'Mua sắm', icon: 'cart-outline', type: 'expense' },
  { id: '2', name: 'Đồ ăn', icon: 'restaurant-outline', type: 'expense' },
  { id: '3', name: 'Điện thoại', icon: 'call-outline', type: 'expense' },
  { id: '4', name: 'Giải trí', icon: 'game-controller-outline', type: 'expense' },
  // ... thêm các danh mục khác
];

const MOCK_INCOME_CATEGORIES = [
  { id: '101', name: 'Lương', icon: 'cash-outline', type: 'income' },
  { id: '102', name: 'Thưởng', icon: 'gift-outline', type: 'income' },
  // ... thêm các danh mục khác
];


export default function CategorySettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Lấy params được truyền qua route

  const [activeTab, setActiveTab] = useState(params.type === 'income' ? 'income' : 'expense');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories(activeTab);
  }, [activeTab]);

  const loadCategories = async (type) => {
    // TODO: Implement logic để load danh mục từ storage/API
    console.log(`Đang tải danh mục cho: ${type}`);
    if (type === 'expense') {
      setCategories(MOCK_EXPENSE_CATEGORIES);
    } else if (type === 'income') {
      setCategories(MOCK_INCOME_CATEGORIES);
    } else {
      setCategories([]);
    }
  };

  const handleDeleteCategory = (categoryId) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa danh mục này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            // TODO: Implement logic xóa danh mục khỏi storage/API
            setCategories(prevCategories => prevCategories.filter(cat => cat.id !== categoryId));
            console.log('Đã xóa danh mục:', categoryId);
          }
        }
      ]
    );
  };

  const handleEditCategory = (category) => {
    router.push({
      pathname: '/edit-category-form', // Bạn cần tạo route và màn hình này
      params: { ...category, currentTab: activeTab }
    });
  };

  const renderCategoryItem = ({ item }) => (
    <View style={styles.categoryItemContainer}>
      <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} style={styles.actionButton}>
        <MaterialIcons name="remove-circle-outline" size={24} color="red" />
      </TouchableOpacity>
      <View style={styles.categoryInfo}>
        <Ionicons name={item.icon || 'list-outline'} size={24} color="#555" style={styles.categoryIcon} />
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      <TouchableOpacity onPress={() => handleEditCategory(item)} style={styles.actionButton}>
        <MaterialIcons name="drag-handle" size={24} color="#888" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'Cài đặt danh mục',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: Platform.OS === 'ios' ? 10: 0, padding: 5}}>
              <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFD700' }, // Màu vàng cho header
          headerTintColor: '#333', // Màu chữ header và icon nút back
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

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyListText}>Không có danh mục nào.</Text>}
      />

      <TouchableOpacity
        style={styles.addCategoryButton}
        onPress={() => {
          router.push({ pathname: '/create-category-form', params: { type: activeTab } });
        }}>
        <Ionicons name="add-circle" size={28} color="#fff" />
        <Text style={styles.addCategoryButtonText}>Thêm danh mục</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Màu nền chung cho phần dưới tab
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFD700', // Nền vàng cho cả dải tab
  },
  tabItem: { // Style cho cả tab active và inactive
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700', // Nền vàng cho các tab
    borderBottomWidth: 3, // Gạch chân mặc định
    borderBottomColor: 'transparent', // Gạch chân trong suốt cho tab không active
  },
  activeTabItem: { // Chỉ định nghĩa những gì khác biệt cho tab active
    // backgroundColor: '#FFD700', // Không cần ghi đè backgroundColor nếu giống tabItem
    borderBottomColor: '#333', // Gạch chân màu đen cho tab active
  },
  tabText: { // Chữ cho tab inactive
    fontSize: 16,
    fontWeight: '500',
    color: '#555', // Màu chữ xám cho tab không active
  },
  activeTabText: { // Chữ cho tab active
    color: '#000', // Màu chữ đen cho tab active
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    // marginTop: 5, // Bỏ marginTop nếu muốn danh sách sát tab hơn
    backgroundColor: '#fff', // Nền trắng cho phần danh sách danh mục
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
  categoryIcon: {
    marginRight: 15,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    padding: 5,
  },
  addCategoryButton: {
    flexDirection: 'row',
    backgroundColor: '#FFB300',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addCategoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#777',
  },
});
