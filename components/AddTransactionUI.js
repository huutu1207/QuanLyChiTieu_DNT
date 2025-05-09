// components/AddTransactionUI.js
import { useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Hằng số cho nút "Thêm mới"
const ADD_NEW_CATEGORY_ITEM = { id: 'add', name: 'Thêm mới', icon: '+' };

const NUM_COLUMNS = 4;
const SCREEN_WIDTH = Dimensions.get('window').width;

const AddTransactionUI = ({
  initialTab = 'Chi tiêu',
  expenseCategories = [], // Mặc định là mảng rỗng
  incomeCategories = [],  // Mặc định là mảng rỗng
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
    const isAddButton = item.id === 'add'; // Kiểm tra dựa trên id 'add'
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => {
          if (isAddButton && onNewCategoryPress) {
            onNewCategoryPress({ type: activeTab }); // Gửi kèm loại tab (Chi tiêu/Thu nhập)
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
  const renderExpenseContent = () => {
    // Thêm nút "Thêm mới" vào cuối danh sách danh mục chi tiêu
    const dataToRender = [...expenseCategories, ADD_NEW_CATEGORY_ITEM];
    if (expenseCategories.length === 0) {
        // Nếu không có danh mục nào, chỉ hiển thị nút thêm mới
        // Hoặc bạn có thể hiển thị một thông báo "Chưa có danh mục nào"
        return (
            <FlatList
                data={[ADD_NEW_CATEGORY_ITEM]}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => `expense-${item.id}`}
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.categoryList}
                ListEmptyComponent={<Text style={styles.emptyListText}>Chưa có danh mục chi tiêu. Hãy thêm mới!</Text>}
            />
        );
    }
    return (
        <FlatList
            data={dataToRender}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => `expense-${item.id}`}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.categoryList}
        />
    );
  };

  // Hàm render nội dung cho tab "Thu nhập" (sử dụng FlatList)
  const renderIncomeContent = () => {
    // Thêm nút "Thêm mới" vào cuối danh sách danh mục thu nhập
    const dataToRender = [...incomeCategories, ADD_NEW_CATEGORY_ITEM];
     if (incomeCategories.length === 0) {
        return (
            <FlatList
                data={[ADD_NEW_CATEGORY_ITEM]}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => `income-${item.id}`}
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.categoryList}
                ListEmptyComponent={<Text style={styles.emptyListText}>Chưa có danh mục thu nhập. Hãy thêm mới!</Text>}
            />
        );
    }
    return (
        <FlatList
            data={dataToRender}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => `income-${item.id}`} // Key riêng cho thu nhập
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.categoryList}
        />
    );
  };


  // Hàm chính để render nội dung của tab đang active
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'Chi tiêu':
        return renderExpenseContent();
      case 'Thu nhập':
        return renderIncomeContent();
      default:
        // Có thể render một placeholder hoặc một ScrollView đơn giản nếu không có tab nào khớp
        return (
            <ScrollView style={styles.scrollViewForSimpleContent}>
                <View style={styles.contentContainer}>
                    <Text>Vui lòng chọn một tab.</Text>
                </View>
            </ScrollView>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderTabs()}
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
    backgroundColor: '#FFD700', // Màu vàng cho tab bar
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
    borderBottomColor: '#333', // Màu đen cho tab đang active
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555', // Màu xám đậm cho chữ tab không active
  },
  activeTabText: {
    color: '#000', // Màu đen cho chữ tab active
    fontWeight: 'bold',
  },
  tabContentContainer: {
    flex: 1, // Đảm bảo nội dung tab chiếm hết không gian còn lại
  },
  scrollViewForSimpleContent: {
    flex: 1,
  },
  contentContainer: { // Dùng cho nội dung đơn giản trong ScrollView
    padding: 20,
    alignItems: 'center',
  },
  categoryList: {
    paddingHorizontal: 8, // Padding ngang cho toàn bộ lưới
    paddingTop: 16,
    paddingBottom: 16, // Quan trọng để có khoảng trống ở cuối FlatList
  },
  categoryItem: {
    // Tính toán chiều rộng dựa trên số cột và padding/margin
    // (SCREEN_WIDTH - tổngPaddingNgangCuaList) / số_cột - tổngMarginNgangCuaItem
    width: (SCREEN_WIDTH - 16) / NUM_COLUMNS - 10, // 16 là paddingHorizontal*2, 10 là marginHorizontal*2
    alignItems: 'center',
    marginBottom: 20, // Khoảng cách dọc giữa các item
    marginHorizontal: 5, // Khoảng cách ngang giữa các item
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28, // Làm cho nó tròn
    backgroundColor: '#f0f0f0', // Màu nền xám nhạt cho icon
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // Khoảng cách từ icon đến tên
    elevation: 2, // Thêm đổ bóng nhẹ cho Android
    shadowColor: '#000', // Thêm đổ bóng cho iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  addButtonIconContainer: {
    backgroundColor: '#e0e0e0', // Màu nền khác cho nút "Thêm mới"
  },
  iconText: {
    fontSize: 26, // Kích thước icon emoji
  },
  addButtonIconText: {
    fontSize: 30, // Kích thước icon "+"
    color: '#555', // Màu cho icon "+"
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333', // Màu chữ cho tên danh mục
    height: 30, // Giới hạn chiều cao để đảm bảo các item có cùng kích thước nếu tên quá dài
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

export default AddTransactionUI;

