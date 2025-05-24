import MonthYearPickerModal from '@/components/MonthYearPickerModal';
import { database } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { off, onValue, ref } from 'firebase/database';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { COLORS } from './colors';

const BudgetItemCard = ({ title, iconName, budgetData, expensesForCategory, onEdit }) => {
  const currentCardColors = { surface: COLORS.surface, text: COLORS.text, textSecondary: COLORS.textSecondary, circleBackground: COLORS.border, circleProgress: budgetData?.amount > 0 && expensesForCategory > budgetData.amount ? COLORS.expense : COLORS.primaryAccent, circleText: COLORS.text, border: COLORS.border };
  const budgetAmount = budgetData?.amount || 0;
  const remainingBudget = budgetAmount - expensesForCategory;
  let progress = 0; if (budgetAmount > 0) progress = expensesForCategory / budgetAmount;
  const getCircleDisplayText = () => { if (budgetAmount === 0 && expensesForCategory === 0 && !budgetData?.hasOwnProperty('amount')) return "Sửa"; if (budgetAmount === 0) return "0%"; return `${Math.round(Math.min(1, progress) * 100)}%`; };
  const radius = 35, strokeWidth = 7, circumference = 2 * Math.PI * radius; const progressStrokeDashoffset = circumference - (Math.min(1, progress) * circumference);

  return (
    <View style={[styles.budgetItemCard, { backgroundColor: currentCardColors.surface, borderColor: currentCardColors.border }]}>
      <View style={styles.budgetItemHeader}>{iconName && <Ionicons name={iconName} size={20} color={currentCardColors.textSecondary} style={{ marginRight: 8 }} />}<Text style={[styles.budgetItemTitle, { color: currentCardColors.text }]}>{title}</Text>{onEdit && (<TouchableOpacity onPress={onEdit} style={styles.editButton}><Text style={[styles.editText, { color: currentCardColors.textSecondary }]}>Sửa</Text></TouchableOpacity>)}</View>
      <View style={styles.budgetItemContent}>
        <View style={styles.budgetCircleSmallContainer}>
          <Svg height="70" width="70" viewBox="0 0 84 84">
            <Circle
              cx="42"
              cy="42"
              r={radius}
              stroke={currentCardColors.circleBackground}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {budgetAmount > 0 && (
              <Circle
                cx="42"
                cy="42"
                r={radius}
                stroke={currentCardColors.circleProgress}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={progressStrokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 42 42)"
              />
            )}
            <SvgText
              x="42"
              y="48"
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill={currentCardColors.circleText}
            >
              {getCircleDisplayText()}
            </SvgText>
          </Svg>
        </View>
        <View style={styles.budgetInfoTextContainer}><View style={styles.budgetInfoItem}><Text style={[styles.budgetInfoLabel, { color: currentCardColors.textSecondary }]}>Còn lại :</Text><Text style={[styles.budgetInfoValue, { color: remainingBudget >= 0 ? COLORS.income : COLORS.expense }]}>{remainingBudget.toLocaleString()} đ</Text></View><View style={styles.budgetInfoItem}><Text style={[styles.budgetInfoLabel, { color: currentCardColors.textSecondary }]}>Ngân sách :</Text><Text style={[styles.budgetInfoValue, { color: currentCardColors.text }]}>{budgetAmount.toLocaleString()} đ</Text></View></View>
      </View>
    </View>
  );
};

export default function BudgetScreen() {
  const router = useRouter(); const params = useLocalSearchParams();
  const initialYear = params.year ? parseInt(String(params.year)) : new Date().getFullYear(); const initialMonth = params.month ? parseInt(String(params.month)) : new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(initialYear); const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [budgetData, setBudgetData] = useState(null); const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true); const [isPickerVisible, setIsPickerVisible] = useState(false);
  const auth = getAuth(); const user = auth.currentUser;

  const currentScreenColors = { background: COLORS.background, text: COLORS.text, headerSurface: COLORS.surface, border: COLORS.border, primaryAccent: COLORS.primaryAccent };

  useEffect(() => {
    if (!user) { setLoading(false); router.replace('/'); return; } setLoading(true);
    const budgetPath = `users/${user.uid}/budgets/${selectedYear}-${selectedMonth}`; const budgetRefDb = ref(database, budgetPath);
    const onBudgetChange = onValue(budgetRefDb, (s) => setBudgetData(s.val()), (e) => { console.error("E fetching budget:", e); setLoading(false); });
    const transactionsPath = `users/${user.uid}/transactions`; const transactionsRefDb = ref(database, transactionsPath);
    const onTransactionsChange = onValue(transactionsRefDb, (s) => { const all = []; s.forEach(cs => { try { const tv = cs.val(); if (tv && tv.date) { const d = new Date(tv.date); if (d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth) all.push({ id: cs.key, ...tv }); } } catch (e) { console.error("E processing transaction:", cs.val(), e); } }); setTransactions(all); setLoading(false); }, (e) => { console.error("E fetching transactions:", e); setLoading(false); });
    return () => { off(budgetRefDb, 'value', onBudgetChange); off(transactionsRefDb, 'value', onTransactionsChange); };
  }, [user, selectedYear, selectedMonth, router]);

  const totalMonthlyExpenses = useMemo(() => transactions.filter(t => t.transactionType === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0), [transactions]);
  const expensesByCategory = useMemo(() => { const catExp = {}; transactions.filter(t => t.transactionType === 'expense' && t.category).forEach(t => { catExp[t.category] = (catExp[t.category] || 0) + (parseFloat(t.amount) || 0); }); return catExp; }, [transactions]);
  const handleMonthYearChange = (y, m) => { setSelectedYear(y); setSelectedMonth(m); setIsPickerVisible(false); router.setParams({ year: String(y), month: String(m) }); };
  const navigateToSetup = () => router.push({ pathname: '/budgetSetupListScreen', params: { year: selectedYear, month: selectedMonth } });

  const overallBudgetDataFromCategories = useMemo(() => ({
    amount: budgetData?.categories ? Object.values(budgetData.categories).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0) : (budgetData?.totalAmount || 0)
  }), [budgetData]);

  const isBudgetDataEffectivelyEmpty = useMemo(() =>
    !budgetData ||
    (Object.keys(budgetData).length === 0) ||
    (!budgetData.totalAmount && (!budgetData.categories || Object.keys(budgetData.categories).length === 0)),
    [budgetData]);

  if (loading && !budgetData && transactions.length === 0) return <ActivityIndicator size="large" color={currentScreenColors.primaryAccent} style={{ flex: 1, justifyContent: 'center', backgroundColor: currentScreenColors.background }} />;

  return (
    <View style={[styles.container, { backgroundColor: currentScreenColors.background }]}>
      <Stack.Screen
        options={{
          title: 'Ngân sách',
          headerStyle: { backgroundColor: currentScreenColors.headerSurface },
          headerTintColor: currentScreenColors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          headerShadowVisible: Platform.OS === 'ios',
          headerElevation: Platform.OS === 'android' ? 4 : 0,
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsPickerVisible(true)} style={styles.datePickerButtonInHeader}>
              <Text style={[styles.datePickerText, { color: currentScreenColors.text }]}>
                Thg {selectedMonth}/{selectedYear}
              </Text>
              <Ionicons name="chevron-down" size={18} color={currentScreenColors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BudgetItemCard title="Ngân sách hàng tháng" budgetData={overallBudgetDataFromCategories} expensesForCategory={totalMonthlyExpenses} onEdit={navigateToSetup} />
        {budgetData?.categories && Object.entries(budgetData.categories).map(([catId, catData]) => (<BudgetItemCard key={catId} title={catData.name || 'Chưa rõ'} iconName={catData.icon || 'pricetag-outline'} budgetData={catData} expensesForCategory={expensesByCategory[catId] || 0} onEdit={() => router.push({ pathname: '/budgetSetupListScreen', params: { year: selectedYear, month: selectedMonth } })} />))}
        {(isBudgetDataEffectivelyEmpty && !loading) && (<View style={styles.noDataContainer}><Ionicons name="wallet-outline" size={50} color={COLORS.textSecondary} /><Text style={[styles.noDataText, { color: COLORS.textSecondary }]}>Chưa có ngân sách cho tháng {selectedMonth}/{selectedYear}.</Text><Text style={[styles.noDataTextSmall, { color: COLORS.textSecondary }]}>Nhấn nút bên dưới để cài đặt.</Text></View>)}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={navigateToSetup}><Ionicons name="add" size={24} color={COLORS.black} /><Text style={styles.fabText}>Cài đặt ngân sách</Text></TouchableOpacity>
      <MonthYearPickerModal visible={isPickerVisible} onClose={() => setIsPickerVisible(false)} onSelect={handleMonthYearChange} initialYear={selectedYear} initialMonth={selectedMonth} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  datePickerButtonInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  datePickerText: { fontSize: 16, marginRight: 4 },
  scrollContent: { padding: 15, paddingBottom: 90 },
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 20, right: 20, backgroundColor: COLORS.primaryAccent, paddingVertical: 15, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  fabText: { color: COLORS.black, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  budgetItemCard: { borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0.5 },
  budgetItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  budgetItemTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  editButton: {},
  editText: { fontSize: 14 },
  budgetItemContent: { flexDirection: 'row', alignItems: 'center' },
  budgetCircleSmallContainer: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  budgetInfoTextContainer: { flex: 1, justifyContent: 'center' },
  budgetInfoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  budgetInfoLabel: { fontSize: 13 },
  budgetInfoValue: { fontSize: 13, fontWeight: '600' },
  noDataContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
  noDataText: { fontSize: 16, textAlign: 'center', marginTop: 15, lineHeight: 24 },
  noDataTextSmall: { fontSize: 14, textAlign: 'center', marginTop: 8 },
});