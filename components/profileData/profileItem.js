// ProfileItem.js
import { app } from '@/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile // Để cập nhật displayName của Auth user nếu muốn
} from 'firebase/auth';
import { getDatabase, onValue, ref, set, update } from 'firebase/database';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Text as DefaultText, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthModal } from '../AuthModal'; // Giả sử đường dẫn này đúng

const profileStaticData = {
  id: 'profile',
  title: 'Hồ sơ',
  icon: 'user',
  description: 'Tên người dùng: Chưa đăng nhập\nEmail: Chưa đăng nhập\nNgày tham gia: Chưa đăng nhập',
};

export const ProfileItem = ({
  itemStyles, // Styles được truyền từ ProfileComponents
  IconSymbolComponent,
  ThemedTextComponent = DefaultText,
}) => {
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Chưa đăng nhập',
    email: 'Chưa đăng nhập',
    joinDate: 'Chưa đăng nhập',
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

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

          const fetchedName = data?.name || user.displayName || user.email?.split('@')[0] || 'Người dùng mới';

          setUserData({
            name: fetchedName,
            email: user.email || 'N/A',
            joinDate: data?.joinDate || creationTime,
          });
          setCurrentUserName(fetchedName);
          setNewName(fetchedName);
        };
        onValue(userRef, onValueCallback, (error) => {
          console.error("Firebase onValue error:", error);
          // Xử lý lỗi đọc dữ liệu nếu cần
        });
      } else {
        setIsLoggedIn(false);
        setUserData({
          name: 'Chưa đăng nhập',
          email: 'Chưa đăng nhập',
          joinDate: 'Chưa đăng nhập',
        });
        setCurrentUserName('');
        setNewName('');
        setIsEditingName(false);
      }
    });
    return () => unsubscribe();
  }, [auth, database]);

  const toggleProfileExpansion = () => {
    if (isEditingName && isProfileExpanded) {
      setIsEditingName(false);
      setNewName(currentUserName);
    }
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
        } else if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(error.code)) {
            errorMessage = "Email hoặc mật khẩu không chính xác.";
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
        const creationTime = user.metadata.creationTime
            ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN')
            : new Date().toLocaleDateString('vi-VN');

        const initialName = email.split('@')[0] || 'Người dùng mới';
        // Cập nhật displayName trong Firebase Auth (tùy chọn)
        updateProfile(user, { displayName: initialName }).catch(e => console.error("Lỗi cập nhật displayName Auth:", e));

        const newUserProfileData = {
            name: initialName,
            email: user.email,
            joinDate: creationTime
        };
        const userDatabaseRef = ref(database, `users/${user.uid}`);
        set(userDatabaseRef, newUserProfileData)
        .then(() => {
            Alert.alert("Đăng ký thành công", `Tài khoản ${user.email} đã được tạo với tên là "${initialName}"! Bạn có thể thay đổi tên trong hồ sơ.`);
            setIsRegisterModalVisible(false);
            resetFormFields();
        })
        .catch((dbError) => {
            console.error(`Lỗi ghi DB: ${dbError.code}`, dbError.message);
            Alert.alert("Lỗi Cơ sở dữ liệu", `Không thể lưu thông tin: ${dbError.message}`);
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

  const handleSaveName = useCallback(async () => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      Alert.alert("Thông báo", "Tên không được để trống.");
      return;
    }
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      try {
        // Cập nhật tên trong Realtime Database
        await update(userRef, { name: trimmedNewName });
        // Cập nhật displayName trong Firebase Auth (tùy chọn, nhưng nên làm để đồng bộ)
        await updateProfile(user, { displayName: trimmedNewName });

        Alert.alert("Thành công", "Tên đã được cập nhật.");
        setIsEditingName(false);
        setCurrentUserName(trimmedNewName);
        // setUserData sẽ được cập nhật qua listener onValue,
        // nhưng chúng ta cũng có thể cập nhật cục bộ ngay để UI phản hồi nhanh hơn
        setUserData(prev => ({ ...prev, name: trimmedNewName }));
      } catch (error) {
        console.error("Lỗi cập nhật tên:", error.message);
        Alert.alert("Lỗi", "Không thể cập nhật tên. Vui lòng thử lại.");
      }
    }
  }, [auth, database, newName]);

  const openLoginModal = useCallback(() => { resetFormFields(); setIsLoginModalVisible(true); }, [resetFormFields]);
  const openRegisterModal = useCallback(() => { resetFormFields(); setIsRegisterModalVisible(true); }, [resetFormFields]);
  const handleLogout = useCallback(() => {
    signOut(auth).then(() => {
      Alert.alert("Đã đăng xuất", "Bạn đã đăng xuất thành công.");
      // Các state sẽ tự reset trong useEffect -> onAuthStateChanged
    }).catch((error) => {
      console.error("Lỗi đăng xuất:", error.code, error.message);
      Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
    });
  }, [auth]);

  const option = profileStaticData;
  // Sử dụng itemStyles được truyền từ ProfileComponents, không cần merge ở đây nữa
  // vì ProfileComponents đã merge StyleSheet của nó với defaultItemStyles và modalFormStyles
  const stylesToUse = itemStyles;

  return (
    <View style={[stylesToUse.optionWrapper, stylesToUse.lightBorder]}>
      <TouchableOpacity
        style={stylesToUse.optionButtonBase}
        onPress={toggleProfileExpansion}
        activeOpacity={0.7}
      >
        {IconSymbolComponent && <IconSymbolComponent
          name={option.icon}
          style={[stylesToUse.optionIcon, stylesToUse.optionIconLight]}
        />}
        <ThemedTextComponent style={[stylesToUse.optionText, stylesToUse.textLight]}>
          {option.title}
        </ThemedTextComponent>
        <IconSymbolComponent
          name="chevron_right"
          style={[stylesToUse.optionArrow, isProfileExpanded && stylesToUse.arrowExpanded, stylesToUse.arrowLight]}
        />
      </TouchableOpacity>

      {isProfileExpanded && (
        <View style={[stylesToUse.expandedArea, stylesToUse.expandedAreaLight]}>
          <View style={stylesToUse.profileInfoContainer}>
            {isLoggedIn ? (
              <>
                {isEditingName ? (
                  <View style={stylesToUse.editNameContainer}>
                    <ThemedTextComponent style={[stylesToUse.label, stylesToUse.descriptionLight]}>Tên người dùng:</ThemedTextComponent>
                    <TextInput
                      style={[stylesToUse.input, stylesToUse.nameInput]} // Sử dụng style input từ ProfileComponents
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="Nhập tên mới"
                      placeholderTextColor={stylesToUse.placeholderText?.color || '#8A8A8E'}
                      autoFocus={true}
                    />
                    <View style={stylesToUse.editNameActions}>
                      <TouchableOpacity
                        style={[stylesToUse.actionButton, stylesToUse.saveButton]}
                        onPress={handleSaveName}
                      >
                        {IconSymbolComponent && <IconSymbolComponent name="save" style={stylesToUse.actionButtonIcon} />}
                        <ThemedTextComponent style={stylesToUse.actionButtonText}>Lưu</ThemedTextComponent>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[stylesToUse.actionButton, stylesToUse.cancelButton]}
                        onPress={() => {
                          setIsEditingName(false);
                          setNewName(currentUserName);
                        }}
                      >
                         {IconSymbolComponent && <IconSymbolComponent name="cancel" style={stylesToUse.actionButtonIcon} />}
                        <ThemedTextComponent style={[stylesToUse.actionButtonText, stylesToUse.cancelButtonText]}>Hủy</ThemedTextComponent>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={stylesToUse.infoRow}>
                    <ThemedTextComponent style={[stylesToUse.profileDescription, stylesToUse.descriptionLight]}>
                      Tên người dùng: {userData.name}
                    </ThemedTextComponent>
                    <TouchableOpacity onPress={() => { setIsEditingName(true); setNewName(userData.name); }} style={stylesToUse.editIconTouchable}>
                      {IconSymbolComponent && <IconSymbolComponent name="pencil" style={stylesToUse.editIcon} />}
                    </TouchableOpacity>
                  </View>
                )}
                <View style={stylesToUse.infoRowNoEdit || stylesToUse.infoRow}>
                    <ThemedTextComponent style={[stylesToUse.profileDescription, stylesToUse.descriptionLight]}>
                    Email: {userData.email}
                    </ThemedTextComponent>
                </View>
                <View style={stylesToUse.infoRowNoEdit || stylesToUse.infoRow}>
                    <ThemedTextComponent style={[stylesToUse.profileDescription, stylesToUse.descriptionLight]}>
                    Ngày tham gia: {userData.joinDate}
                    </ThemedTextComponent>
                </View>
              </>
            ) : (
              <ThemedTextComponent style={[stylesToUse.profileDescription, stylesToUse.descriptionLight]}>
                {/* Hiển thị text mặc định khi chưa đăng nhập, userData đã được set ở useEffect */}
                Tên người dùng: {userData.name}{'\n'}Email: {userData.email}{'\n'}Ngày tham gia: {userData.joinDate}
              </ThemedTextComponent>
            )}
          </View>

          {isLoggedIn && (
            <TouchableOpacity
              style={[stylesToUse.authActionButton, stylesToUse.logoutButton]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              {IconSymbolComponent && <IconSymbolComponent name="logout" style={stylesToUse.authActionIcon} />}
              <ThemedTextComponent style={stylesToUse.authActionButtonText}>
                Đăng xuất
              </ThemedTextComponent>
            </TouchableOpacity>
          )}

          {!isLoggedIn && (
            <View style={stylesToUse.authActionsContainer}>
              <TouchableOpacity
                style={[stylesToUse.authActionButton, stylesToUse.loginActionButton]}
                onPress={openLoginModal}
                activeOpacity={0.7}
              >
                {IconSymbolComponent && <IconSymbolComponent name="login" style={stylesToUse.authActionIcon} />}
                <ThemedTextComponent style={stylesToUse.authActionButtonText}>
                  Đăng nhập
                </ThemedTextComponent>
              </TouchableOpacity>
              <TouchableOpacity
                style={[stylesToUse.authActionButton, stylesToUse.registerActionButton]}
                onPress={openRegisterModal}
                activeOpacity={0.7}
              >
                {IconSymbolComponent && <IconSymbolComponent name="person_add" style={stylesToUse.authActionIcon} />}
                <ThemedTextComponent style={stylesToUse.authActionButtonText}>
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
        styles={stylesToUse}
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
        styles={stylesToUse}
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