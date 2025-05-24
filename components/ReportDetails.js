// components/ReportDetails.js
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../app/colors';
import MonthYearPickerModal from './MonthYearPickerModal';

const TransactionItem = ({ item, onPress }) => {
  const displayDate = item.date ? format(parseISO(item.date), 'dd/MM', { locale: vi }) : 'N/A';
  return (
    <TouchableOpacity style={styles.transactionRow} onPress={() => onPress(item)}>
      <View style={styles.transactionIconDate}>
        <Ionicons name={item.categoryIcon || 'cash-outline'} size={24} color={COLORS.textSecondary} style={styles.transactionCategoryIcon} />
        <View>
          <Text style={[styles.transactionCategoryName, { color: COLORS.text }]}>{item.categoryName || 'Không có tên'}</Text>
          <Text style={[styles.transactionDateSmall, { color: COLORS.textSecondary }]}>{displayDate}</Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, { color: item.transactionType === 'expense' ? COLORS.expense : COLORS.income }]}>
        {item.transactionType === 'expense' ? '-' : '+'} {item.amount != null ? item.amount.toLocaleString() : '0'} đ
      </Text>
    </TouchableOpacity>
  );
};

export default function ReportDetails({ data, type, selectedYear, selectedMonth, onMonthYearChange }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();
  const currentColors = {
    background: COLORS.background, surface: COLORS.surface, text: COLORS.text,
    textSecondary: COLORS.textSecondary, circleBackground: COLORS.border,
    circleProgress: COLORS.primaryAccent, circleText: COLORS.text, separator: COLORS.border
  };

  const handleMonthYearSelect = (y, m) => {
    setIsModalVisible(false);
    if (onMonthYearChange) onMonthYearChange(y, m);
  };

  const handleTransactionPress = (t) => router.push({ pathname: '/transactionDetail', params: { transactionData: JSON.stringify(t) } });
  const navigateToBudgetScreen = () => router.push({ pathname: '/budgetScreen', params: { year: selectedYear, month: selectedMonth } });

  if (!data) {
    return (
      <View style={[styles.detailsContainerCentered, { backgroundColor: currentColors.background }]}>
        <View style={[styles.card, styles.noDataCardFull, { backgroundColor: currentColors.surface, borderColor: currentColors.separator }]}>
          <Ionicons name="information-circle-outline" size={40} color={COLORS.gray} style={{ marginBottom: 10, alignSelf: 'center' }} />
          <Text style={[styles.noDataTextFull, { color: currentColors.textSecondary }]}>Chưa có dữ liệu.</Text>
        </View>
      </View>
    );
  }

  if (type === "analysis") {
    const { monthDisplay, expenses, income, balance, transactions, budgetAmount, budgetSet } = data;
    const remainingBudget = budgetSet ? budgetAmount - expenses : 0;
    let budgetProgress = 0;
    if (budgetSet && budgetAmount > 0) budgetProgress = expenses / budgetAmount;
    const getCircleDisplayText = () => {
      if (!budgetSet || budgetAmount === 0) return "--";
      return `${Math.round(Math.min(1, budgetProgress) * 100)}%`;
    };
    const radius = 35, strokeWidth = 7, circumference = 2 * Math.PI * radius;
    const progressStrokeDashoffset = circumference - (Math.min(1, budgetProgress) * circumference);

    const ListHeader = (
      <View style={styles.listHeaderFooterPadding}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.separator }]}
          onPress={() => setIsModalVisible(true)}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: currentColors.text }]}>{`Tổng quan ${monthDisplay}`}</Text>
            <Ionicons name="chevron-down-outline" size={20} color={currentColors.textSecondary} />
          </View>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Chi tiêu</Text>
              <Text style={[styles.statValue, { color: COLORS.expense }]}>{expenses.toLocaleString()} đ</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Thu nhập</Text>
              <Text style={[styles.statValue, { color: COLORS.income }]}>{income.toLocaleString()} đ</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Số dư</Text>
              <Text style={[styles.statValue, { color: balance >= 0 ? COLORS.income : COLORS.expense }]}>{balance.toLocaleString()} đ</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.budgetCard, { backgroundColor: currentColors.surface, borderColor: currentColors.separator }]}
          onPress={navigateToBudgetScreen}
        >
          <View style={styles.budgetCardHeader}>
            <Text style={[styles.budgetCardTitle, { color: currentColors.text }]}>Ngân sách hàng tháng</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={currentColors.textSecondary} />
          </View>
          <View style={styles.budgetCardContent}>
            <View style={styles.budgetCircleContainer}>
              <Svg height="70" width="70" viewBox="0 0 84 84">
                <Circle cx="42" cy="42" r={radius} stroke={currentColors.circleBackground} strokeWidth={strokeWidth} fill="transparent" />
                {budgetSet && budgetAmount > 0 && (
                  <Circle
                    cx="42" cy="42" r={radius}
                    stroke={budgetProgress > 1 ? COLORS.expense : currentColors.circleProgress}
                    strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference}
                    strokeDashoffset={progressStrokeDashoffset} strokeLinecap="round" transform="rotate(-90 42 42)"
                  />
                )}
                <SvgText x="42" y="49" textAnchor="middle" fontSize="18" fontWeight="bold" fill={currentColors.circleText}>
                  {getCircleDisplayText()}
                </SvgText>
              </Svg>
            </View>
            <View style={styles.budgetInfoTextContainer}>
              <View style={styles.budgetInfoItem}>
                <Text style={[styles.budgetInfoLabel, { color: currentColors.textSecondary }]}>Còn lại :</Text>
                <Text style={[styles.budgetInfoValue, { color: remainingBudget >= 0 ? COLORS.income : COLORS.expense }]}>
                  {budgetSet ? remainingBudget.toLocaleString() : 0} đ
                </Text>
              </View>
              <View style={styles.budgetInfoItem}>
                <Text style={[styles.budgetInfoLabel, { color: currentColors.textSecondary }]}>Ngân sách :</Text>
                <Text style={[styles.budgetInfoValue, { color: currentColors.text }]}>{budgetSet ? budgetAmount.toLocaleString() : 0} đ</Text>
              </View>
              <View style={styles.budgetInfoItem}>
                <Text style={[styles.budgetInfoLabel, { color: currentColors.textSecondary }]}>Chi tiêu :</Text>
                <Text style={[styles.budgetInfoValue, { color: COLORS.expense }]}>{expenses.toLocaleString()} đ</Text>
              </View>
            </View>
          </View>
          {budgetSet && budgetAmount > 0 && expenses > budgetAmount && (
            <View style={styles.overBudgetWarningContainer}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.expense} style={styles.warningIcon} />
              <Text style={styles.overBudgetWarningText}>Bạn đã vượt quá ngân sách!</Text>
            </View>
          )}
        </TouchableOpacity>

        {transactions?.length > 0 ? (
          <Text style={[styles.cardTitle, styles.transactionsListTitle, { color: currentColors.text }]}>
            Giao dịch trong {monthDisplay}
          </Text>
        ) : (
          <View style={[styles.card, styles.noDataCardBottom, { backgroundColor: currentColors.surface, borderColor: currentColors.separator }]}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.gray} style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={[styles.noDataTextBottom, { color: currentColors.textSecondary }]}>Không có giao dịch nào.</Text>
          </View>
        )}
      </View>
    );

    return (
      <View style={[styles.detailsContainer, { backgroundColor: currentColors.background }]}>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TransactionItem item={item} onPress={handleTransactionPress} />}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.flatListContentContainer}
        />
        <MonthYearPickerModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSelect={handleMonthYearSelect}
          initialYear={selectedYear}
          initialMonth={selectedMonth}
        />
      </View>
    );
  }

  return (
    <View style={[styles.detailsContainerCentered, { backgroundColor: currentColors.background }]}>
      <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.separator }]}>
        <Text style={{ color: currentColors.text }}>...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  detailsContainer: { flex: 1 },
  detailsContainerCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 },
  listHeaderFooterPadding: { paddingHorizontal: 15, paddingTop: 10 },
  flatListContentContainer: { paddingBottom: 20 }, // For space at the end of the list
  card: { borderRadius: 10, padding: 15, marginBottom: 15, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2, borderWidth: Platform.OS === 'android' ? 0 : 0.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  transactionsListTitle: { marginBottom: 10 },
  budgetCard: {},
  budgetCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  budgetCardTitle: { fontSize: 16, fontWeight: '600' },
  budgetCardContent: { flexDirection: 'row', alignItems: 'center' },
  budgetCircleContainer: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  budgetInfoTextContainer: { flex: 1, justifyContent: 'center' },
  budgetInfoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  budgetInfoLabel: { fontSize: 13 },
  budgetInfoValue: { fontSize: 13, fontWeight: '600' },
  overBudgetWarningContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: `${COLORS.expense}1A`, borderRadius: 6 },
  warningIcon: { marginRight: 8 },
  overBudgetWarningText: { color: COLORS.expense, fontSize: 13, fontWeight: '500' },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, marginBottom: 3 },
  statValue: { fontSize: 15, fontWeight: '600' },
  noDataCardFull: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, minHeight: 150, width: '90%' },
  noDataTextFull: { fontSize: 15, textAlign: 'center' },
  noDataCardBottom: { alignItems: 'center', justifyContent: 'center', paddingVertical: 25 },
  noDataTextBottom: { fontSize: 14, textAlign: 'center' },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 }, // Added paddingHorizontal here as card is now outside
  transactionIconDate: { flexDirection: 'row', alignItems: 'center' },
  transactionCategoryIcon: { marginRight: 12, width: 24 },
  transactionCategoryName: { fontSize: 15, fontWeight: '500' },
  transactionDateSmall: { fontSize: 12 },
  transactionAmount: { fontSize: 15, fontWeight: 'bold' },
  separator: { height: Platform.OS === 'android' ? 0.5 : 0.5, marginLeft: 15 + 12 + 24, marginHorizontal: 15 }, // Adjusted marginLeft and added marginHorizontal
});