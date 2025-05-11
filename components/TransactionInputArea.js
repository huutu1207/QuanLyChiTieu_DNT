// components/TransactionInputArea.js
import { useEffect, useState } from 'react';
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
// Bạn có thể cần thư viện này để chọn ngày
import DateTimePickerModal from "react-native-modal-datetime-picker";

// Lấy kích thước màn hình để tính toán layout
const { width } = Dimensions.get('window');
const KEYPAD_BUTTON_WIDTH = (width - 20 * 2 - 10 * 3) / 4; // (screenWidth - 2*paddingHorizontal - 3*gap) / 4 columns
const KEYPAD_BUTTON_HEIGHT = KEYPAD_BUTTON_WIDTH * 0.7; // Giữ tỷ lệ cho nút

const TransactionInputArea = ({
    selectedCategory, // { name: string, icon: string }
    initialAmount = '0',
    initialNote = '',
    onSaveTransaction, // (details: { amount: number, note: string, date: Date }) => void
    onCancelTransaction, // () => void
    // onDateChange, // (date: Date) => void // Nếu bạn muốn component này quản lý ngày
}) => {
    const [amount, setAmount] = useState(initialAmount === '0' || !initialAmount ? '' : initialAmount); // Để placeholder hoạt động
    const [note, setNote] = useState(initialNote);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    useEffect(() => {
        // Nếu initialAmount là '0' hoặc rỗng, hiển thị placeholder '0'
        // Nếu có giá trị, hiển thị giá trị đó
        setAmount(initialAmount === '0' || !initialAmount ? '' : initialAmount);
        setNote(initialNote);
    }, [initialAmount, initialNote]);


    const handleKeyPress = (key) => {
        if (key === '⌫') { // Backspace
            setAmount(prevAmount => prevAmount.slice(0, -1));
        } else if (key === ',') { // Decimal point
            if (!amount.includes(',')) {
                setAmount(prevAmount => prevAmount + ',');
            }
        } else { // Digit
            if (amount.length < 12) { // Giới hạn độ dài số tiền
                // Nếu amount đang là rỗng hoặc '0', và người dùng nhập số khác 0
                if ((amount === '' || amount === '0') && key !== '0' && key !== ',') {
                    setAmount(key);
                } else if (amount !== '' || key !== '0') { // Cho phép nhập số 0 nếu đã có số khác
                    setAmount(prevAmount => prevAmount + key);
                }
            }
        }
    };

    const handleSave = () => {
        const numericAmount = parseFloat(amount.replace(',', '.')) || 0; // Thay thế dấu phẩy nếu có
        if (numericAmount <= 0) {
            alert('Vui lòng nhập số tiền hợp lệ.');
            return;
        }
        if (onSaveTransaction) {
            onSaveTransaction({
                amount: numericAmount,
                note: note.trim(),
                date: currentDate,
                category: selectedCategory, // Gửi kèm thông tin danh mục đã chọn
            });
        }
    };

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirmDate = (date) => {
        setCurrentDate(date);
        if (onDateChange) {
            onDateChange(date);
        }
        hideDatePicker();
    };

    const formatAmountForDisplay = () => {
        if (amount === '') return '0';
        // Bạn có thể thêm logic định dạng số tiền ở đây (ví dụ: 1000000 -> 1.000.000)
        return amount;
    };


    const keypadLayout = [
        ['7', '8', '9', '🗓️'],
        ['4', '5', '6', '+'],
        ['1', '2', '3', '-'],
        [',', '0', '⌫', '✓'],
    ];

    return (
        <View style={styles.container}>
            {/* Hiển thị thông tin danh mục và số tiền */}
            <View style={styles.displayArea}>
                <View style={styles.categoryDisplay}>
                    <Text style={styles.categoryIcon}>{selectedCategory?.icon || '💸'}</Text>
                    <Text style={styles.categoryName}>{selectedCategory?.name || 'Chi tiêu'}</Text>
                </View>
                <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit>
                    {formatAmountForDisplay()}
                </Text>
            </View>

            {/* Trường nhập ghi chú */}
            <View style={styles.noteInputContainer}>
                <TextInput
                    style={styles.noteInput}
                    placeholder="Ghi chú : Nhập ghi chú ..."
                    placeholderTextColor="#888"
                    value={note}
                    onChangeText={setNote}
                    maxLength={100}
                />
                {/* Icon camera (chưa có chức năng) */}
                <TouchableOpacity style={styles.cameraIconContainer}>
                    <Text style={styles.cameraIcon}>📷</Text>
                </TouchableOpacity>
            </View>

            {/* Bàn phím tùy chỉnh */}
            <View style={styles.keypadContainer}>
                {keypadLayout.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                        {row.map((key) => {
                            const isActionKey = ['🗓️', '+', '-', '✓'].includes(key);
                            const isConfirmKey = key === '✓';
                            const isBackspaceKey = key === '⌫';
                            const isDateKey = key === '🗓️';

                            return (
                                <TouchableOpacity
                                    key={`key-${key}`}
                                    style={[
                                        styles.keypadButton,
                                        isActionKey && styles.actionKeyButton,
                                        isConfirmKey && styles.confirmKeyButton,
                                        isDateKey && styles.dateKeyButton,
                                    ]}
                                    onPress={() => {
                                        if (isConfirmKey) {
                                            handleSave();
                                        } else if (isDateKey) {
                                            showDatePicker();
                                            alert('Chức năng chọn ngày chưa được triển khai hoàn chỉnh.');
                                        } else if (['+', '-'].includes(key)) {
                                            alert(`Chức năng phép toán '${key}' chưa được triển khai.`);
                                        }
                                        else {
                                            handleKeyPress(key);
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.keypadButtonText,
                                        isActionKey && styles.actionKeyText,
                                        isConfirmKey && styles.confirmKeyText,
                                    ]}>
                                        {key}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                date={currentDate} // Ngày hiện tại được chọn
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F0F0', // Màu nền nhạt cho toàn bộ khu vực
        paddingHorizontal: 20,
        paddingTop: 10, // Giảm padding top
        paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Thêm padding bottom cho iOS
    },
    displayArea: {
        marginBottom: 15,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 1,
    },
    categoryDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    categoryIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    categoryName: {
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    },
    amountText: {
        fontSize: 36, // Kích thước lớn cho số tiền
        fontWeight: 'bold',
        color: '#2E8B57', // Màu xanh lá cây cho số tiền
        textAlign: 'right', // Căn phải số tiền
        minHeight: 45, // Đảm bảo chiều cao tối thiểu
    },
    noteInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15, // Tăng khoảng cách với bàn phím
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 1,
    },
    noteInput: {
        flex: 1,
        height: 50, // Tăng chiều cao
        fontSize: 15,
        color: '#333',
    },
    cameraIconContainer: {
        padding: 8,
    },
    cameraIcon: {
        fontSize: 24,
    },
    keypadContainer: {
        // flex: 1, // Để bàn phím chiếm phần còn lại
        // justifyContent: 'flex-end', // Đẩy bàn phím xuống dưới nếu không flex:1
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10, // Khoảng cách giữa các hàng nút
    },
    keypadButton: {
        width: KEYPAD_BUTTON_WIDTH,
        height: KEYPAD_BUTTON_HEIGHT,
        backgroundColor: '#FFFFFF', // Màu nền trắng cho nút thường
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    keypadButtonText: {
        fontSize: 22, // Kích thước chữ lớn hơn
        color: '#333', // Màu chữ đậm
        fontWeight: '500',
    },
    actionKeyButton: {
        backgroundColor: '#E0E0E0', // Màu nền khác cho nút chức năng
    },
    actionKeyText: {
        // color: '#333', // Có thể giữ màu chữ mặc định hoặc thay đổi
        fontSize: 16, // Chữ nhỏ hơn cho nút chức năng
    },
    dateKeyButton: {
        backgroundColor: '#FFFACD', // Màu vàng nhạt cho nút "Hôm nay"
    },
    confirmKeyButton: {
        backgroundColor: '#2E8B57', // Màu xanh lá cho nút xác nhận
    },
    confirmKeyText: {
        color: '#FFFFFF', // Chữ trắng cho nút xác nhận
        fontSize: 24, // Chữ to hơn cho nút xác nhận
        fontWeight: 'bold',
    },
});

export default TransactionInputArea;
