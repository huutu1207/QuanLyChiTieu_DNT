// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter } from 'expo-router'; // Thêm Slot, useRouter, SplashScreen
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthScreen } from '@/components/AuthScreen'; // Component AuthScreen của bạn
import { auth } from '@/firebaseConfig'; // Cấu hình Firebase của bạn
import { useColorScheme } from '@/hooks/useColorScheme'; // Hook tùy chỉnh của bạn
import { onAuthStateChanged } from 'firebase/auth'; // Firebase auth

// Ngăn SplashScreen tự ẩn
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({ // Đổi tên biến để rõ ràng hơn
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [currentUser, setCurrentUser] = useState<any>(undefined); // undefined: trạng thái ban đầu
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed, user:', user ? user.uid : null);
      setCurrentUser(user);
      // Chỉ ẩn SplashScreen khi cả font và auth đã được xử lý
      if (fontsLoaded) { // Kiểm tra fontsLoaded trước khi ẩn SplashScreen
        SplashScreen.hideAsync();
      }
    });
    return () => unsubscribe();
  }, [fontsLoaded]); // Thêm fontsLoaded vào dependencies để đảm bảo SplashScreen chỉ ẩn khi font cũng đã load

  useEffect(() => {
    if (currentUser === undefined || !fontsLoaded) {
      return; // Đang chờ kiểm tra auth hoặc font chưa load xong
    }

    if (currentUser) {
      console.log('User authenticated, navigating to (tabs)');
      router.replace('/(tabs)');
    } else {
      console.log('User not authenticated');
      // AuthScreen sẽ được render ở dưới
    }
  }, [currentUser, fontsLoaded, router]);

  // Nếu font chưa load hoặc đang kiểm tra auth, hiển thị loading
  if (!fontsLoaded || currentUser === undefined) {
    // Async font loading or auth checking.
    // Bạn có thể muốn một màn hình chờ tinh tế hơn ở đây.
    // SplashScreen.preventAutoHideAsync() đã được gọi, nên màn hình chờ của hệ thống sẽ hiển thị.
    // Nếu muốn hiển thị ActivityIndicator thay vì màn hình chờ mặc định sau khi SplashScreen ẩn:
    // if (!fontsLoaded || currentUser === undefined) {
    //   return (
    //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? DarkTheme.colors.background : DefaultTheme.colors.background }}>
    //       <ActivityIndicator size="large" color={colorScheme === 'dark' ? DarkTheme.colors.text : DefaultTheme.colors.text} />
    //     </View>
    //   );
    // }
    return null; // Hoặc một component loading tùy chỉnh nếu SplashScreen không đủ
  }

  // Nếu không có người dùng, hiển thị AuthScreen
  // AuthScreen nên được bọc trong ThemeProvider nếu nó cũng cần theme
  if (!currentUser) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthScreen />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    );
  }

  // Nếu có người dùng và font đã load, hiển thị ứng dụng chính
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* (tabs) sẽ được render bởi <Slot /> trong RootLayout gốc nếu router.replace đã chạy */}
        {/* Hoặc trực tiếp nếu AuthScreen không hiển thị */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        {/* Bạn có thể thêm các màn hình khác ở cấp độ gốc ở đây nếu cần, ví dụ màn hình modal */}
        {/* <Stack.Screen name="modal" options={{ presentation: 'modal' }} /> */}
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}