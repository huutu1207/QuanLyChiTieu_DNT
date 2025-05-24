import { database } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { off, onValue, ref, remove } from 'firebase/database';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DEFAULT_CATEGORIES } from './categories';
import { COLORS } from './colors';

const CustomHeaderTitle = ({ title, subtitle, titleColor, subtitleColor }) => {
  return (
    <View style={styles.customHeaderContainer}>
      <Text style={[styles.customHeaderMainTitle, { color: titleColor }]}>{title}</Text>
      {subtitle && <Text style={[styles.customHeaderSubtitle, { color: subtitleColor || titleColor }]}>{subtitle}</Text>}
    </View>
  );
};

const CategorySetupItem = ({ item, onPressEdit, onPressDelete, amount }) => {
  const currentItemColors = {
    text: COLORS.text,
    textSecondary: COLORS.textSecondary,
    iconColor: item.color || COLORS.textSecondary,
    deleteColor: COLORS.expense
  };
  const hasBudgetSet = amount > 0;

  return (
    <View style={[styles.itemContainer, { borderBottomColor: COLORS.border }]}>
      <View style={styles.itemIconContainer}>
        <Ionicons
          name={item.isTotalBudget ? "wallet-outline" : (item.icon || 'pricetag-outline')}
          size={24}
          color={currentItemColors.iconColor}
        />
      </View>
      <Text style={[styles.itemName, { color: currentItemColors.text }]}>{item.name}</Text>
      <View style={styles.actionsWrapper}>
        <TouchableOpacity onPress={onPressEdit} style={styles.actionButton}>
          <Text style={[styles.itemAmountText, { color: hasBudgetSet ? currentItemColors.text : currentItemColors.textSecondary }]}>
            {hasBudgetSet ? amount.toLocaleString() + ' đ' : (item.isTotalBudget && amount === 0 ? '0 đ' : 'Sửa')}
          </Text>
          <Ionicons name="chevron-forward-outline" size={20} color={currentItemColors.textSecondary} style={styles.chevronIcon} />
        </TouchableOpacity>
        {(item.isTotalBudget || (hasBudgetSet && !item.isTotalBudget)) && (
          <TouchableOpacity onPress={onPressDelete} style={[styles.actionButton, styles.deleteIconContainer]}>
            <Ionicons name="trash-outline" size={22} color={currentItemColors.deleteColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function BudgetSetupListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { year: yearString, month: monthString } = params;

  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  const currentScreenColors = {
    background: COLORS.background,
    text: COLORS.text,
    textSecondary: COLORS.textSecondary,
    headerSurface: COLORS.surface,
    border: COLORS.border,
    primaryAccent: COLORS.primaryAccent,
  };

  useEffect(() => {
    if (!yearString || !monthString) {
      Alert.alert("Lỗi", "Thiếu thông tin năm hoặc tháng.", [{ text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace('/') }]);
      setLoading(false);
      return;
    }

    const parsedYear = parseInt(String(yearString));
    const parsedMonth = parseInt(String(monthString));

    if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      Alert.alert("Lỗi", "Năm hoặc tháng không hợp lệ.", [{ text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace('/') }]);
      setLoading(false);
      return;
    }
    setYear(parsedYear);
    setMonth(parsedMonth);
  }, [yearString, monthString, router, params]);

  const fetchData = useCallback(() => {
    if (!user || year === null || month === null) {
      return null;
    }
    setLoading(true);
    const budgetPath = `users/${user.uid}/budgets/${year}-${month}`;
    const budgetRefDb = ref(database, budgetPath);

    const listener = onValue(budgetRefDb, (snapshot) => {
      const data = snapshot.val();
      setBudgetData(data);
      setLoading(false);
      setIsDeleting(false);
    }, (error) => {
      console.error("[BudgetSetupListScreen] Firebase onValue error:", error);
      Alert.alert("Lỗi", `Không thể tải dữ liệu ngân sách: ${error.message || error.code}`);
      setLoading(false);
      setIsDeleting(false);
    });

    return { budgetRefDb, listenerCallback: listener };
  }, [user, year, month]);

  useEffect(() => {
    if (!user) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.", [{ text: "OK", onPress: () => router.replace('/') }]);
      setLoading(false);
      return;
    }

    if (year === null || month === null) {
      return;
    }

    const subscription = fetchData();

    return () => {
      if (subscription && subscription.budgetRefDb && subscription.listenerCallback) {
        off(subscription.budgetRefDb, 'value', subscription.listenerCallback);
      }
    };
  }, [user, year, month, fetchData]);

  const handleEditItem = (item) => {
    if (year === null || month === null) {
      Alert.alert("Lỗi", "Không thể xác định tháng/năm để sửa.");
      return;
    }
    const currentAmount = item.isTotalBudget
      ? budgetData?.totalAmount || 0
      : budgetData?.categories?.[item.id]?.amount || 0;

    router.push({
      pathname: '/budgetInputScreen',
      params: {
        year: String(year),
        month: String(month),
        isTotalBudget: item.isTotalBudget ? 'true' : 'false',
        categoryId: item.isTotalBudget ? '' : item.id,
        categoryName: item.name,
        currentAmount: String(currentAmount),
        categoryIcon: item.icon || '',
      },
    });
  };

  const handleDeleteItem = (item) => {
    if (!user || year === null || month === null) {
      Alert.alert("Lỗi", "Không thể xác định thông tin để xóa (người dùng, năm hoặc tháng).");
      return;
    }

    const budgetMonthPath = `users/${user.uid}/budgets/${year}-${month}`;
    const itemName = item.name;

    Alert.alert(
      `Xóa Ngân sách ${itemName}`,
      `Bạn có chắc chắn muốn xóa ngân sách cho "${itemName}" không? Thao tác này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel", onPress: () => console.log("[BudgetSetupListScreen] Delete cancelled for", itemName) },
        {
          text: "Xóa", style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            let pathToRemove = null;
            if (item.isTotalBudget) {
              pathToRemove = `${budgetMonthPath}/totalAmount`;
            } else if (item.id) {
              pathToRemove = `${budgetMonthPath}/categories/${item.id}`;
            }

            if (!pathToRemove) {
              Alert.alert("Lỗi", "Không xác định được mục cần xóa. Vui lòng thử lại.");
              setIsDeleting(false);
              return;
            }

            try {
              await remove(ref(database, pathToRemove));
              Alert.alert("Thành công", `Đã xóa ngân sách "${itemName}".`);
            } catch (error) {
              Alert.alert("Lỗi Xóa", `Không thể xóa ngân sách cho "${itemName}". Chi tiết: ${error.message || error.code}`);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const allSetupItems = [
    { id: 'total', name: 'Ngân sách hàng tháng (Tổng)', isTotalBudget: true, icon: 'wallet-outline', color: COLORS.primary },
    ...DEFAULT_CATEGORIES.map(category => ({
      ...category,
      isTotalBudget: false,
    }))
  ];

  if (year === null || month === null || (loading && !isDeleting && budgetData === null)) {
    return <ActivityIndicator size="large" color={currentScreenColors.primaryAccent} style={styles.fullScreenLoader} />;
  }

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
              title="Cài đặt Ngân sách"
              subtitle={month && year ? `Tháng ${month}/${year}` : ''}
              titleColor={currentScreenColors.text}
              subtitleColor={currentScreenColors.textSecondary}
            />
          ),
        }}
      />

      {isDeleting && <ActivityIndicator size="small" color={currentScreenColors.primaryAccent} style={styles.deletingIndicator} />}

      <FlatList
        data={allSetupItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const amount = item.isTotalBudget
            ? budgetData?.totalAmount || 0
            : budgetData?.categories?.[item.id]?.amount || 0;
          return (
            <CategorySetupItem
              item={item}
              amount={amount}
              onPressEdit={() => handleEditItem(item)}
              onPressDelete={() => handleDeleteItem(item)}
            />
          );
        }}
        ListEmptyComponent={
          !loading && !isDeleting ? (
            <View style={styles.emptyListContainer}>
              <Text style={[styles.emptyListText, { color: COLORS.textSecondary }]}>Không có mục cài đặt nào.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<View style={{ height: 20 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  deletingIndicator: { marginVertical: 10, alignSelf: 'center' },
  customHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHeaderMainTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  customHeaderSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.surface,
  },
  itemIconContainer: { width: 35, alignItems: 'center', marginRight: 12 },
  itemName: { flex: 1, fontSize: 16, marginRight: 8 },
  actionsWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingLeft: 8 },
  itemAmountText: { fontSize: 15, textAlign: 'right' },
  chevronIcon: { marginLeft: 3 },
  deleteIconContainer: { marginLeft: 8, paddingVertical: 5, paddingHorizontal: 7 },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
  },
});