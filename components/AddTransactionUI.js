// components/AddTransactionUI.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView, // Vẫn giữ ScrollView cho các tab không dùng FlatList
  FlatList,
  Dimensions,
} from 'react-native';

// Dữ liệu tĩnh cho các danh mục chi tiêu (sau sẽ thông qua csdl)
const defaultExpenseCategories = [
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

const NUM_COLUMNS = 4;
const SCREEN_WIDTH = Dimensions.get('window').width;

const AddTransactionUI = ({
  initialTab = 'Chi tiêu',
  expenseCategories = defaultExpenseCategories,
  onCategorySelect,
  onNewCategoryPress,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Hàm render các tab lựa chọn (Chi tiêu, Thu nhập)
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {['Chi tiêu', 'Thu nhập'].map((tabName) => (
        <TouchableOpacity
          key={tabName}
          style={[
            styles.tabItem,
            activeTab === tabName && styles.activeTabItem,
          ]}
          onPress={() => setActiveTab(tabName)}>
          <Text
            style={[
              styles.tabText,
              activeTab === tabName && styles.activeTabText,
            ]}>
            {tabName}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Hàm render một mục danh mục trong lưới
  const renderCategoryItem = ({ item }) => {
    const isAddButton = item.icon === '+';
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => {
          if (isAddButton && onNewCategoryPress) {
            onNewCategoryPress({ type: activeTab });
          } else if (!isAddButton && onCategorySelect) {
            onCategorySelect({ ...item, transactionType: activeTab });
          }
        }}>
        <View style={[
            styles.iconContainer,
            isAddButton && styles.addButtonIconContainer
        ]}>
          <Text style={[styles.iconText, isAddButton && styles.addButtonIconText]}>{item.icon}</Text>
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  // Hàm render nội dung cho tab "Chi tiêu" (sử dụng FlatList)
  const renderExpenseContent = () => (
    <FlatList
      data={expenseCategories}
      renderItem={renderCategoryItem}
      keyExtractor={(item) => `expense-${item.id}`} // Đảm bảo key là duy nhất
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.categoryList}
    />
  );

  // Hàm render nội dung cho tab "Thu nhập"
  const renderIncomeContent = () => (
    // Dungf view cuộn
    <ScrollView style={styles.scrollViewForSimpleContent}>
      <View style={styles.contentContainer}>
        <Text>Giao diện nhập Thu nhập (chưa triển khai)</Text>
      </View>
    </ScrollView>
  );


  // Hàm chính để render nội dung của tab đang active
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'Chi tiêu':
        return renderExpenseContent(); // Trả về FlatList trực tiếp
      case 'Thu nhập':
        return renderIncomeContent(); // Trả về ScrollView bọc nội dung
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderTabs()}
      {/* View này sẽ chứa nội dung của tab, đảm bảo FlatList có không gian để mở rộng */}
      <View style={styles.tabContentContainer}>
        {renderActiveTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#333',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  // Container cho nội dung của tab, đảm bảo nó chiếm không gian còn lại
  tabContentContainer: {
    flex: 1,
  },
  // Style cho ScrollView khi nội dung tab đơn giản (không phải FlatList)
  scrollViewForSimpleContent: {
    flex: 1, // Đảm bảo ScrollView cũng chiếm không gian
  },
  // Style cho View bên trong ScrollView (nếu cần padding chung)
  contentContainer: {
    padding: 20,
    alignItems: 'center', // Hoặc tùy chỉnh theo layout của bạn
  },
  // Style cho FlatList (danh sách danh mục)
  categoryList: {
    paddingHorizontal: 8,
    paddingTop: 16,
    // paddingBottom quan trọng nếu bạn muốn có khoảng trống ở cuối FlatList
    paddingBottom: 16,
  },
  categoryItem: {
    width: (SCREEN_WIDTH - 16) / NUM_COLUMNS - 10, // (SCREEN_WIDTH - paddingNgangCuaList*2) / số_cột - marginNgangCuaItem*2
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButtonIconContainer: {
    backgroundColor: '#e0e0e0',
  },
  iconText: {
    fontSize: 26,
  },
  addButtonIconText: {
    fontSize: 30,
    color: '#555',
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    height: 30,
  },
});

export default AddTransactionUI;
