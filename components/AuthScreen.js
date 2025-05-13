import { database, auth as firebaseAuth } from '../firebaseConfig';
import { copyDefaultCategoriesToUserAccount } from '../app/utils/firebaseUserUtils';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { ref, set } from "firebase/database";
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
const MAU_VANG_NUT_CHINH = '#FFD700'; // Màu vàng giống header, hoặc màu bạn chọn

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [errorMessage, setErrorMessage] = useState(''); // New state for error messages

  const handleLoginAttempt = useCallback(async () => {
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập email và mật khẩu');
      return;
    }
    setIsLoggingIn(true);
    setErrorMessage(''); // Clear previous errors
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
      console.error("Lỗi Đăng nhập:", error.code, error.message);
      if (error.code === 'auth/invalid-credential') {
        setErrorMessage('Email hoặc mật khẩu không đúng');
      } else {
        setErrorMessage('Đã có lỗi xảy ra, vui lòng thử lại');
      }
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

      try {
      // Thay 'default_categories' bằng đường dẫn thực tế nếu cần
      const categoriesAdded = await copyDefaultCategoriesToUserAccount(user.uid, 'categories');
      if (categoriesAdded) {
        console.log(`Categories mặc định đã được thêm cho người dùng ${user.uid} từ AuthScreen.`);
      } else {
        console.warn(`Không tìm thấy dữ liệu categories mặc định để thêm cho người dùng ${user.uid}.`);
        // Bạn có thể muốn thông báo cho người dùng hoặc ghi nhận lỗi này
      }
    } catch (categoryError) {
      console.error(`Lỗi khi thêm categories mặc định cho người dùng ${user.uid} từ AuthScreen:`, categoryError);
      // Xử lý lỗi này tùy theo logic ứng dụng của bạn
      // Ví dụ: setErrorMessage('Đăng ký thành công, nhưng có lỗi khi thiết lập danh mục mẫu.');
    }
    } catch (error) {
      console.error("Lỗi Đăng ký:", error.code, error.message);
    } finally {
      setIsRegistering(false);
    }
  }, [email, password, firebaseAuth]);

  const handlePasswordReset = useCallback(async () => {
    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn');
      return;
    }
    setIsSendingResetEmail(true);
    setErrorMessage(''); // Clear previous errors
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setErrorMessage('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn');
    } catch (error) {
      console.error("Lỗi Gửi Email Đặt Lại Mật Khẩu:", error.code, error.message);
      setErrorMessage('Không tìm thấy email hoặc có lỗi xảy ra');
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
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {authMode !== 'forgotPassword' ? (
            <TouchableOpacity
              style={[
                styles.button,
                styles.mainActionButtonYellow,
                isAnySubmitting && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isAnySubmitting}
              activeOpacity={0.8}
            >
              {(isLoggingIn && authMode === 'login') || (isRegistering && authMode === 'register') ? (
                <ActivityIndicator color={'#333'} />
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
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 48,
    justifyContent: 'center'
  },
  mainActionButtonYellow: {
    backgroundColor: MAU_VANG_NUT_CHINH,
  },
  mainActionButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  forgotPasswordButton: {
    backgroundColor: '#6c757d',
  },
  buttonTextWhite: {
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
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});