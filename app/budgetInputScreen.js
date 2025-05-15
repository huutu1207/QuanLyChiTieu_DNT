import NumericKeypad from '@/components/NumericKeypad';
import { database } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from './colors';

const CustomHeaderTitle = ({ title, subtitle, titleColor, subtitleColor }) => {
  return (
    <View style={styles.customHeaderContainer}>
      <Text style={[styles.customHeaderMainTitle, { color: titleColor }]}>{title}</Text>
      {subtitle && <Text style={[styles.customHeaderSubtitle, { color: subtitleColor || titleColor }]}>{subtitle}</Text>}
    </View>
  );
};

export default function BudgetInputScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { year: yearString, month: monthString, isTotalBudget: isTotalBudgetString, categoryId, categoryName: initialCategoryName, currentAmount: currentAmountString, categoryIcon: initialCategoryIcon } = params;

  const isTotalBudget = isTotalBudgetString === 'true';
  const initialAmount = parseFloat(String(currentAmountString || '0').replace(',', '.')) || 0;

  const [amount, setAmount] = useState(initialAmount === 0 ? '' : initialAmount.toString().replace('.', ','));
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [categoryName, setCategoryName] = useState(initialCategoryName || 'N/A');
  const [categoryIcon, setCategoryIcon] = useState(initialCategoryIcon || 'pricetag-outline');

  useEffect(() => {
    if (yearString) setYear(parseInt(String(yearString)));
    if (monthString) setMonth(parseInt(String(monthString)));
    if (initialCategoryName) setCategoryName(initialCategoryName);
    if (initialCategoryIcon) setCategoryIcon(initialCategoryIcon);
  }, [yearString, monthString, initialCategoryName, initialCategoryIcon]);

  const currentScreenColors = {
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
    textSecondary: COLORS.textSecondary,
    inputBackground: COLORS.background,
    border: COLORS.border,
    primaryAccent: COLORS.primaryAccent,
    headerSurface: COLORS.surface,
  };

  const handleKeyPress = (value) => {
    let currentVal = amount;
    if (value === '.') value = ',';
    if (value === ',') {
      if (!currentVal.includes(',')) {
        setAmount(prev => prev + value);
      }
    } else {
      if (currentVal.length < 15) {
        setAmount(prev => prev + value);
      }
    }
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleConfirm = async () => {
    if (!user || !year || !month) {
      Alert.alert("Lỗi", "Thông tin không đủ để thực hiện thao tác (thiếu người dùng, năm hoặc tháng).");
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount < 0) {
      Alert.alert("Lỗi", "Số tiền không hợp lệ. Vui lòng nhập số dương.");
      return;
    }

    setLoading(true);
    const budgetMonthPath = `users/${user.uid}/budgets/${year}-${month}`;
    let updates = {};

    if (isTotalBudget) {
      updates[`${budgetMonthPath}/totalAmount`] = numericAmount;
    } else if (categoryId) {
      updates[`${budgetMonthPath}/categories/${categoryId}/amount`] = numericAmount;
      if (categoryName && categoryName !== 'N/A') {
        updates[`${budgetMonthPath}/categories/${categoryId}/name`] = categoryName;
      }
      if (categoryIcon && categoryIcon !== 'pricetag-outline') {
         updates[`${budgetMonthPath}/categories/${categoryId}/icon`] = categoryIcon;
      }
    } else {
      Alert.alert("Lỗi", "Không xác định được loại ngân sách hoặc ID danh mục.");
      setLoading(false);
      return;
    }
    updates[`${budgetMonthPath}/lastUpdated`] = new Date().toISOString();

    try {
      await update(ref(database), updates);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace({ pathname: '/budgetScreen', params: { year: String(year), month: String(month) } });
      }
    } catch (error) {
      console.error("Lỗi khi lưu ngân sách:", error);
      Alert.alert("Lỗi", `Không thể lưu ngân sách. Chi tiết: ${error.message || error.code || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const displayFormattedAmount = () => {
    if (amount === '' || amount === '0') return '0';
    let tempAmount = amount;
    if (tempAmount.length > 1 && tempAmount.startsWith('0') && !tempAmount.startsWith('0,')) {
      tempAmount = tempAmount.replace(/^0+/, '');
      if (tempAmount.startsWith(',')) tempAmount = '0' + tempAmount;
      if (tempAmount === '') tempAmount = '0';
    }

    const parts = tempAmount.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(',');
  };

  const categoryOrTotalText = isTotalBudget ? "Ngân sách Tổng" : categoryName;
  const monthYearDisplay = year && month ? `Tháng ${month}/${year}` : '';
  const subtitleText = `${categoryOrTotalText}${monthYearDisplay ? ` - ${monthYearDisplay}` : ''}`;


  return (
    <View style={[styles.container, { backgroundColor: currentScreenColors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: currentScreenColors.headerSurface },
          headerTintColor: currentScreenColors.text,
          headerTitleAlign: 'center',
          headerTitle: () => (
            <CustomHeaderTitle
              title="Ngân sách"
              subtitle={subtitleText}
              titleColor={currentScreenColors.text}
              subtitleColor={currentScreenColors.textSecondary}
            />
          ),
           headerLeft: () => (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ marginLeft: Platform.OS === 'ios' ? 10 : 0, padding:5 }}>
              <Ionicons name="arrow-back" size={24} color={currentScreenColors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.inputSection, { backgroundColor: currentScreenColors.surface }]}>
        <Text style={[styles.inputLabel, { color: currentScreenColors.textSecondary }]}>
          {isTotalBudget ? "Nhập tổng ngân sách hàng tháng" : `Nhập ngân sách cho ${categoryName}`}
        </Text>
        <View style={[styles.textInputContainer, { backgroundColor: currentScreenColors.inputBackground, borderColor: currentScreenColors.border }]}>
          <TextInput
            style={[styles.textInput, { color: amount === '' ? currentScreenColors.textSecondary : currentScreenColors.text }]}
            value={displayFormattedAmount()}
            placeholder="0"
            placeholderTextColor={currentScreenColors.textSecondary}
            editable={false}
          />
          <Text style={[styles.currencySymbol, { color: currentScreenColors.textSecondary }]}>đ</Text>
        </View>
      </View>

      {loading && <ActivityIndicator size="small" color={COLORS.primaryAccent} style={{ marginVertical: 10 }} />}

      <NumericKeypad
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onConfirm={handleConfirm}
        confirmDisabled={loading || amount === '' || parseFloat(amount.replace(',', '.')) === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  customHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '80%',
  },
  customHeaderMainTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  customHeaderSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 18 : 12,
    borderWidth: 1,
    minHeight: 70,
  },
  textInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '500',
    marginLeft: 8,
  },
});
