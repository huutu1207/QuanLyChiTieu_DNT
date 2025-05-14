import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { app } from '../firebaseConfig';
import ParallaxScrollView from './ParallaxScrollView';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

import {
  AboutItem,
  categoryItem,
  policyItem,
  ProfileItem,
  SettingsItem,
  termsItem,
  themeItem,
} from '../components/profileData';

// Trong ProfileComponents.js hoặc file chứa IconSymbol
const IconSymbol = ({ name, style, isSelected }) => {
  const icons = {
    user: '👤', // Hồ sơ người dùng
    cog: '⚙️', // Cài đặt (nếu bạn dùng)
    chevron_right: '❯', // Mũi tên phải (sử dụng ký tự dày hơn một chút)
    // chevron_left: '<', // Nếu cần mũi tên trái
    expand_more: '⌄', // Mũi tên xuống (thay cho expand_more)
    expand_less: '⌃', // Mũi tên lên (thay cho expand_less)
    shield_check: '🛡️', // Bảo mật
    question_circle: '❓', // Trợ giúp
    palette: '🎨', // Giao diện / Theme
    list_alt: '🗂️', // Danh mục
    file_contract: '📜', // Điều khoản
    info_circle: 'ℹ️', // Giới thiệu
    bell: '🔔', // Thông báo
    language: '🌐', // Ngôn ngữ
    logout: '↪️', // Đăng xuất (icon gốc của bạn)
    login: '🔑', // Đăng nhập (thêm mới)
    person_add: '➕👤', // Đăng ký (thêm mới, hoặc bạn có thể chọn '✏️' '📝')
  };
  let iconToRender = icons[name] || '?'; // Giữ lại dấu '?' cho icon không xác định
  return <Text style={[styles.iconStyle, style]}>{iconToRender}</Text>;
};
export default function ProfileComponents() {
  const defaultLoginInfo = {
    title: 'Tài khoản của tôi',
    subtitle: 'Quản lý thông tin cá nhân và cài đặt',
  };

  const [loginInfo, setLoginInfo] = useState(defaultLoginInfo);

  const mainOptions = [
    { type: 'profileSection', uniqueKey: 'profileSectionKey' },
    themeItem,
    categoryItem,
    { type: 'settingsSection', uniqueKey: 'settingsSectionKey' },
  ];

  const additionalInfoItemsData = [
    { type: 'aboutSection', uniqueKey: 'aboutSectionKey' },
    termsItem,
    policyItem,
  ];

  const auth = getAuth(app);
  const database = getDatabase(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data && data.name) {
            setLoginInfo({
              title: data.name, // Hiển thị tên người dùng (e.g., "Ngo Minh Tri")
              subtitle: defaultLoginInfo.subtitle,
            });
          } else {
            setLoginInfo(defaultLoginInfo);
          }
        });
      } else {
        setLoginInfo(defaultLoginInfo);
      }
    });
    return () => unsubscribe();
  }, [auth, database]);

  const handleOptionPress = (screen) => {
    if (screen) {
      console.log(`Navigating to ${screen}`);
    }
  };

  const handleSettingsOptionPress = (optionTitle) => {
    console.log(`Selected settings option: ${optionTitle}`);
    switch (optionTitle) {
      case 'Thông báo':
        console.log('Chuyển đến màn hình cài đặt thông báo');
        break;
      case 'Ngôn ngữ':
        console.log('Chuyển đến màn hình chọn ngôn ngữ');
        break;
      case 'Bảo mật':
        console.log('Chuyển đến màn hình cài đặt bảo mật');
        break;
      case 'Đăng xuất':
        console.log('Thực hiện đăng xuất');
        break;
      default:
        break;
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={styles.lightHeader.backgroundColor}
      parallaxHeaderHeight={200}
      headerImage={
        <ThemedView style={[styles.headerContainer, styles.lightHeader]}>
          <View style={styles.headerContent}>
            <View style={[styles.iconBackground, styles.iconBackgroundLight]}>
              <IconSymbol name="user" style={[styles.headerIcon, styles.headerIconLight]} />
            </View>
            <ThemedText type="title" style={[styles.headerTitle, styles.headerTextLight]}>
              {loginInfo.title}
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, styles.headerSubtitleLight]}>
              {loginInfo.subtitle}
            </ThemedText>
          </View>
        </ThemedView>
      }
    >
      <ThemedView style={[styles.sectionContainer, styles.lightContainer]}>
        {mainOptions.map((option, index) => {
          if (option.type === 'profileSection') {
            return (
              <ProfileItem
                key={option.uniqueKey}
                itemStyles={styles}
                IconSymbolComponent={IconSymbol}
                ThemedTextComponent={ThemedText}
              />
            );
          }

          if (option.type === 'settingsSection') {
            return (
              <SettingsItem
                key={option.uniqueKey}
                itemStyles={styles}
                IconSymbolComponent={IconSymbol}
                ThemedTextComponent={ThemedText}
                onPressOption={handleSettingsOptionPress}
              />
            );
          }

          return (
            <TouchableOpacity
              key={option.screen || option.title || index}
              style={[styles.optionButton, styles.lightBorder]}
              onPress={() => handleOptionPress(option.screen)}
              activeOpacity={0.7}
            >
              <IconSymbol name={option.icon} style={[styles.optionIcon, styles.optionIconLight]} />
              <View style={styles.optionTextContainer}>
                <ThemedText style={[styles.optionText, styles.textLight]}>{option.title}</ThemedText>
              </View>
              <IconSymbol name="chevron_right" style={[styles.optionArrow, styles.arrowLight]} />
            </TouchableOpacity>
          );
        })}
      </ThemedView>

      <ThemedView style={[styles.sectionContainer, styles.additionalInfoTopMargin, styles.lightContainerAlt]}>
        <ThemedText style={[styles.sectionTitle, styles.sectionTitleLight]}>Thông tin khác</ThemedText>
        {additionalInfoItemsData.map((item, index) => {
          console.log('Rendering item:', item);

          if (item.type === 'aboutSection') {
            return (
              <AboutItem
                key={item.uniqueKey}
                itemStyles={styles}
                IconSymbolComponent={IconSymbol}
                ThemedTextComponent={ThemedText}
              />
            );
          }

          return (
            <TouchableOpacity
              key={item.screen || item.title || index}
              style={[styles.optionButton, styles.lightBorder, index === additionalInfoItemsData.length - 1 ? styles.noBorderBottom : {}]}
              onPress={() => handleOptionPress(item.screen)}
              activeOpacity={0.7}
            >
              <IconSymbol name={item.icon} style={[styles.optionIcon, styles.optionIconLight]} />
              <ThemedText style={[styles.optionText, styles.textLight]}>{item.title}</ThemedText>
              <IconSymbol name="chevron_right" style={[styles.optionArrow, styles.arrowLight]} />
            </TouchableOpacity>
          );
        })}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  lightHeader: { backgroundColor: '#E3F2FD' },
  iconBackgroundLight: { backgroundColor: '#BBDEFB' },
  headerIconLight: { color: '#0D47A1' },
  headerTextLight: { color: '#1E293B' },
  headerSubtitleLight: { color: '#475569' },
  lightContainer: { backgroundColor: '#FFFFFF' },
  lightContainerAlt: { backgroundColor: '#F8F9FA' },
  lightBorder: { borderBottomColor: '#E5E7EB' },
  textLight: { color: '#1F2937' },
  descriptionLight: { color: '#6B7280' },
  trailingTextLight: { color: '#4B5563' },
  sectionTitleLight: { color: '#374151' },
  optionIconLight: { color: '#1D4ED8' },
  radioIconLight: { color: '#1D4ED8' },
  arrowLight: { color: '#9CA3AF' },
  expandedAreaLight: { backgroundColor: '#F9FAFB' },
  headerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  headerContent: { justifyContent: 'center', alignItems: 'center' },
  iconBackground: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerIcon: { fontSize: 40 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  headerSubtitle: { fontSize: 16 },
  sectionContainer: {},
  additionalInfoTopMargin: { marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 },
  optionWrapper: { borderBottomWidth: StyleSheet.hairlineWidth },
  optionButtonBase: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, backgroundColor: 'transparent' },
  optionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, backgroundColor: 'transparent' },
  noBorderBottom: { borderBottomWidth: 0 },
  optionIcon: { marginRight: 18, fontSize: 22, width: 28, textAlign: 'center' },
  optionTextContainer: { flex: 1, justifyContent: 'center' },
  optionText: { fontSize: 17, flex: 1 },
  optionTrailingText: { fontSize: 16, marginHorizontal: 8 },
  optionArrow: { fontSize: 20 },
  arrowExpanded: { transform: [{ rotate: '90deg' }] },
  expandedArea: { paddingHorizontal: 20, paddingBottom: 15, paddingTop: 5 },
  themeChoiceButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  radioIcon: { fontSize: 20, marginRight: 12 },
  themeChoiceText: { fontSize: 16 },
  iconStyle: {},
});