import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ParallaxScrollView from './ParallaxScrollView'; // Giả sử đây là đường dẫn hợp lệ
import { ThemedText } from './ThemedText'; // Giả sử component này không tự đổi theme
import { ThemedView } from './ThemedView'; // Giả sử component này không tự đổi theme

import {
  AboutItem,
  categoryItem,
  DarkModeSectionUI,
  policyItem,
  ProfileItem, // Cập nhật import
  settingsItem,
  termsItem,
  themeItem,
} from '../components/profileData';

const IconSymbol = ({ name, style, isSelected }) => {
  const icons = {
    user: '👤',
    cog: '⚙️',
    chevron_right: '>',
    shield_check: '🛡️',
    question_circle: '❓',
    palette: '🎨',
    list_alt: '🗂️',
    file_contract: '📜',
    info_circle: 'ℹ️',
    moon: '🌙',
    sun: '☀️',
    radio_on: '◉',
    radio_off: '○',
  };
  let iconToRender = icons[name] || '?';
  if (name === 'moon' && isSelected === 'Sáng') {
    iconToRender = icons['sun'];
  }
  return <Text style={[styles.iconStyle, style]}>{iconToRender}</Text>;
};

export default function ProfileComponents() {
  const loginInfo = {
    title: 'Tài khoản của tôi',
    subtitle: 'Quản lý thông tin cá nhân và cài đặt',
  };

  const mainOptions = [
    { type: 'profileSection', uniqueKey: 'profileSectionKey' }, // Sử dụng type để render ProfileItem
    themeItem,
    categoryItem,
    { type: 'darkModeSection', uniqueKey: 'darkModeSectionKey' },
    settingsItem,
  ];

  const additionalInfoItemsData = [
    { type: 'aboutSection', uniqueKey: 'aboutSectionKey' },
    termsItem,
    policyItem,
  ];

  const handleOptionPress = (screen) => {
    if (screen) {
      console.log(`Navigating to ${screen}`);
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
          // Xử lý mục đặc biệt cho ProfileItem
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

          if (option.type === 'darkModeSection') {
            return (
              <DarkModeSectionUI
                key={option.uniqueKey}
                itemStyles={styles}
                IconSymbolComponent={IconSymbol}
                ThemedTextComponent={ThemedText}
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

// StyleSheet không thay đổi
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
  darkModeDescription: { fontSize: 14, marginBottom: 15, lineHeight: 20 },
  themeChoiceButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  radioIcon: { fontSize: 20, marginRight: 12 },
  themeChoiceText: { fontSize: 16 },
  iconStyle: {},
});