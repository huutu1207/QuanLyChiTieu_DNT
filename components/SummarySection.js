// Giả sử bạn lưu file này là components/SummarySection.js

import React from 'react'; // 1. Import React
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'; // 2. Import View và Platform, sửa lại import Text
import { Ionicons } from '@expo/vector-icons'; // 3. Import Ionicons (điều chỉnh nếu bạn dùng thư viện khác)

// 4. Định nghĩa component đúng cách và nhận props
const SummarySection = (props) => {
  // 5. Truy cập các giá trị từ props
  const {
    selectedYear,
    selectedMonth,
    totalChiTieu,
    totalThuNhap,
    soDu,
    onOpenPicker // Đổi tên prop cho rõ ràng hơn so với openMonthYearPicker
  } = props;

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.dateSelector}>
        <Text style={styles.yearText}>{selectedYear}</Text>
        {/* 6. Sử dụng hàm onOpenPicker từ props */}
        <TouchableOpacity onPress={onOpenPicker} style={styles.monthButton}>
          <Text style={styles.monthText}>Thg {selectedMonth}</Text>
          <Ionicons name="caret-down" size={18} color="#333" />
        </TouchableOpacity>
      </View>
      <View style={styles.summaryDetails}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Chi tiêu</Text>
          <Text style={styles.summaryAmount}>{totalChiTieu.toLocaleString()} đ</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Thu nhập</Text>
          <Text style={styles.summaryAmount}>{totalThuNhap.toLocaleString()} đ</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Số dư</Text>
          <Text style={[styles.summaryAmount, styles.summaryAmountSoDu]}>{soDu.toLocaleString()} đ</Text>
        </View>
      </View>
    </View>
  );
};

// Định nghĩa styles
const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 15 : 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'center'
  },
  yearText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 5,
    color: '#333',
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 5,
    color: '#333',
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  summaryAmountSoDu: {
    color: '#2E8B57',
    fontWeight: 'bold',
  },
});

// 7. Export component đúng cách
export default SummarySection;