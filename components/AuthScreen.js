// components/AuthScreen.js
import { database, auth as firebaseAuth } from '@/firebaseConfig';
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { ref, set } from "firebase/database";
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const MAU_VANG_NUT_CHINH = '#FFD700'; // Màu vàng giống header, hoặc màu bạn chọn
// const MAU_VANG_NUT_DANG_KY = '#FFC107'; // Bạn có thể dùng màu này nếu muốn nút đăng ký khác một chút

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // ... (các hàm handleLoginAttempt, handleRegisterAttempt, handlePasswordReset giữ nguyên)
  const handleLoginAttempt = useCallback(async () => {
    if (!email || !password) {
      return;
    }
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
      console.error("Lỗi Đăng nhập:", error.code, error.message);
    } finally {
      setIsLoggingIn(false);
    }
  }, [email, password]);

  const handleRegisterAttempt = useCallback(async () => {
    if (!email || !password) {
      return;
    }
    if (password.length < 6) {
      return;
    }
    setIsRegistering(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      const creationTime = user.metadata.creationTime
                           ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN')
                           : new Date().toLocaleDateString('vi-VN');
      const newUserProfileData = { name: user.email, email: user.email, joinDate: creationTime, uid: user.uid };
      const userDatabaseRef = ref(database, `users/${user.uid}`);
      await set(userDatabaseRef, newUserProfileData);
    } catch (error) {
      console.error("Lỗi Đăng ký:", error.code, error.message);
    } finally {
      setIsRegistering(false);
    }
  }, [email, password]);

  const handlePasswordReset = useCallback(async () => {
    if (!email) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập địa chỉ email của bạn.");
      return;
    }
    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      Alert.alert("Kiểm tra Email", "Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn (nếu tài khoản tồn tại).");
    } catch (error) {
      console.error("Lỗi Gửi Email Đặt Lại Mật Khẩu:", error.code, error.message);
    } finally {
      setIsSendingResetEmail(false);
    }
  }, [email]);


  const isAnySubmitting = isLoggingIn || isRegistering || isSendingResetEmail;

  const handleSubmit = () => {
    if (authMode === 'login') {
      handleLoginAttempt();
    } else { // authMode === 'register'
      handleRegisterAttempt();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <View style={styles.outerContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {authMode === 'login' && 'Đăng Nhập'}
            {authMode === 'register' && 'Đăng Ký Tài Khoản'}
            {authMode === 'forgotPassword' && 'Đặt Lại Mật Khẩu'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
            editable={!isAnySubmitting}
          />
          {authMode !== 'forgotPassword' && (
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              editable={!isAnySubmitting}
            />
          )}

          {authMode !== 'forgotPassword' ? (
            <TouchableOpacity
              style={[
                styles.button,
                // Cả hai nút đăng nhập và đăng ký chính đều dùng màu vàng
                styles.mainActionButtonYellow, // Style mới cho nút màu vàng
                isAnySubmitting && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isAnySubmitting}
              activeOpacity={0.8}
            >
              {(isLoggingIn && authMode === 'login') || (isRegistering && authMode === 'register') ? (
                <ActivityIndicator color={'#333'} /> // Chữ/Spinner màu đậm trên nền vàng
              ) : (
                <Text style={styles.mainActionButtonText}>
                  {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.forgotPasswordButton, isAnySubmitting && styles.buttonDisabled]}
              onPress={handlePasswordReset}
              disabled={isAnySubmitting}
              activeOpacity={0.8}
            >
              {isSendingResetEmail ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonTextWhite}>Gửi liên kết đặt lại</Text>
              )}
            </TouchableOpacity>
          )}

          {authMode === 'login' && (
            <View style={styles.linksContainer}>
              <TouchableOpacity
                onPress={() => setAuthMode('register')}
                disabled={isAnySubmitting}
                style={styles.switchButton}
              >
                <Text style={styles.switchButtonText}>Chưa có tài khoản? Đăng ký</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAuthMode('forgotPassword')}
                disabled={isAnySubmitting}
                style={styles.switchButton}
              >
                <Text style={styles.switchButtonText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>
          )}

          {authMode === 'register' && (
            <TouchableOpacity
              onPress={() => setAuthMode('login')}
              disabled={isAnySubmitting}
              style={styles.switchButtonFullWidth}
            >
              <Text style={styles.switchButtonText}>Đã có tài khoản? Đăng nhập</Text>
            </TouchableOpacity>
          )}

          {authMode === 'forgotPassword' && (
            <TouchableOpacity
              onPress={() => setAuthMode('login')}
              disabled={isAnySubmitting}
              style={styles.switchButtonFullWidth}
            >
              <Text style={styles.switchButtonText}>Quay lại Đăng nhập</Text>
            </TouchableOpacity>
          )}

        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1 },
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1F2937',
  },
  input: {
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 48,
    justifyContent: 'center'
  },
  // Style mới cho các nút hành động chính (Đăng nhập, Đăng ký) có màu vàng
  mainActionButtonYellow: {
    backgroundColor: MAU_VANG_NUT_CHINH,
  },
  // Style cho text của các nút hành động chính màu vàng
  mainActionButtonText: {
    color: '#333', // Chữ màu đen/đậm để dễ đọc trên nền vàng
    fontWeight: '600',
    fontSize: 16,
  },
  forgotPasswordButton: {
    backgroundColor: '#6c757d', // Màu xám cho nút quên mật khẩu
  },
  buttonTextWhite: { // Dành cho các nút có nền tối, chữ trắng
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  switchButton: {
    paddingVertical: 10,
  },
  switchButtonFullWidth: {
    marginTop: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#007AFF', // Màu xanh dương mặc định của iOS cho link, hoặc bạn có thể chọn màu khác
    fontSize: 14,
    fontWeight: '500',
  },
});