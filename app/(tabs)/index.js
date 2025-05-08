// app/(tabs)/index.js
import React, { useState, useEffect } from 'react'; // useEffect có thể cần nếu fetch data
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Hoặc react-native-vector-icons
import SummarySection from '../../components/SummarySection'
import MonthYearPickerModal from '../../components/MonthYearPickerModal'

const HomeScreen = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  // Dữ liệu giao dịch giả định (sẽ được fetch từ API hoặc state quản lý)
  const [transactions, setTransactions] = useState([]);
  const [totalChiTieu, setTotalChiTieu] = useState(0);
  const [totalThuNhap, setTotalThuNhap] = useState(0);

  // Ví dụ: useEffect để tính toán lại khi transactions thay đổi
  useEffect(() => {
    let chiTieu = 0;
    let thuNhap = 0;
    transactions.forEach(trans => {
      if (trans.type === 'expense') {
        chiTieu += trans.amount;
      } else if (trans.type === 'income') {
        thuNhap += trans.amount;
      }
    });
    setTotalChiTieu(chiTieu);
    setTotalThuNhap(thuNhap);
  }, [transactions]);


  const soDu = totalThuNhap - totalChiTieu;

  const openMonthYearPicker = () => {
    setIsPickerVisible(true);
  };

  const handleMonthYearSelect = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setIsPickerVisible(false);
  };

  const fetchTransactionsForCurrentMonth = () => {
      
      if (selectedMonth === 5 && selectedYear === 2025) {
          setTransactions([{id: '1', type: 'expense', amount: 75000, description: 'Mua sắm'}]); // Hoặc dữ liệu mẫu
      } else {
          setTransactions([]);
      }
  }

  useEffect(() => {
      fetchTransactionsForCurrentMonth();
  }, [selectedYear, selectedMonth]);


  return (
    <View style={styles.container}>
      {/* Gọi hàm từ components */}
      <SummarySection
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        totalChiTieu={totalChiTieu}
        totalThuNhap={totalThuNhap}
        soDu={soDu}
        onOpenPicker={openMonthYearPicker} 
      />

      {/* Main Content Area */}
      <ScrollView style={styles.mainContent}>
        {transactions.length === 0 ? (
          <View style={styles.noDataContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={80} color="#ccc" />
            <Text style={styles.noDataText}>Chưa có dữ liệu</Text>
          </View>
        ) : (
          transactions.map(transaction => ( // Sử dụng map để render danh sách
            <View key={transaction.id} style={styles.transactionItem}>
              <Text>{transaction.description}</Text>
              <Text style={{color: transaction.type === 'expense' ? 'red' : 'green'}}>
                {transaction.type === 'expense' ? '-' : '+'}
                {transaction.amount.toLocaleString()} đ
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      
      <MonthYearPickerModal
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onSelect={handleMonthYearSelect}
        initialYear={selectedYear}
        initialMonth={selectedMonth}
      />
  
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  mainContent: {
    flex: 1,
    // padding: 15, // Bỏ padding ở đây nếu các item con đã có margin/padding
  },
  noDataContainer: {
    flex: 1, // Để nó chiếm không gian còn lại nếu ScrollView không đủ nội dung
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50, // Tăng padding
  },
  noDataText: {
    marginTop: 15,
    fontSize: 17,
    color: '#aaa',
  },
  transactionItem: { // Style cho mỗi item giao dịch
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff', // Nền trắng cho từng item
    marginHorizontal: 10, // Thêm margin ngang
    marginTop: 8, // Thêm margin trên
    borderRadius: 8, // Bo góc item
    // Shadow cho item (tuỳ chọn)
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  }
});

export default HomeScreen;