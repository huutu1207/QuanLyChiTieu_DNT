// app/(tabs)/index.js

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MonthYearPickerModal from '../../components/MonthYearPickerModal';
import SummarySection from '../../components/SummarySection';
// Import các hàm cần thiết từ Firebase Database và Auth
import { off, onValue, ref } from 'firebase/database';
import { database } from '../../firebaseConfig';
// Import onAuthStateChanged từ firebase/auth
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { format } from 'date-fns'; // Import date-fns để định dạng ngày
import { vi } from 'date-fns/locale'; // Import locale tiếng Việt
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const HomeScreen = () => {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Tháng trong JS là 0-11, nên cộng 1
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  // State để lưu trữ tất cả giao dịch của người dùng (trước khi lọc theo tháng/năm)
  const [allUserTransactions, setAllUserTransactions] = useState([]);
  // State để lưu trữ giao dịch đã lọc VÀ nhóm theo ngày
  const [groupedTransactions, setGroupedTransactions] = useState({}); // Sử dụng object để nhóm { 'YYYY-MM-DD': [trans1, trans2], ... }

  const [totalChiTieu, setTotalChiTieu] = useState(0);
  const [totalThuNhap, setTotalThuNhap] = useState(0);

  const [loadingTransactions, setLoadingTransactions] = useState(true); // State loading
  const [errorTransactions, setErrorTransactions] = useState(null); // State error
  const [authLoading, setAuthLoading] = useState(true); // State loading xác thực

  // Khởi tạo Auth
  const auth = getAuth();

  // Effect để lắng nghe trạng thái xác thực và tải giao dịch
  useEffect(() => {
    console.log("Auth state effect running...");
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log("onAuthStateChanged fired. User:", user ? user.uid : null);
      setAuthLoading(false);

      if (user) {
        const userId = user.uid;
        const transactionsRef = ref(database, `users/${userId}/transactions`);

        setLoadingTransactions(true);
        setErrorTransactions(null);

        console.log(`Starting to listen to transactions for user: ${userId}`);

        const unsubscribeData = onValue(transactionsRef, (snapshot) => {
          console.log("onValue fired. Snapshot exists:", snapshot.exists());
          const data = snapshot.val();
          if (data) {
            console.log("Raw transaction data from Firebase:", data);
            const transactionsArray = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            }));
            // Sắp xếp giao dịch theo ngày giảm dần để hiển thị cái mới nhất trước
            transactionsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log("Converted and sorted transactions array:", transactionsArray);
            setAllUserTransactions(transactionsArray);
            setErrorTransactions(null);
          } else {
            console.log("No transaction data found for user.");
            setAllUserTransactions([]);
          }
          setLoadingTransactions(false);
        }, (error) => {
          console.error("Lỗi khi lấy giao dịch từ Firebase: ", error);
          setErrorTransactions("Không thể tải giao dịch.");
          setLoadingTransactions(false);
        });

        return () => {
          console.log(`Unsubscribing from transactions for user: ${userId}`);
          off(transactionsRef, 'value', unsubscribeData);
        };

      } else {
        console.log("Người dùng chưa đăng nhập. Resetting transaction data.");
        setAllUserTransactions([]);
        setGroupedTransactions({}); // Reset groupedTransactions
        setLoadingTransactions(false);
        setErrorTransactions("Bạn cần đăng nhập để xem giao dịch.");
      }
    });

    return () => {
      console.log("Unsubscribing from auth state changes.");
      unsubscribeAuth();
    };
  }, [auth]);

  // Effect để lọc, nhóm giao dịch và tính toán tổng khi allUserTransactions hoặc tháng/năm thay đổi
  useEffect(() => {
    console.log("Filtering, grouping, and calculation effect running. Dependencies changed.");
    console.log("Current allUserTransactions:", allUserTransactions.length, "items");
    console.log("Selected Year:", selectedYear, "Selected Month:", selectedMonth);

    const filtered = allUserTransactions.filter(trans => {
      if (!trans.date || typeof trans.date !== 'string') {
        console.warn('Dữ liệu giao dịch có trường date không hợp lệ:', trans);
        return false;
      }
      const transDate = new Date(trans.date);
      if (isNaN(transDate.getTime())) {
        console.warn('Không thể parse date string:', trans.date, 'từ giao dịch:', trans);
        return false;
      }
      // Lọc theo tháng và năm đã chọn
      return transDate.getFullYear() === selectedYear && (transDate.getMonth() + 1) === selectedMonth;
    });

    console.log("Filtered transactions for selected month/year:", filtered.length, "items.", filtered);

    // Nhóm giao dịch đã lọc theo ngày
    const grouped = filtered.reduce((acc, trans) => {
      const dateKey = format(new Date(trans.date), 'yyyy-MM-dd'); // Sử dụng format để lấy key dạng 'YYYY-MM-DD'
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(trans);
      return acc;
    }, {});

    console.log("Grouped transactions:", grouped);
    setGroupedTransactions(grouped);

    // Tính toán tổng chi tiêu và thu nhập từ dữ liệu đã lọc (filtered)
    let chiTieu = 0;
    let thuNhap = 0;

    // console.log("Starting total calculation loop..."); // Bỏ bớt log này
    filtered.forEach(trans => {
      // console.log(`Processing transaction ID: ${trans.id}, Type: ${trans.transactionType}, Amount: ${trans.amount}, Typeof Amount: ${typeof trans.amount}`); // Bỏ bớt log này

      if (trans.transactionType === 'expense' && typeof trans.amount === 'number') { // Sử dụng 'expense'
        chiTieu += trans.amount;
      } else if (trans.transactionType === 'income' && typeof trans.amount === 'number') { // Sử dụng 'income'
        thuNhap += trans.amount;
      } else {
        // console.warn('Dữ liệu giao dịch có transactionType hoặc amount không hợp lệ hoặc thiếu:', trans);
      }
    });
    console.log("Total calculation loop finished.");
    console.log("Calculated totals - Chi tieu:", chiTieu, "Thu nhap:", thuNhap);
    setTotalChiTieu(chiTieu);
    setTotalThuNhap(thuNhap);


  }, [allUserTransactions, selectedYear, selectedMonth]); // Dependencies là allUserTransactions, selectedYear, selectedMonth


  const soDu = totalThuNhap - totalChiTieu;
  console.log("Calculated So Du:", soDu);


  const openMonthYearPicker = () => {
    setIsPickerVisible(true);
  };

  const handleMonthYearSelect = (year, month) => {
    console.log(`Month/Year selected: ${month}/${year}`);
    setSelectedYear(year);
    setSelectedMonth(month);
    setIsPickerVisible(false);
  };

  // Hàm tính tổng chi tiêu cho một ngày cụ thể
  const calculateDailyTotalExpense = (transactions) => {
    let dailyTotal = 0;
    transactions.forEach(trans => {
      if (trans.transactionType === 'expense' && typeof trans.amount === 'number') {
        dailyTotal += trans.amount;
      }
    });
    return dailyTotal;
  };


  // Hiển thị trạng thái loading hoặc lỗi
  if (authLoading) {
    return (
      <View style={styles.centeredMessage}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.loadingText}>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  if (errorTransactions) {
    return (
      <View style={styles.centeredMessage}>
        <Text style={styles.errorText}>{errorTransactions}</Text>
      </View>
    );
  }

  if (loadingTransactions) {
    return (
      <View style={styles.centeredMessage}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
      </View>
    );
  }
  const handleTransactionPress = (transaction) => {
    console.log("Navigating (Expo Router) to details for:", transaction.id);
    console.log("1. Dữ liệu gốc khi nhấn:", transaction)
    const jsonString = JSON.stringify(transaction);
    console.log("2. Dữ liệu sau khi JSON.stringify:", jsonString);
    router.push({
      pathname: '/transactionDetail', // Đường dẫn đến file app/transactionDetail.js
      params: { transactionData: jsonString } 
      
    });
  }
  // Lấy danh sách các ngày (keys của object groupedTransactions) và sắp xếp giảm dần
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));


  // Render UI chính
  return (
    <View style={styles.container}>
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
        {sortedDates.length === 0 ? ( // Kiểm tra nếu không có ngày nào có giao dịch trong tháng
          <View style={styles.noDataContainer}>
            {/* Sử dụng Ionicons thay cho MaterialCommunityIcons */}
            <Ionicons name="document-outline" size={80} color="#ccc" />

            <Text style={styles.noDataText}>Chưa có dữ liệu cho tháng này</Text>
          </View>
        ) : (
          // Duyệt qua từng ngày đã sắp xếp
          sortedDates.map(dateKey => {
            const transactionsForDay = groupedTransactions[dateKey];
            const date = new Date(dateKey); // Chuyển dateKey về Date object
            const formattedDate = format(date, 'dd MMMM EEEE', { locale: vi }); // Định dạng ngày (ví dụ: 12 tháng 5 Thứ hai)
            const dailyTotalExpense = calculateDailyTotalExpense(transactionsForDay); // Tính tổng chi tiêu ngày

            return (
              <View key={dateKey}>
                {/* Header ngày */}
                <View style={styles.dailySummaryHeader}>
                  <Text style={styles.dailyDateText}>{formattedDate}</Text>
                  {/* Hiển thị tổng chi tiêu ngày nếu có */}
                  {dailyTotalExpense > 0 && (
                    <Text style={styles.dailyTotalExpenseText}>Chi tiêu: {dailyTotalExpense.toLocaleString()} đ</Text>
                  )}
                </View>
                {/* Danh sách giao dịch trong ngày */}
                {transactionsForDay.map(transaction => (
                  <TouchableOpacity
                    key={transaction.id}
                    style={styles.transactionItem} // Giữ nguyên style cũ hoặc tạo style mới nếu cần
                    onPress={() => handleTransactionPress(transaction)} // Gọi hàm xử lý khi nhấn
                    activeOpacity={0.7} // Hiệu ứng mờ khi nhấn (tùy chọn)
                  >
                    {/* Nội dung bên trong giữ nguyên */}
                    <View style={styles.transactionLeft}>
                      <Ionicons
                        name={transaction.categoryIcon || 'cash-outline'}
                        size={20}
                        color="#555"
                        style={styles.categoryIcon}
                      />
                      <Text style={styles.categoryName}>{transaction.categoryName}</Text>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text style={[
                        styles.transactionAmount,
                        { color: transaction.transactionType === 'expense' ? 'red' : 'green' }
                      ]}>
                        {transaction.transactionType === 'expense' ? '-' : '+'}
                        {transaction.amount != null ? transaction.amount.toLocaleString() : '0'} đ
                      </Text>
                      {transaction.note ? <Text style={styles.transactionNote}>{transaction.note}</Text> : null}
                    </View>
                  </TouchableOpacity> // Đóng TouchableOpacity
                ))}
              </View>
            );
          })
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
    backgroundColor: '#f0f0f0',
  },
  mainContent: {
    flex: 1,
    paddingTop: 10,
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noDataText: {
    marginTop: 15,
    fontSize: 17,
    color: '#aaa',
  },
  // Style cho header ngày
  dailySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', // Nền cho header ngày
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 10, // Khoảng cách giữa các nhóm ngày
  },
  dailyDateText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  dailyTotalExpenseText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Style cho từng item giao dịch (giữ nguyên hoặc điều chỉnh nhẹ)
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    // Không cần marginHorizontal và marginBottom ở đây nếu đã có margin ở dailySummaryHeader
    // marginHorizontal: 10,
    // marginBottom: 8,
    // borderRadius: 8, // Bo góc có thể làm ở dailySummaryHeader hoặc bỏ đi
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.18,
    // shadowRadius: 1.00,
    // elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
    // Có thể thêm style cho nền icon nếu cần
    // backgroundColor: '#fff',
    // padding: 5,
    // borderRadius: 15,
  },
  categoryName: {
    fontSize: 16,
    // fontWeight: 'bold', // Bỏ bold để giống ảnh mẫu
    flexShrink: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionNote: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  }
});

export default HomeScreen;
