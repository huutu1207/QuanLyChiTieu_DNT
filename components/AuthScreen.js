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
import { database, auth as firebaseAuth } from '../firebaseConfig';

const copyDefaultCategoriesToUserAccount = async (userId, categoriesPath) => {
  console.log(`(Placeholder) Sẽ copy categories mặc định cho user: ${userId} từ path: ${categoriesPath}`);
  return false;
};

const MAU_VANG_NUT_CHINH = '#FFD700';

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [errorMessage, setErrorMessage] = useState('');

  const clearFormState = (keepEmail = false) => {
    if (!keepEmail) setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  };

  const handleLoginAttempt = useCallback(async () => {
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setIsLoggingIn(true);
    setErrorMessage('');
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log("Đăng nhập thành công");
    } catch (error) {
      console.error("Lỗi Đăng nhập:", error.code, error.message);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMessage('Email hoặc mật khẩu không đúng.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Địa chỉ email không hợp lệ.');
      }
      else {
        setErrorMessage('Đã có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [email, password]);

  const handleRegisterAttempt = useCallback(async () => {
    if (!email || !password || !confirmPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ email, mật khẩu và xác nhận mật khẩu.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    setIsRegistering(true);
    setErrorMessage('');
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      const creationTime = user.metadata.creationTime
                            ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN')
                            : new Date().toLocaleDateString('vi-VN');

      const newUserProfileData = {
        name: user.email,
        email: user.email,
        joinDate: creationTime,
        uid: user.uid,
      };
      const userDatabaseRef = ref(database, `users/${user.uid}`);
      await set(userDatabaseRef, newUserProfileData);
      console.log("Thông tin người dùng đã được lưu vào Realtime Database.");

      try {
        const categoriesAdded = await copyDefaultCategoriesToUserAccount(user.uid, 'categories');
        if (categoriesAdded) {
          console.log(`Categories mặc định đã được thêm cho người dùng ${user.uid}.`);
        } else {
          console.warn(`Không tìm thấy hoặc không thể thêm categories mặc định cho người dùng ${user.uid}.`);
        }
      } catch (categoryError) {
        console.error(`Lỗi khi thêm categories mặc định cho người dùng ${user.uid}:`, categoryError);
      }

      console.log("Đăng ký thành công!");

    } catch (error) {
      console.error("Lỗi Đăng ký:", error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Địa chỉ email này đã được sử dụng.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Địa chỉ email không hợp lệ.');
      }
      else {
        setErrorMessage('Đã có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.');
      }
    } finally {
      setIsRegistering(false);
    }
  }, [email, password, confirmPassword]);

  const handlePasswordReset = useCallback(async () => {
    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }
    setIsSendingResetEmail(true);
    setErrorMessage('');
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setErrorMessage('Một email hướng dẫn đặt lại mật khẩu đã được gửi đến địa chỉ email của bạn (nếu tài khoản tồn tại). Vui lòng kiểm tra hộp thư, kể cả mục spam.');
    } catch (error) {
      console.error("Lỗi Gửi Email Đặt Lại Mật Khẩu:", error.code, error.message);
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('Không tìm thấy tài khoản nào ứng với địa chỉ email này.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Địa chỉ email không hợp lệ.');
      } else {
        setErrorMessage('Đã có lỗi xảy ra khi gửi email đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setIsSendingResetEmail(false);
    }
  }, [email]);

  const isAnySubmitting = isLoggingIn || isRegistering || isSendingResetEmail;

  const handleSubmit = () => {
    if (authMode === 'login') {
      handleLoginAttempt();
    } else {
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
            <>
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType={authMode === 'login' ? "password" : "newPassword"}
                autoComplete={authMode === 'login' ? 'password' : 'new-password'}
                editable={!isAnySubmitting}
              />
              {authMode === 'register' && (
                <TextInput
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                  editable={!isAnySubmitting}
                />
              )}
            </>
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
                <Text style={styles.buttonTextWhite}>Gửi email đặt lại</Text>
              )}
            </TouchableOpacity>
          )}

          {authMode === 'login' && (
            <View style={styles.linksContainer}>
              <TouchableOpacity
                onPress={() => { setAuthMode('register'); clearFormState(); }}
                disabled={isAnySubmitting}
                style={styles.switchButton}
              >
                <Text style={styles.switchButtonText}>Chưa có tài khoản? Đăng ký</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setAuthMode('forgotPassword'); clearFormState(true);}}
                disabled={isAnySubmitting}
                style={styles.switchButton}
              >
                <Text style={styles.switchButtonText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>
          )}

          {authMode === 'register' && (
            <TouchableOpacity
              onPress={() => { setAuthMode('login'); clearFormState(); }}
              disabled={isAnySubmitting}
              style={styles.switchButtonFullWidth}
            >
              <Text style={styles.switchButtonText}>Đã có tài khoản? Đăng nhập</Text>
            </TouchableOpacity>
          )}

          {authMode === 'forgotPassword' && (
            <TouchableOpacity
              onPress={() => { setAuthMode('login'); clearFormState(true);}}
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
    backgroundColor: '#F0F2F5',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4.00,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 35,
    color: '#1A202C',
  },
  input: {
    height: 52,
    borderColor: '#CBD5E0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    color: '#2D3748',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 14,
    marginBottom: 18,
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 50,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.00,
    elevation: 2,
  },
  mainActionButtonYellow: {
    backgroundColor: MAU_VANG_NUT_CHINH,
  },
  mainActionButtonText: {
    color: '#2D3748',
    fontWeight: '600',
    fontSize: 16,
  },
  forgotPasswordButton: {
    backgroundColor: '#4A5568',
  },
  buttonTextWhite: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  switchButton: {
    paddingVertical: 10,
  },
  switchButtonFullWidth: {
    marginTop: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#2B6CB0',
    fontSize: 15,
    fontWeight: '500',
  },
});