// app/(tabs)/_layout.js
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons'; // Import FontAwesome5 cho nút cộng
import { Tabs, useRouter } from 'expo-router'; // Hoặc Stack từ expo-router nếu đây là stack cha
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

// Custom Add Button
const CustomAddButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      top: -25, // Nâng nút lên
      justifyContent: 'center',
      alignItems: 'center',
      ...styles.shadow // Thêm shadow
    }}
    onPress={onPress}
  >
    <View style={{
      width: 60, // Kích thước nút
      height: 60,
      borderRadius: 30, // Bo tròn
      backgroundColor: '#FF6347', // Màu cam đỏ cho nút cộng
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <FontAwesome5 name="plus" size={24} color="#fff" />
    </View>
  </TouchableOpacity>
);


export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFD700', 
        tabBarInactiveTintColor: '#888', 
        tabBarStyle: {
          backgroundColor: '#fff', 
          height: Platform.OS === 'ios' ? 90 : 60, // Chiều cao tab bar
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
        headerStyle: { backgroundColor: '#FFD700' },
        headerTitleAlign: 'center',
        headerTintColor: '#333',
      }}
    >
      <Tabs.Screen
        name="index" // Tên file màn hình (index.js)
        options={{
          title: 'Sổ Thu Chi',
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
          headerLeft: () => (
            <TouchableOpacity onPress={() => { /* Mở drawer hoặc hành động khác */ }} style={{ marginLeft: 15 }}>
              <Ionicons name="menu" size={28} color="#333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 15 }}>
              <TouchableOpacity onPress={() => { router.push('/search'); /* Điều hướng đến màn hình tìm kiếm */ }} style={{ marginRight: 15 }}>
                <Ionicons name="search" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { /* Mở lịch hoặc hành động khác */ }}>
                <Ionicons name="calendar-outline" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="charts" // Giả sử bạn có file app/(tabs)/charts.js
        options={{
          title: 'Biểu đồ',
          tabBarLabel: 'Biểu đồ',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} />,
        }}
      />
      {/* Nút "+" ở giữa */}
      <Tabs.Screen
        name="addTransactionPlaceholder"
        options={{
          tabBarLabel: '',
          tabBarIcon: () => null, // Tạm thời không cần icon ở đây vì CustomAddButton tự xử lý
          tabBarButton: (props) => {
            return (
              <CustomAddButton 
                // {...props}
                
                onPress={() => {
                  router.push('/add-transaction');
                }}
              />
            );
          },
        }}
        listeners={{
          tabPress: e => {
            e.preventDefault();
            router.push('/add-transaction');
          },
        }}
      />
      <Tabs.Screen
        name="reports" // Giả sử bạn có file app/(tabs)/reports.js
        options={{
          title: 'Báo cáo',
          tabBarLabel: 'Báo cáo',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="assessment" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile" // Giả sử bạn có file app/(tabs)/profile.js
        options={{
          title: 'Cá nhân',
          tabBarLabel: 'Tôi',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  shadow: { // Style cho shadow của nút cộng
    shadowColor: '#7F5DF0',
    shadowOffset: {
      width: 0,
      height: 5, // Giảm độ cao của shadow
    },
    shadowOpacity: 0.20, // Giảm độ mờ
    shadowRadius: 3.0,  // Giảm bán kính
    elevation: 5
  }
});