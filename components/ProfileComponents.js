// ProfileComponents.js
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { app } from '../firebaseConfig'; // Đường dẫn tới firebaseConfig
import ParallaxScrollView from './ParallaxScrollView'; // Đường dẫn tới ParallaxScrollView
import { ThemedText } from './ThemedText'; // Đường dẫn tới ThemedText
import { ThemedView } from './ThemedView'; // Đường dẫn tới ThemedView

import {
  AboutItem,
  categoryItem,
  policyItem,
  ProfileItem, // Import ProfileItem từ vị trí mới nếu cần
  SettingsItem,
  termsItem,
  themeItem,
} from '../components/profileData'; // Đường dẫn tới profileData

// IconSymbol được định nghĩa ngay trong file này
const IconSymbol = ({ name, style }) => {
  const icons = {
    user: '👤',
    cog: '⚙️',
    chevron_right: '❯',
    expand_more: '⌄',
    expand_less: '⌃',
    shield_check: '🛡️',
    question_circle: '❓',
    palette: '🎨',
    list_alt: '🗂️',
    file_contract: '📜',
    info_circle: 'ℹ️',
    bell: '🔔',
    language: '🌐',
    logout: '↪️',
    login: '🔑',
    person_add: '➕👤',
    pencil: '✏️',   // Icon chỉnh sửa
    save: '💾',     // Icon lưu
    cancel: '❌',   // Icon hủy
  };
  let iconToRender = icons[name] || '?';
  return <Text style={[styles.iconStyle, style]}>{iconToRender}</Text>; // Sử dụng styles.iconStyle từ StyleSheet bên dưới
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
          // Ưu tiên tên từ DB, sau đó displayName từ Auth, rồi đến email
          const nameToDisplay = data?.name || user.displayName || user.email?.split('@')[0] || defaultLoginInfo.title;
          setLoginInfo({
            title: nameToDisplay,
            subtitle: defaultLoginInfo.subtitle,
          });
        }, (error) => {
            console.error("Firebase onValue error in ProfileComponents:", error);
            setLoginInfo(defaultLoginInfo); // Fallback to default if error
        });
      } else {
        setLoginInfo(defaultLoginInfo);
      }
    });
    return () => unsubscribe();
  }, [auth, database]); // Thêm defaultLoginInfo.title vào dependencies nếu nó có thể thay đổi

  const handleOptionPress = (screen) => {
    if (screen) {
      console.log(`Navigating to ${screen}`);
      // Thực hiện điều hướng ở đây, ví dụ: navigation.navigate(screen)
    }
  };

  const handleSettingsOptionPress = (optionTitle) => {
    console.log(`Selected settings option: ${optionTitle}`);
    // Xử lý các lựa chọn cài đặt
  };

  // Merge tất cả các StyleSheet cần thiết
  const mergedStyles = {
    ...styles, // Styles gốc của ProfileComponents
    ...defaultItemStyles, // Styles cho các item (ProfileItem, etc.)
    ...modalFormStyles, // Styles cho modal (AuthModal)
    ...profileEditStyles, // Styles cho phần chỉnh sửa tên trong ProfileItem
  };


  return (
    <ParallaxScrollView
      headerBackgroundColor={mergedStyles.lightHeader.backgroundColor}
      parallaxHeaderHeight={200} // Có thể điều chỉnh
      headerImage={
        <ThemedView style={[mergedStyles.headerContainer, mergedStyles.lightHeader]}>
          <View style={mergedStyles.headerContent}>
            <View style={[mergedStyles.iconBackground, mergedStyles.iconBackgroundLight]}>
              <IconSymbol name="user" style={[mergedStyles.headerIcon, mergedStyles.headerIconLight]} />
            </View>
            <ThemedText type="title" style={[mergedStyles.headerTitle, mergedStyles.headerTextLight]}>
              {loginInfo.title}
            </ThemedText>
            <ThemedText style={[mergedStyles.headerSubtitle, mergedStyles.headerSubtitleLight]}>
              {loginInfo.subtitle}
            </ThemedText>
          </View>
        </ThemedView>
      }
    >
      <ThemedView style={[mergedStyles.sectionContainer, mergedStyles.lightContainer]}>
        {mainOptions.map((option, index) => {
          if (option.type === 'profileSection') {
            return (
              <ProfileItem
                key={option.uniqueKey}
                itemStyles={mergedStyles} // Truyền styles đã merge
                IconSymbolComponent={IconSymbol}
                ThemedTextComponent={ThemedText}
              />
            );
          }
          if (option.type === 'settingsSection') {
            return (
              <SettingsItem
                key={option.uniqueKey}
                itemStyles={mergedStyles} // Truyền styles đã merge
                IconSymbolComponent={IconSymbol}
                ThemedTextComponent={ThemedText}
                onPressOption={handleSettingsOptionPress}
              />
            );
          }
          // Render các item khác
          return (
            <TouchableOpacity
              key={option.screen || option.title || index}
              style={[mergedStyles.optionButton, mergedStyles.lightBorder]}
              onPress={() => handleOptionPress(option.screen)}
              activeOpacity={0.7}
            >
              <IconSymbol name={option.icon} style={[mergedStyles.optionIcon, mergedStyles.optionIconLight]} />
              <View style={mergedStyles.optionTextContainer}>
                <ThemedText style={[mergedStyles.optionText, mergedStyles.textLight]}>{option.title}</ThemedText>
              </View>
              <IconSymbol name="chevron_right" style={[mergedStyles.optionArrow, mergedStyles.arrowLight]} />
            </TouchableOpacity>
          );
        })}
      </ThemedView>

      <ThemedView style={[mergedStyles.sectionContainer, mergedStyles.additionalInfoTopMargin, mergedStyles.lightContainerAlt]}>
        <ThemedText style={[mergedStyles.sectionTitle, mergedStyles.sectionTitleLight]}>Thông tin khác</ThemedText>
        {additionalInfoItemsData.map((item, index) => {
          if (item.type === 'aboutSection') {
            return (
              <AboutItem
                key={item.uniqueKey}
                itemStyles={mergedStyles} // Truyền styles đã merge
                IconSymbolComponent={IconSymbol}
                ThemedTextComponent={ThemedText}
              />
            );
          }
          return (
            <TouchableOpacity
              key={item.screen || item.title || index}
              style={[mergedStyles.optionButton, mergedStyles.lightBorder, index === additionalInfoItemsData.length - 1 ? mergedStyles.noBorderBottom : {}]}
              onPress={() => handleOptionPress(item.screen)}
              activeOpacity={0.7}
            >
              <IconSymbol name={item.icon} style={[mergedStyles.optionIcon, mergedStyles.optionIconLight]} />
              <ThemedText style={[mergedStyles.optionText, mergedStyles.textLight]}>{item.title}</ThemedText>
              <IconSymbol name="chevron_right" style={[mergedStyles.optionArrow, mergedStyles.arrowLight]} />
            </TouchableOpacity>
          );
        })}
      </ThemedView>
    </ParallaxScrollView>
  );
}

// StyleSheet gốc của ProfileComponents.js
const styles = StyleSheet.create({
  lightHeader: { backgroundColor: '#E3F2FD' },
  iconBackgroundLight: { backgroundColor: '#BBDEFB' },
  headerIconLight: { color: '#0D47A1' },
  headerTextLight: { color: '#1E293B' },
  headerSubtitleLight: { color: '#475569' },
  lightContainer: { backgroundColor: '#FFFFFF' },
  lightContainerAlt: { backgroundColor: '#F8F9FA' },
  // lightBorder đã có trong defaultItemStyles nên không cần ở đây nữa nếu dùng chung
  textLight: { color: '#1F2937' }, // textLight cũng có trong defaultItemStyles
  // descriptionLight cũng có trong defaultItemStyles
  trailingTextLight: { color: '#4B5563' },
  sectionTitleLight: { color: '#374151' },
  optionIconLight: { color: '#1D4ED8' }, // optionIconLight cũng có trong defaultItemStyles
  radioIconLight: { color: '#1D4ED8' },
  arrowLight: { color: '#9CA3AF' }, // arrowLight cũng có trong defaultItemStyles
  // expandedAreaLight cũng có trong defaultItemStyles

  headerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20 }, // Giảm paddingBottom một chút
  headerContent: { justifyContent: 'center', alignItems: 'center' },
  iconBackground: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }, // Giảm kích thước icon header
  headerIcon: { fontSize: 32 }, // Giảm kích thước icon header
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 }, // Giảm kích thước title
  headerSubtitle: { fontSize: 14 }, // Giảm kích thước subtitle
  sectionContainer: {
    // Removed: backgroundColor: '#FFFFFF', // Để ThemedView tự quản lý màu nền
  },
  additionalInfoTopMargin: { marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 },

  // optionWrapper, optionButtonBase, optionButton, noBorderBottom, optionIcon,
  // optionTextContainer, optionText, optionTrailingText, optionArrow, arrowExpanded,
  // expandedArea, themeChoiceButton, radioIcon, themeChoiceText
  // đã được định nghĩa trong defaultItemStyles nên không cần lặp lại ở đây nếu chúng giống hệt.

  iconStyle: {}, // Style chung cho IconSymbol nếu cần
});

// Các StyleSheet được copy từ file ProfileItem.js (hoặc import nếu tách file)
// Để đơn giản, tôi sẽ định nghĩa chúng lại ở đây.
// Trong một dự án thực tế, bạn có thể muốn tổ chức chúng vào các file riêng và import.

const defaultItemStyles = StyleSheet.create({
  optionWrapper: { backgroundColor: 'white', borderRadius: 8, marginVertical: 5, elevation: 1, shadowColor: '#000', shadowOpacity:0.1, shadowOffset: {width:0, height:1}, shadowRadius:2  },
  lightBorder: { borderColor: '#e0e0e0', borderWidth: StyleSheet.hairlineWidth },
  optionButtonBase: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, },
  optionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, backgroundColor: 'transparent' }, // Thêm từ styles gốc
  noBorderBottom: { borderBottomWidth: 0 }, // Thêm từ styles gốc
  optionTextContainer: { flex: 1, justifyContent: 'center' }, // Thêm từ styles gốc
  optionIcon: { fontSize: 20, marginRight: 15, width: 24, textAlign: 'center' },
  optionIconLight: { color: '#424242' },
  optionText: { flex: 1, fontSize: 16 },
  textLight: { color: '#212121' },
  optionTrailingText: { fontSize: 16, marginHorizontal: 8 }, // Thêm từ styles gốc
  optionArrow: { fontSize: 18, color: '#757575' },
  arrowLight: { color: '#757575' },
  arrowExpanded: { transform: [{ rotate: '90deg' }] },
  expandedArea: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, borderTopColor: '#eeeeee', borderTopWidth:StyleSheet.hairlineWidth },
  expandedAreaLight: { backgroundColor: '#f9f9f9' },
  profileInfoContainer: { marginBottom: 15, alignItems: 'stretch', },
  profileDescription: { fontSize: 14, lineHeight: 22, textAlign: 'left', color: '#424242', marginBottom: 3, },
  descriptionLight: { color: '#424242' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Tăng khoảng cách giữa các dòng
    width: '100%',
  },
  infoRowNoEdit: { // Dùng cho các dòng không có nút edit, để căn lề trái
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  editIconTouchable: {
    paddingLeft: 10, // Tăng vùng chạm cho icon edit
    paddingVertical: 5,
  },
  themeChoiceButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }, // Thêm từ styles gốc
  radioIcon: { fontSize: 20, marginRight: 12 }, // Thêm từ styles gốc
  themeChoiceText: { fontSize: 16 }, // Thêm từ styles gốc
});

const modalFormStyles = StyleSheet.create({
  authActionsContainer: { flexDirection: 'row', justifyContent: 'center', paddingTop: 10, marginTop:10, gap: 15 },
  authActionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2, },
  loginActionButton: { backgroundColor: '#007AFF', },
  registerActionButton: { backgroundColor: '#34C759', },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 15, // Tăng margin top
    alignSelf: 'center',
    minWidth: 180,
    justifyContent: 'center',
  },
  authActionIcon: { color: '#FFFFFF', fontSize: 18, marginRight: 8, },
  authActionButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal:15, },
  modalContainer: { width: '100%', maxWidth: 380, backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'stretch', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5, },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center', color: '#333333', },
  input: { height: 48, borderColor: '#D1D1D6', borderWidth: 1, borderRadius: 8, marginBottom: 15, paddingHorizontal: 12, fontSize: 16, backgroundColor: '#FFFFFF', color: '#000000', },
  placeholderText: { color: '#8A8A8E' },
  modalButton: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 10, },
  loginButtonModal: { backgroundColor: '#007AFF', },
  registerButtonModal: { backgroundColor: '#34C759', },
  cancelButtonModal: { backgroundColor: '#E5E5EA', },
  modalButtonText: { color: 'white', fontWeight: '600', fontSize: 15, },
  cancelButtonTextModal: { color: '#007AFF', }
});

const profileEditStyles = StyleSheet.create({
  editNameContainer: {
    width: '100%',
    marginBottom: 15,
    paddingVertical: 5,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#424242', // Đồng bộ màu với descriptionLight
  },
  nameInput: {
    // Styles cho TextInput khi chỉnh sửa tên, có thể kế thừa từ modalFormStyles.input
    // Ví dụ: backgroundColor: '#FAFAFA'
  },
  editNameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    minWidth: 90,
    justifyContent: 'center',
  },
  actionButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 6,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#FF6347',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButtonText: {
    // color: '#FF6347', // Nếu muốn màu chữ khác cho nút hủy
  },
  editIcon: {
    fontSize: 18,
    color: '#007AFF',
    // marginLeft: 8, // Không cần marginLeft nếu dùng space-between trong infoRow
  },
});
