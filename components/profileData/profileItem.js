// ProfileItem.js
import { app } from '@/firebaseConfig';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'; // Thêm signOut
import { getDatabase, onValue, ref, set } from 'firebase/database';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Text as DefaultText, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AuthModal } from '../AuthModal';

const profileStaticData = {
  id: 'profile',
  title: 'Hồ sơ',
  icon: 'user', // Sẽ dùng '👤' từ IconSymbol
  description: 'Tên người dùng: Chưa đăng nhập\nEmail: Chưa đăng nhập\nNgày tham gia: Chưa đăng nhập',
};

export const ProfileItem = ({
  itemStyles,
  IconSymbolComponent,
  ThemedTextComponent = DefaultText,
}) => {
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [userData, setUserData] = useState(profileStaticData.description);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const auth = getAuth(app);
  const database = getDatabase(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        const userRef = ref(database, `users/${user.uid}`);
        const onValueCallback = (snapshot) => {
          const data = snapshot.val();
          const creationTime = user.metadata.creationTime
            ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN')
            : new Date().toLocaleDateString('vi-VN');

          setUserData({
            name: data?.name || user.email || 'Người dùng mới',
            email: user.email,
            joinDate: data?.joinDate || creationTime,
          });
        };
        onValue(userRef, onValueCallback);
      } else {
        setIsLoggedIn(false);
        setUserData(profileStaticData.description);
      }
    });
    return () => unsubscribe();
  }, [auth, database]);

  const toggleProfileExpansion = () => {
    setIsProfileExpanded(prev => !prev);
  };

  const resetFormFields = useCallback(() => {
    setEmail('');
    setPassword('');
  }, []);

  const handleLoginAttempt = useCallback(() => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập email và mật khẩu.");
      return;
    }
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        Alert.alert("Đăng nhập thành công", `Chào mừng ${userCredential.user.email}!`);
        setIsLoginModalVisible(false);
        resetFormFields();
      })
      .catch((error) => {
        console.error("Lỗi đăng nhập Firebase Auth:", error.code, error.message);
        let errorMessage = "Email hoặc mật khẩu không đúng.";
        if (error.code === 'auth/invalid-email') {
            errorMessage = "Địa chỉ email không hợp lệ.";
        } else if (error.code === 'auth/user-disabled'){
            errorMessage = "Tài khoản này đã bị vô hiệu hóa.";
        }
        Alert.alert("Lỗi đăng nhập", errorMessage);
      });
  }, [auth, email, password, resetFormFields]);

  const handleRegisterAttempt = useCallback(() => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập email và mật khẩu.");
      return;
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const creationTime = new Date(user.metadata.creationTime).toLocaleDateString('vi-VN');
        const newUserProfileData = { name: user.email, email: user.email, joinDate: creationTime };
        const userDatabaseRef = ref(database, `users/${user.uid}`);
        set(userDatabaseRef, newUserProfileData)
        .then(() => {
            Alert.alert("Đăng ký thành công", `Tài khoản ${user.email} đã được tạo!`);
            setIsRegisterModalVisible(false);
            resetFormFields();
        })
        .catch((dbError) => {
            console.error(`Lỗi ghi DB: ${dbError.code}`, dbError.message);
            Alert.alert("Lỗi Cơ sở dữ liệu", `Không thể lưu thông tin: ${dbError.message}`);
            setIsRegisterModalVisible(false);
            resetFormFields();
        });
      })
      .catch((error) => {
        console.error("Lỗi đăng ký Auth:", error.code, error.message);
        let errorMessage = "Lỗi đăng ký.";
        if (error.code === 'auth/email-already-in-use') errorMessage = "Email đã được sử dụng.";
        else if (error.code === 'auth/invalid-email') errorMessage = "Email không hợp lệ.";
        else if (error.code === 'auth/weak-password') errorMessage = "Mật khẩu yếu (ít nhất 6 ký tự).";
        Alert.alert("Lỗi đăng ký", errorMessage);
      });
  }, [auth, database, email, password, resetFormFields]);

  const openLoginModal = useCallback(() => {
    resetFormFields();
    setIsLoginModalVisible(true);
  }, [resetFormFields]);

  const openRegisterModal = useCallback(() => {
    resetFormFields();
    setIsRegisterModalVisible(true);
  }, [resetFormFields]);

  const handleLogout = useCallback(() => {
    signOut(auth).then(() => {
      Alert.alert("Đã đăng xuất", "Bạn đã đăng xuất thành công.");
    }).catch((error) => {
      console.error("Lỗi đăng xuất:", error.code, error.message);
      Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
    });
  }, [auth]);

  const option = profileStaticData;
  const styles = { ...defaultItemStyles, ...itemStyles, ...modalFormStyles };

  return (
    <View style={[styles.optionWrapper, styles.lightBorder]}>
      <TouchableOpacity
        style={styles.optionButtonBase}
        onPress={toggleProfileExpansion}
        activeOpacity={0.7}
      >
        {IconSymbolComponent && <IconSymbolComponent
          name={option.icon} // 'user' -> '👤'
          style={[styles.optionIcon, styles.optionIconLight]}
        />}
        <ThemedTextComponent style={[styles.optionText, styles.textLight]}>
          {option.title}
        </ThemedTextComponent>
      <IconSymbolComponent
          name="chevron_right"
          style={[styles.optionArrow, isProfileExpanded && styles.arrowExpanded, styles.arrowLight]}
        />
      </TouchableOpacity>

      {isProfileExpanded && (
        <View style={[styles.expandedArea, styles.expandedAreaLight]}>
          <View style={styles.profileInfoContainer}>
            {isLoggedIn ? (
              <>
                <ThemedTextComponent style={[styles.profileDescription, styles.descriptionLight]}>
                  Tên người dùng: {userData.email}
                </ThemedTextComponent>
                <ThemedTextComponent style={[styles.profileDescription, styles.descriptionLight]}>
                  Email: {userData.email}
                </ThemedTextComponent>
                <ThemedTextComponent style={[styles.profileDescription, styles.descriptionLight]}>
                  Ngày tham gia: {userData.joinDate}
                </ThemedTextComponent>
              </>
            ) : (
              <ThemedTextComponent style={[styles.profileDescription, styles.descriptionLight]}>
                {userData}
              </ThemedTextComponent>
            )}
          </View>

          {isLoggedIn && (
            <TouchableOpacity
              style={[styles.authActionButton, styles.logoutButton]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              {IconSymbolComponent && <IconSymbolComponent name="logout" style={styles.authActionIcon} />}
              <ThemedTextComponent style={styles.authActionButtonText}>
                Đăng xuất
              </ThemedTextComponent>
            </TouchableOpacity>
          )}

          {!isLoggedIn && (
            <View style={styles.authActionsContainer}>
              <TouchableOpacity
                style={[styles.authActionButton, styles.loginActionButton]}
                onPress={openLoginModal}
                activeOpacity={0.7}
              >
                {IconSymbolComponent && <IconSymbolComponent name="login" style={styles.authActionIcon} />}
                <ThemedTextComponent style={styles.authActionButtonText}>
                  Đăng nhập
                </ThemedTextComponent>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authActionButton, styles.registerActionButton]}
                onPress={openRegisterModal}
                activeOpacity={0.7}
              >
                 {IconSymbolComponent && <IconSymbolComponent name="person_add" style={styles.authActionIcon} />}
                <ThemedTextComponent style={styles.authActionButtonText}>
                  Đăng ký
                </ThemedTextComponent>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <AuthModal
        visible={isLoginModalVisible}
        onClose={() => setIsLoginModalVisible(false)}
        onSubmit={handleLoginAttempt}
        isLogin={true}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        ThemedTextComponent={ThemedTextComponent}
        styles={styles}
      />
      <AuthModal
        visible={isRegisterModalVisible}
        onClose={() => setIsRegisterModalVisible(false)}
        onSubmit={handleRegisterAttempt}
        isLogin={false}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        ThemedTextComponent={ThemedTextComponent}
        styles={styles}
      />
    </View>
  );
};

// Cập nhật StyleSheet
const defaultItemStyles = StyleSheet.create({
  // ... (giữ nguyên các style khác của bạn)
  optionWrapper: { backgroundColor: 'white', borderRadius: 8, marginVertical: 5, elevation: 1, shadowColor: '#000', shadowOpacity:0.1, shadowOffset: {width:0, height:1}, shadowRadius:2  },
  lightBorder: { borderColor: '#e0e0e0', borderWidth: StyleSheet.hairlineWidth },
  optionButtonBase: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, },
  optionIcon: { fontSize: 20, marginRight: 15, width: 24, textAlign: 'center' }, // Điều chỉnh fontSize nếu cần cho emoji
  optionIconLight: { color: '#424242' },
  optionText: { flex: 1, fontSize: 16 },
  textLight: { color: '#212121' },
  optionArrow: { fontSize: 18, color: '#757575' }, // Điều chỉnh fontSize cho emoji mũi tên
  arrowLight: { color: '#757575' },
  expandedArea: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, borderTopColor: '#eeeeee', borderTopWidth:StyleSheet.hairlineWidth },
  expandedAreaLight: { backgroundColor: '#f9f9f9' },
  profileInfoContainer: { marginBottom: 15, alignItems: 'center', }, // Căn giữa thông tin user
  profileDescription: { fontSize: 14, lineHeight: 22, textAlign: 'left', color: '#424242' },
  descriptionLight: { color: '#424242' },
});

const modalFormStyles = StyleSheet.create({
  // ... (giữ nguyên các style khác của bạn)
  authActionsContainer: { flexDirection: 'row', justifyContent: 'center', paddingTop: 10, marginTop:10, gap: 15 }, // Căn giữa và thêm gap
  authActionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2, },
  loginActionButton: { backgroundColor: '#007AFF', },
  registerActionButton: { backgroundColor: '#34C759', },
  logoutButton: { // Style cho nút đăng xuất mới
    backgroundColor: '#FF3B30', // Màu đỏ cho hành động nguy hiểm/đăng xuất
    marginTop: 10, // Khoảng cách với phần thông tin user
    alignSelf: 'center', // Căn giữa nút đăng xuất
    minWidth: 180, // Độ rộng tối thiểu
    justifyContent: 'center', // Căn giữa nội dung nút
  },
  authActionIcon: { color: '#FFFFFF', fontSize: 18, marginRight: 8, }, // Emoji có thể không nhận color
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