import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../components/StylesChart';

import ExpenseChartsApp, { generateChartData as generateChartDataApp } from '../../components/ExpenseChartsApp';
import ExpenseChartsWeb, { generateChartData as generateChartDataWeb } from '../../components/ExpenseChartsWeb';

import { onValue, ref } from 'firebase/database';
import { database as db } from '../../firebaseConfig'; // Đảm bảo import đúng config Firebase

const ExpenseCharts = Platform.OS === 'web' ? ExpenseChartsWeb : ExpenseChartsApp;
const generateChartData = Platform.OS === 'web' ? generateChartDataWeb : generateChartDataApp;


export { ExpenseCharts, generateChartData };

const ChartScreen = () => {
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [monthPageIndex, setMonthPageIndex] = useState(0);
  const MONTHS_PER_PAGE = 6;
  const hasScrolledToEnd = useRef(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  // Dữ liệu chi tiêu từ Firebase
  const [categoryExpenses, setCategoryExpenses] = useState({});

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setCategoryExpenses({}) // Xóa dữ liệu expenses nếu người dùng đăng xuất
      }
    });
    return () => unsubscribeAuth(); // Cleanup listener của auth
  }, []);
  // Lấy dữ liệu từ Firebase
  // Lấy dữ liệu chi tiêu từ Firebase và parse lại
useEffect(() => {
  if (!currentUserId) {
    // Nếu chưa có UID, không làm gì cả hoặc reset expenses
    setCategoryExpenses({})
    return;
  }

  const userExpensesRef = ref(db, `users/${currentUserId}/transactions`);
  
  const unsubscribeDB = onValue(userExpensesRef, (snapshot) => {
    const data = snapshot.val();
    const parsed = {};

    if (data) {
      Object.entries(data).forEach(([expenseId, itemData]) => {
        // Đảm bảo mỗi item có các trường cần thiết
        if (itemData.date && itemData.amount != null) {
          const dateObj = new Date(itemData.date); // Chuyển đổi date string hoặc timestamp thành Date
          const monthKey = getMonthKey(dateObj); // Tạo monthKey từ ngày tháng

          // Nếu chưa có tháng này trong parsed, khởi tạo
          if (!parsed[monthKey]) parsed[monthKey] = [];

          parsed[monthKey].push({
            id: expenseId, // Dùng ID giao dịch từ Firebase làm id
            description: itemData.note ||'N/A', // Ghi chú hoặc tên danh mục
            amount: itemData.amount,
            categoryIcon: itemData.categoryIcon, // Icon danh mục (nếu cần)
            categoryId: itemData.categoryId,
            categoryName: itemData.categoryName,// ID danh mục (nếu cần)
            transactionType: itemData.transactionType, // Loại giao dịch (nếu cần)
            date: itemData.date // Thêm ngày tháng vào mỗi giao dịch
          });
        }
      });
    }

    setCategoryExpenses(parsed);
  });

  return () => unsubscribeDB(); // Cleanup listener của database
}, [currentUserId, db]);

  

  const getMonthKey = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      const now = new Date();
      return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const initialCurrentMonthKey = getMonthKey(new Date());
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(initialCurrentMonthKey);

  const scrollViewRef = useRef(null);
  const monthItemRefs = useRef({});

  const getMonthLabel = (monthKey) => {
    const now = new Date();
    const [year, month] = monthKey.split('-').map(Number);
    const d = new Date(year, month - 1);
    const current = new Date(now.getFullYear(), now.getMonth());
    const previous = new Date(now.getFullYear(), now.getMonth() - 1);

    if (d.getFullYear() === current.getFullYear() && d.getMonth() === current.getMonth()) return 'Tháng này';
    if (d.getFullYear() === previous.getFullYear() && d.getMonth() === previous.getMonth()) return 'Tháng trước';

    return `Thg ${d.getMonth() + 1} Năm ${d.getFullYear()}`;
  };
  
  const getPastMonths = (numMonths) => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < numMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i);
      result.push(getMonthKey(d));
    }
    return result;
  };


  // Reset về trang đầu khi dữ liệu hoặc chế độ thay đổi
  useEffect(() => {
    setMonthPageIndex(0);
  }, [categoryExpenses]);
  
  const pagedMonths = () => {
    const start = monthPageIndex * MONTHS_PER_PAGE;
    const end = start + MONTHS_PER_PAGE;
    return allTimePeriods.slice(start, end);  // Không cần đảo ngược
  };
  const allTimePeriods = getPastMonths(60); // 5 năm = 60 tháng

  const canGoPrev = monthPageIndex > 0;
  const canGoNext = (monthPageIndex + 1) * MONTHS_PER_PAGE < allTimePeriods.length;

  const getExpensesForPeriod = (periodKey) => {
    if (periodKey === 'Tháng này') return categoryExpenses[getMonthKey(new Date())] || [];
    if (periodKey === 'Tháng trước') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return categoryExpenses[getMonthKey(d)] || [];
    }
    return categoryExpenses[periodKey] || [];
  };

  const selectedExpenses = getExpensesForPeriod(selectedTimePeriod);

  const handlePeriodChange = (periodKey) => {
    setSelectedTimePeriod(periodKey);
    setShowChart(false);
    setChartData(null);
  };

  useEffect(() => {
    if (Platform.OS === 'web' && scrollViewRef.current && !hasScrolledToEnd.current) {
      const timeout = setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: false });
        hasScrolledToEnd.current = true;
      }, 300); // Delay để đảm bảo render xong

      return () => clearTimeout(timeout);
    }
  }, [categoryExpenses]);

  
  // Scroll tự động tới tháng đã chọn (chỉ app, không áp dụng web)
  useEffect(() => {
    if (Platform.OS !== 'web' ) {
      const timeout = setTimeout(() => {
        const selectedRef = monthItemRefs.current[selectedTimePeriod];
        if (selectedRef && scrollViewRef.current) {
          selectedRef.measureLayout(
            scrollViewRef.current,
            (x) => {
              scrollViewRef.current.scrollTo({ x: x - 100, animated: true });
            },
            () => {}
          );
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [selectedTimePeriod]);

  const groupedExpenses = selectedExpenses.reduce((acc, expense) => {
    if (expense.transactionType !== 'expense') return acc;  // Bỏ qua các giao dịch không phải chi tiêu

    const categoryName = expense.categoryName === 'N/A' ? 'Không rõ' : expense.categoryName;  // Xử lý trường hợp 'N/A'

    // Nếu categoryName chưa có trong acc, khởi tạo một mảng mới
    if (!acc[categoryName]) {
      acc[categoryName] = 0;
    }

    // Cộng dồn amount vào categoryName tương ứng
    acc[categoryName] += expense.amount;

    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Chi tiêu</Text>
          </View>
        </View>
        <View style={styles.timePeriodControls}>
          {Platform.OS === 'web' ? (
            <View style={styles.webMonthPagination}>
              <TouchableOpacity
                onPress={() => setMonthPageIndex(prev => Math.max(0, prev - 1))}
                disabled={!canGoPrev}
                style={[styles.arrowButton, !canGoPrev && styles.arrowDisabled]}
              >
                <Text style={styles.arrowText}>◀</Text>
              </TouchableOpacity>

              <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timePeriodRow}>
                  {pagedMonths().map((period, index) => {
                    const label = getMonthLabel(period);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.timePeriodItem, selectedTimePeriod === period && styles.timePeriodItemActive]}
                        onPress={() => handlePeriodChange(period)}
                      >
                        <Text style={[styles.timePeriodText, selectedTimePeriod === period && styles.timePeriodTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              <TouchableOpacity
                onPress={() => setMonthPageIndex(prev => prev + 1)}
                disabled={!canGoNext}
                style={[styles.arrowButton, !canGoNext && styles.arrowDisabled]}
              >
                <Text style={styles.arrowText}>▶</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timePeriodRow}>
                {allTimePeriods.map((period, index) => {
                  const label = getMonthLabel(period);
                  return (
                    <TouchableOpacity
                      key={index}
                      ref={(el) => {
                        if (el) monthItemRefs.current[period] = el;
                      }}
                      style={[styles.timePeriodItem, selectedTimePeriod === period && styles.timePeriodItemActive]}
                      onPress={() => handlePeriodChange(period)}
                    >
                      <Text style={[styles.timePeriodText, selectedTimePeriod === period && styles.timePeriodTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
        <View style={styles.contentArea}>
          {Object.entries(groupedExpenses).map(([categoryName, totalAmount]) => (
            <View key={categoryName} style={styles.expenseItem}>
              <Text style={styles.expenseText}>
                {categoryName}: {totalAmount} VNĐ
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.chartButton}
            onPress={() => {
              const currentSelectedDate = new Date(selectedTimePeriod);
              const year = currentSelectedDate.getFullYear();
              const month = currentSelectedDate.getMonth() + 1; // getMonth() từ 0-11, nên +1

              const chart = generateChartData(selectedExpenses, year, month);
              setChartData(chart);
              setShowChart(true);
            }}
          >
            <Text style={styles.chartButtonText}>Xem biểu đồ</Text>
          </TouchableOpacity>

          <Modal
            visible={showChart}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowChart(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                {chartData ? <ExpenseCharts chartData={chartData} /> : null}
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowChart(false)}>
                  <Text style={styles.closeButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChartScreen;
