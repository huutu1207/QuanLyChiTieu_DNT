import React from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

interface Expense {
  amount: number;
  date: string;
  categoryId: string;
  categoryName: string; // Thêm categoryName
  transactionType: string;
}

interface ChartData {
  pieChartData: { name: string; amount: number; color: string; legendFontColor: string; legendFontSize: number }[];
  lineChartData: { labels: string[]; datasets: { data: number[] }[] }; // ✅ sửa chỗ này
  totalExpensePeriod: number;
  averageExpense: number;
}

interface ExpenseChartsProps {
  chartData: ChartData;
}

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 8,
  },
};

// Hàm để lấy số ngày trong tháng
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

// Tính dữ liệu cho biểu đồ
export const generateChartData = (expenses: Expense[], year: number, month: number): ChartData => {
  const fixedColors = [
    '#FF0000', '#FFFF00', '#00008B', '#008000', '#800080',
    '#FFA500', '#FF69B4', '#ADD8E6', '#000000', '#808080',
    '#00FF00', '#0000FF', '#00FFFF', '#FF00FF', '#800000'
  ];
  const expenseOnly = expenses.filter(e => e.transactionType === 'expense');
  // Nhóm chi tiêu theo categoryId và cộng tổng số tiền
  const categoryExpenses: { [categoryId: string]: { name: string; amount: number } } = {};
  expenseOnly.forEach((expense) => {
    if (categoryExpenses[expense.categoryId]) {
      categoryExpenses[expense.categoryId].amount += expense.amount;
    } else {
      categoryExpenses[expense.categoryId] = {
        name: expense.categoryName,
        amount: expense.amount,
      };
    }
  });

  const total = expenseOnly.reduce((sum, e) => sum + e.amount, 0);


  // Tạo danh sách danh mục có amount và phần trăm
  const categoryArray = Object.values(categoryExpenses).map((category) => ({
    name: category.name,
    amount: category.amount,
    percentage: (category.amount / total) * 100,
  }));

  // Sắp xếp giảm dần theo phần trăm
  categoryArray.sort((a, b) => b.percentage - a.percentage);

  // Lấy 3 danh mục lớn nhất
  const top3 = categoryArray.slice(0, 3);

  // Gộp phần còn lại thành "Khác"
  const other = categoryArray.slice(3);
  const otherAmount = other.reduce((sum, item) => sum + item.amount, 0);
  const otherPercentage = (otherAmount / total) * 100;

  // Gộp lại thành danh sách 4 mục cuối cùng
  const finalCategories = [...top3, {
    name: 'Khác',
    amount: otherAmount,
    percentage: otherPercentage,
  }];

  // Gán màu và tạo pieChartData
  const pieChartData = finalCategories.map((category, idx) => ({
    name: `${category.name} (${category.percentage.toFixed(1)}%)`,
    amount: category.amount,
    color: fixedColors[idx % fixedColors.length],
    legendFontColor: '#333',
    legendFontSize: 12,
  }));


  // Lấy số ngày trong tháng
  const totalDaysInMonth = getDaysInMonth(year, month);
  const avg = total / totalDaysInMonth; // Chia cho số ngày trong tháng


  // Khởi tạo mảng ngày từ 1 đến số ngày trong tháng
  const daysInMonth = Array.from({ length: totalDaysInMonth }, (_, index) => (index + 1).toString());

  // Khởi tạo dữ liệu cho LineChart, mỗi ngày có một giá trị chi tiêu
  // Chỉ lấy transactionType = 'expense'
  const dailyExpenseMap: { [key: string]: number } = {};
  expenseOnly.forEach((expense) => {
    const expenseDate = new Date(expense.date);
    const day = expenseDate.getDate();
    if (!dailyExpenseMap[day]) {
      dailyExpenseMap[day] = 0;
    }
    dailyExpenseMap[day] += expense.amount;
  });


  const lineChartData = {
    labels: daysInMonth, // Tất cả các ngày trong tháng
    datasets: [
      {
        data: daysInMonth.map((day) => dailyExpenseMap[parseInt(day)] || 0), // Lấy chi tiêu cho ngày, nếu không có thì là 0
      },
    ],
  };


  return {
    pieChartData,
    lineChartData,
    totalExpensePeriod: total,
    averageExpense: avg,
  };
};

const ExpenseCharts: React.FC<ExpenseChartsProps> = ({ chartData }) => {
  return (
    <ScrollView contentContainerStyle={{ padding: 0 }}>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
          Thống kê theo danh mục
        </Text>
        <PieChart
          data={chartData.pieChartData}
          width={screenWidth - 32}
          height={220}
          accessor="amount"
          backgroundColor="transparent"
          chartConfig={chartConfig}
          paddingLeft="0"
        />

      </View>

      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
          Thống kê theo thời gian
        </Text>
        <LineChart
          data={chartData.lineChartData}
          width={screenWidth - 10}
          height={220}
          chartConfig={chartConfig}
          bezier
        />
      </View>

      <Text style={{ textAlign: 'center', fontSize: 16 }}>
        Tổng cộng: {chartData.totalExpensePeriod.toLocaleString()} VND
      </Text>
      <Text style={{ textAlign: 'center', fontSize: 16, marginBottom: 24 }}>
        Trung bình: {chartData.averageExpense.toFixed(1).toLocaleString()} VND/ngày
      </Text>
    </ScrollView>
  );
};

export default ExpenseCharts;
