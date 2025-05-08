// components/MonthYearPickerModal.js
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Hoặc icon bạn muốn

const MonthYearPickerModal = ({ visible, onClose, onSelect, initialYear, initialMonth }) => {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  // Thêm state cho việc hiển thị dropdown chọn năm nếu bạn làm custom
  // const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    setCurrentYear(initialYear);
    setSelectedMonth(initialMonth);
  }, [initialYear, initialMonth, visible]); // Reset khi mở lại hoặc initial props thay đổi

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearChange = (increment) => {
    setCurrentYear(prevYear => prevYear + increment);
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
  };

  const handleConfirm = () => {
    onSelect(currentYear, selectedMonth);
    onClose();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="fade" // Hoặc "slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Tiêu đề */}
          <Text style={styles.titleText}>{`tháng ${selectedMonth} năm ${currentYear}`}</Text>

          {/* Chọn Năm */}
          <View style={styles.yearSelector}>
            <TouchableOpacity onPress={() => handleYearChange(-1)}>
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>
            {/* TODO: Có thể làm component chọn năm phức tạp hơn ở đây */}
            <Text style={styles.yearText}>{currentYear}</Text>
            <TouchableOpacity onPress={() => handleYearChange(1)}>
              <Ionicons name="chevron-forward" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Chọn Tháng */}
          <View style={styles.monthsGrid}>
            {months.map(month => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  selectedMonth === month && styles.selectedMonthButton
                ]}
                onPress={() => handleMonthSelect(month)}
              >
                <Text
                  style={[
                    styles.monthText,
                    selectedMonth === month && styles.selectedMonthText
                  ]}
                >
                  Thg {month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nút Hành Động */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
              <Text style={[styles.buttonText, styles.confirmButtonText]}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Thêm StyleSheet của bạn ở đây
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%', // Hoặc kích thước cố định
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '60%',
    marginBottom: 20,
  },
  yearText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  monthButton: {
    paddingVertical: 10,
    paddingHorizontal: 15, // Điều chỉnh để vừa vặn
    margin: 4, // Tăng margin để không dính sát
    borderRadius: 20, // Bo tròn nhiều hơn
    borderWidth: 1,
    borderColor: '#ddd',
    width: '29%', // ~3 item trên một hàng, điều chỉnh tùy theo padding/margin
    alignItems: 'center',
  },
  selectedMonthButton: {
    backgroundColor: '#FFD700', // Màu vàng như trong thiết kế
    borderColor: '#FFD700',
  },
  monthText: {
    fontSize: 14,
    color: '#333',
  },
  selectedMonthText: {
    fontWeight: 'bold',
    color: '#333', // Hoặc màu khác nếu cần
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Hoặc 'flex-end' với space
    width: '100%',
    marginTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 16,
    color: '#FFD700', // Màu chữ cho nút Hủy
    fontWeight: 'bold',
  },
  confirmButton: {
    // Có thể không cần style riêng nếu bạn muốn nút "Xác nhận" giống nút "Hủy"
    // Nếu muốn khác biệt, ví dụ:
    // backgroundColor: '#FFD700',
  },
  confirmButtonText: {
     color: '#FFD700', // Màu chữ cho nút Xác nhận
    //  color: '#333', // Nếu nút Xác nhận có nền vàng
  }
});

export default MonthYearPickerModal;