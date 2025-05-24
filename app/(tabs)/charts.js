import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import ExpenseChartsApp, { generateChartData as generateChartDataApp } from '../../components/ExpenseChartsApp';
import ExpenseChartsWeb, { generateChartData as generateChartDataWeb } from '../../components/ExpenseChartsWeb';
import { styles } from '../../components/StylesChart';

import { onValue, ref } from 'firebase/database';
import { database as db } from '../../firebaseConfig';

const ExpenseCharts = Platform.OS === 'web' ? ExpenseChartsWeb : ExpenseChartsApp;
const generateChartData = Platform.OS === 'web' ? generateChartDataWeb : generateChartDataApp;

const ChartScreen = () => {
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [monthPageIndex, setMonthPageIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [categoryExpenses, setCategoryExpenses] = useState({});
  const MONTHS_PER_PAGE = 6;

  const scrollViewRef = useRef(null);
  const monthItemRefs = useRef({});
  const hasScrolledToEnd = useRef(false);

  // Lấy user hiện tại từ Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setCategoryExpenses({});
        setShowChart(false);
        setChartData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Lấy dữ liệu chi tiêu từ Firebase
  useEffect(() => {
    if (!currentUserId) return;

    const userExpensesRef = ref(db, `users/${currentUserId}/transactions`);
    const unsubscribe = onValue(userExpensesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = {};

      Object.entries(data).forEach(([id, item]) => {
        if (item.date && item.amount != null) {
          const dateObj = new Date(item.date);
          const monthKey = getMonthKey(dateObj);

          if (!parsed[monthKey]) parsed[monthKey] = [];
          parsed[monthKey].push({
            id,
            description: item.note || 'N/A',
            amount: item.amount,
            categoryIcon: item.categoryIcon,
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            transactionType: item.transactionType,
            date: item.date
          });
        }
      });

      setCategoryExpenses(parsed);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const getMonthKey = (date) => {
    const validDate = date instanceof Date && !isNaN(date) ? date : new Date();
    return `${validDate.getFullYear()}-${String(validDate.getMonth() + 1).padStart(2, '0')}`;
  };

  const initialMonth = getMonthKey(new Date());
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(initialMonth);

  const getMonthLabel = (monthKey) => {
    const now = new Date();
    const [y, m] = monthKey.split('-').map(Number);
    const d = new Date(y, m - 1);
    const current = new Date(now.getFullYear(), now.getMonth());
    const previous = new Date(now.getFullYear(), now.getMonth() - 1);

    if (d.getTime() === current.getTime()) return 'Tháng này';
    if (d.getTime() === previous.getTime()) return 'Tháng trước';

    return `Thg ${m} Năm ${y}`;
  };

  const getPastMonths = (count) => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i);
      months.push(getMonthKey(d));
    }
    return months;
  };

  const allTimePeriods = getPastMonths(60); // 5 năm
  const pagedMonths = () => {
    const start = monthPageIndex * MONTHS_PER_PAGE;
    return allTimePeriods.slice(start, start + MONTHS_PER_PAGE);
  };

  const canGoPrev = monthPageIndex > 0;
  const canGoNext = (monthPageIndex + 1) * MONTHS_PER_PAGE < allTimePeriods.length;

  const handlePeriodChange = (key) => {
    setSelectedTimePeriod(key);
    setShowChart(false);
    setChartData(null);
  };

  const selectedExpenses = categoryExpenses[selectedTimePeriod] || [];

  useEffect(() => {
    setMonthPageIndex(0);
  }, [categoryExpenses]);

  // Auto scroll tháng hiện tại trên web
  useEffect(() => {
    if (Platform.OS === 'web' && scrollViewRef.current && !hasScrolledToEnd.current) {
      const timeout = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd?.({ animated: false });
        hasScrolledToEnd.current = true;
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [pagedMonths().join(',')]);

  // Auto scroll đến tháng đang chọn trên mobile
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const timeout = setTimeout(() => {
        const selectedRef = monthItemRefs.current[selectedTimePeriod];
        if (selectedRef && scrollViewRef.current?.scrollTo) {
          selectedRef.measureLayout(
            scrollViewRef.current,
            (x) => scrollViewRef.current.scrollTo({ x: x - 100, animated: true }),
            () => {}
          );
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [selectedTimePeriod]);

  const groupedExpenses = selectedExpenses.reduce((acc, item) => {
    if (item.transactionType !== 'expense') return acc;
    const name = item.categoryName || 'Không rõ';
    acc[name] = (acc[name] || 0) + item.amount;
    return acc;
  }, {});
const categoryIconsMap = {};
selectedExpenses.forEach(item => {
  if (item.transactionType === 'expense' && item.categoryName && item.categoryIcon) {
    categoryIconsMap[item.categoryName] = item.categoryIcon;
  }
});

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
                disabled={!canGoPrev}
                style={[styles.arrowButton, !canGoPrev && styles.arrowDisabled]}
                onPress={() => setMonthPageIndex(p => Math.max(p - 1, 0))}
              >
                <Text style={styles.arrowText}>◀</Text>
              </TouchableOpacity>

              <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timePeriodRow}>
                  {pagedMonths().map((monthKey, i) => (
                    <TouchableOpacity
                      key={monthKey}
                      style={[styles.timePeriodItem, selectedTimePeriod === monthKey && styles.timePeriodItemActive]}
                      onPress={() => handlePeriodChange(monthKey)}
                    >
                      <Text style={[styles.timePeriodText, selectedTimePeriod === monthKey && styles.timePeriodTextActive]}>
                        {getMonthLabel(monthKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                disabled={!canGoNext}
                style={[styles.arrowButton, !canGoNext && styles.arrowDisabled]}
                onPress={() => setMonthPageIndex(p => Math.min(p + 1, Math.floor(allTimePeriods.length / MONTHS_PER_PAGE)))}
              >
                <Text style={styles.arrowText}>▶</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timePeriodRow}>
                {allTimePeriods.map((monthKey) => (
                  <TouchableOpacity
                    key={monthKey}
                    ref={el => el && (monthItemRefs.current[monthKey] = el)}
                    style={[styles.timePeriodItem, selectedTimePeriod === monthKey && styles.timePeriodItemActive]}
                    onPress={() => handlePeriodChange(monthKey)}
                  >
                    <Text style={[styles.timePeriodText, selectedTimePeriod === monthKey && styles.timePeriodTextActive]}>
                      {getMonthLabel(monthKey)}
                    </Text>
                  </TouchableOpacity>
                  
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.contentArea}>
          {Object.entries(groupedExpenses).length ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                {Object.entries(groupedExpenses).map(([name, amount]) => (
                  <View key={name} style={styles.expenseItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={categoryIconsMap[name] || 'help-outline'} size={20} color="#666" style={{ marginRight: 8 }} />
                      <Text style={styles.expenseText}>
                        {name}: {amount.toLocaleString('vi-VN')} VNĐ
                      </Text>
                    </View>
                  </View>

                ))}
              </View>

              {/* Switch bật/tắt biểu đồ ở bên phải */}
              <View style={{ marginLeft: 20, alignItems: 'center', justifyContent: 'center' }}>
                {chartData && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ marginRight: 10 }}>Hiện biểu đồ</Text>
                    <Switch value={showChart} onValueChange={setShowChart} />
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <Ionicons name="stats-chart-outline" size={48} color="#AAAAAA" />
              <Text style={{ color: '#AAAAAA', fontSize: 16, marginTop: 10 }}>
                Không có dữ liệu chi tiêu cho tháng này.
              </Text>
            </View>
          )}


          

          {/* Hiển thị biểu đồ */}
          {chartData && showChart && (
            <View style={styles.chartDisplayArea}>
              <ExpenseCharts chartData={chartData} />
            </View>
          )}
          {/* Nút Xem/Cập nhật biểu đồ vẫn ở dưới */}
          {Object.entries(groupedExpenses).length > 0 && (
            <TouchableOpacity
              style={styles.chartButton}
              onPress={() => {
                if (!selectedExpenses.length) {
                  setShowChart(false);
                  alert("Không có dữ liệu chi tiêu để vẽ biểu đồ cho tháng này.");
                  return;
                }
                const [y, m] = selectedTimePeriod.split('-').map(Number);
                const chart = generateChartData(selectedExpenses, y, m);
                setChartData(chart);
                setShowChart(true);
              }}
            >
              <Text style={styles.chartButtonText}>
                {showChart && chartData ? "Cập nhật biểu đồ" : "Xem biểu đồ"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChartScreen;
