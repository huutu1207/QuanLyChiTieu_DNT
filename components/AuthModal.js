// AuthModal.js
import React from 'react';
import { Text as DefaultText, Modal, TextInput, TouchableOpacity, View } from 'react-native';

const AuthModalComponent = ({
  visible,
  onClose,
  onSubmit,
  isLogin,
  email,
  setEmail,
  password,
  setPassword,
  ThemedTextComponent = DefaultText,
  styles, // Object styles được truyền từ ProfileItem
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => { // Xử lý khi người dùng nhấn nút back trên Android
        onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ThemedTextComponent style={styles.modalTitle}>
            {isLogin ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
          </ThemedTextComponent>
          <TextInput
            style={styles.input}
            placeholder="Nhập địa chỉ Email"
            placeholderTextColor={styles.placeholderText?.color || '#8A8A8E'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false} 
            textContentType="emailAddress" // Gợi ý cho bàn phím
          />
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor={styles.placeholderText?.color || '#8A8A8E'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType={isLogin ? "password" : "newPassword"} // Gợi ý cho bàn phím
          />
          <TouchableOpacity
            style={[styles.modalButton, isLogin ? styles.loginButtonModal : styles.registerButtonModal]}
            onPress={onSubmit}
            activeOpacity={0.8}
          >
            <ThemedTextComponent style={styles.modalButtonText}>
              {isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </ThemedTextComponent>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButtonModal]}
            onPress={() => {
              onClose();
            }}
            activeOpacity={0.8}
          >
            <ThemedTextComponent style={[styles.modalButtonText, styles.cancelButtonTextModal]}>
              Hủy bỏ
            </ThemedTextComponent>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const AuthModal = React.memo(AuthModalComponent);