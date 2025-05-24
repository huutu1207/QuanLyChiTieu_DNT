import {
    ArcElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';

import React from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Dimensions, Text, View } from 'react-native';

const screenWidth = Dimensions.get('window').width;

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

interface Expense {
  amount: number;
  date: string;
  categoryId: string;
  categoryName: string;
  transactionType: string;
}

interface ChartData {
  pieChartData: {
    x: string;
    y: number;
    color: string;
  }[];
  lineChartData: { x: string; y: number }[];
  totalExpensePeriod: number;
  averageExpense: number;
}

interface ExpenseChartsProps {
  chartData: ChartData;
}

// Hàm lấy số ngày trong tháng
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

export const generateChartData = (expenses: Expense[], year: number, month: number): ChartData => {
  const expenseOnly = expenses.filter(e => e.transactionType === 'expense');
  const fixedColors = [
    '#FF0000', '#FFFF00', '#00008B', '#008000', '#800080', '#FFA500', '#FF69B4',
    '#ADD8E6', '#000000', '#808080', '#00FF00', '#0000FF', '#00FFFF', '#FF00FF', '#800000'
  ];

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

    let sortedCategories = Object.values(categoryExpenses).sort((a, b) => b.amount - a.amount);
    let topCategories = sortedCategories.slice(0, 3);
    let otherTotal = sortedCategories.slice(3).reduce((sum, c) => sum + c.amount, 0);

    const pieChartData = [
        ...topCategories.map((category, index) => ({
            x: category.name,
            y: category.amount,
            color: fixedColors[index % fixedColors.length],
        })),
        ];

        if (otherTotal > 0) {
        pieChartData.push({
            x: 'Khác',
            y: otherTotal,
            color: fixedColors[pieChartData.length % fixedColors.length],
        });
    }

    const totalDaysInMonth = getDaysInMonth(year, month);
    const total = expenseOnly.reduce((sum, e) => sum + e.amount, 0);
    const avg = total / totalDaysInMonth; // Chia cho số ngày trong tháng   

  const dailyExpenseMap: { [key: string]: number } = {};

  expenseOnly.forEach((expense) => {
    const expenseDate = new Date(expense.date);
    const day = expenseDate.getDate();
    if (!dailyExpenseMap[day]) {
      dailyExpenseMap[day] = 0;
    }
    dailyExpenseMap[day] += expense.amount;
  });

  const lineChartData = Array.from({ length: totalDaysInMonth }, (_, index) => {
    const day = (index + 1).toString();
    return {
      x: day,
      y: dailyExpenseMap[parseInt(day)] || 0,
    };
  });

  return {
    pieChartData,
    lineChartData,
    totalExpensePeriod: total,
    averageExpense: avg,
  };
};

    const ExpenseCharts: React.FC<ExpenseChartsProps> = ({ chartData }) => {
      if (!chartData) return null;

      const pieData = {
        labels: chartData.pieChartData.map(d => d.x),
        datasets: [{
          data: chartData.pieChartData.map(d => d.y),
          backgroundColor: chartData.pieChartData.map(d => d.color),
        }]
      };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
            callbacks: {
                label: function (context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = chartData.pieChartData.reduce((sum, d) => sum + d.y, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value.toLocaleString()} VNĐ (${percentage}%)`;
                },
            },
            },
            legend: {
            position: 'right' as const
            },
        },
    };


  const lineData = {
    labels: chartData.lineChartData.map(d => d.x),
    datasets: [{
      label: 'Chi tiêu',
      data: chartData.lineChartData.map(d => d.y),
      fill: false,
      borderColor: '#c43a31',
      tension: 0.4,
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 25, fontWeight: 'bold', textAlign: 'center', marginBottom: 4, marginTop: 0 }}>
          Thống kê theo danh mục
        </Text>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
            <div style={{ width: 300, height: 200 }}>
                <Pie data={pieData} options={pieOptions} />
            </div>
        </div>


        <Text style={{ fontSize: 25, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 }}>
          Thống kê theo thời gian
        </Text>

        <div
            style={{
                width: '100%',             // Chiếm toàn bộ chiều ngang để có không gian canh giữa
                height: 200,
                marginBottom: 5,
                display: 'flex',
                justifyContent: 'center',  // Canh giữa theo chiều ngang
                alignItems: 'center'       // Canh giữa theo chiều dọc (nếu cần)
            }}
            >
            <div style={{ width: 650 }}>
                <Line data={lineData} options={lineOptions} />
            </div>
        </div>


        <Text style={{ textAlign: 'center', fontSize: 16, marginTop: 10 }}>
            Tổng cộng: {chartData.totalExpensePeriod.toLocaleString()} VND
        </Text>
        <Text style={{ textAlign: 'center', fontSize: 16, marginBottom: 0 }}>
            Trung bình: {chartData.averageExpense.toFixed(1).toLocaleString()} VND/ngày
        </Text>
      </View>
  );
};

export default ExpenseCharts;
