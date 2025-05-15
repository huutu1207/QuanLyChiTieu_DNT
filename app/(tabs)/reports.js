// app/(tabs)/report.js
import ReportDetails from '@/components/ReportDetails';
import { database } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { off, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../colors';

export default function ReportScreen() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyAnalysisData, setMonthlyAnalysisData] = useState({
    monthDisplay: `Thg ${selectedMonth}/${selectedYear}`,
    expenses: 0, income: 0, balance: 0, transactions: [],
    budgetAmount: 0, budgetSet: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
        setError(null);
        const userId = user.uid;
        const transactionsPath = `users/${userId}/transactions`;
        const budgetPath = `users/${userId}/budgets/${selectedYear}-${selectedMonth}`;
        const transactionsRefDb = ref(database, transactionsPath);
        const budgetMonthRefDb = ref(database, budgetPath);

        let transactionsDataCache = null;
        let budgetDataCache = null;

        const processCombinedData = () => {
          if (transactionsDataCache === null || budgetDataCache === null) {
            if (transactionsDataCache !== null && budgetDataCache === undefined) {
              // Budget node might not exist for the month, proceed with empty budget
              budgetDataCache = {}; // Ensure budgetDataCache is not undefined
            } else {
              return; // Wait for both data sources if transactions are also pending
            }
          }

          let allTransactions = [];
          if (transactionsDataCache) {
            allTransactions = Object.keys(transactionsDataCache).map(key => ({
              id: key, ...transactionsDataCache[key],
              amount: parseFloat(transactionsDataCache[key].amount) || 0,
            }));
          }

          const currentMonthTransactions = allTransactions.filter(t => {
            if (!t.date || typeof t.date !== 'string') return false;
            try {
              const d = new Date(t.date);
              return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
            } catch (e) {
              return false;
            }
          });

          let monthExpenses = 0, monthIncome = 0;
          currentMonthTransactions.forEach(t => {
            if (t.transactionType === 'expense') monthExpenses += t.amount;
            else if (t.transactionType === 'income') monthIncome += t.amount;
          });

          let calculatedTotalBudget = 0, isAnyBudgetSet = false;
          if (budgetDataCache && budgetDataCache.categories) {
            calculatedTotalBudget = Object.values(budgetDataCache.categories)
              .reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0);
            if (calculatedTotalBudget > 0) isAnyBudgetSet = true;
          } else if (budgetDataCache && budgetDataCache.totalAmount > 0) {
            calculatedTotalBudget = parseFloat(budgetDataCache.totalAmount) || 0;
            if (calculatedTotalBudget > 0) isAnyBudgetSet = true;
          }

          setMonthlyAnalysisData({
            monthDisplay: `Thg ${selectedMonth}/${selectedYear}`,
            expenses: monthExpenses, income: monthIncome, balance: monthIncome - monthExpenses,
            transactions: currentMonthTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            budgetAmount: calculatedTotalBudget, budgetSet: isAnyBudgetSet,
          });
          setLoading(false);
        };

        const transactionsListener = onValue(transactionsRefDb, (snapshot) => {
          transactionsDataCache = snapshot.val();
          if (budgetDataCache !== null) { // Ensure budget listener has had a chance to run once
            processCombinedData();
          }
        }, (err) => {
          setError("Lỗi tải giao dịch.");
          setLoading(false);
        });

        const budgetListener = onValue(budgetMonthRefDb, (snapshot) => {
          budgetDataCache = snapshot.val() || {};
          if (transactionsDataCache !== null) { // Ensure transaction listener has had a chance to run once
             processCombinedData();
          }
        }, (err) => {
          setError("Lỗi tải ngân sách.");
          setLoading(false);
        });

        return () => {
          off(transactionsRefDb, 'value', transactionsListener);
          off(budgetMonthRefDb, 'value', budgetListener);
        };
      } else {
        setMonthlyAnalysisData({
          monthDisplay: `Thg ${selectedMonth}/${selectedYear}`,
          expenses: 0, income: 0, balance: 0, transactions: [],
          budgetAmount: 0, budgetSet: false,
        });
        setLoading(false);
        setError("Vui lòng đăng nhập.");
      }
    });
    return () => authUnsubscribe();
  }, [auth, selectedYear, selectedMonth]);

  const handleMonthYearChange = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={[styles.mainHeader, { backgroundColor: COLORS.primaryAccent }]}>
        <View style={styles.mainHeaderLeftPlaceholder} />
        <Text style={[styles.mainHeaderTitle, { color: COLORS.black }]}>Thống kê hàng tháng</Text>
        <TouchableOpacity style={styles.mainHeaderRight}>
          <Text style={[styles.mainHeaderRightText, { color: COLORS.black }]}>Tất cả</Text>
          <Ionicons name="filter-outline" size={20} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryAccent} style={styles.centeredFeedback} />
      ) : error ? (
        <Text style={[styles.errorText, { color: COLORS.expense }]}>{error}</Text>
      ) : (
        <ReportDetails
          data={monthlyAnalysisData}
          type="analysis"
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onMonthYearChange={handleMonthYearChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 15 },
  mainHeaderLeftPlaceholder: { width: 60 },
  mainHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
  mainHeaderRight: { flexDirection: 'row', alignItems: 'center', width: 65, justifyContent: 'flex-end' },
  mainHeaderRightText: { marginRight: 5, fontSize: 13 },
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { textAlign: 'center', marginTop: 20, fontSize: 16, paddingHorizontal: 20, flex: 1 },
});