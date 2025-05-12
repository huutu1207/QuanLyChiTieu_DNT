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
// Import Ionicons
import { Ionicons } from '@expo/vector-icons';


// Lấy kích thước màn hình để tính toán layout
const { width } = Dimensions.get('window');
const KEYPAD_BUTTON_WIDTH = (width - 20 * 2 - 10 * 3) / 4; // (screenWidth - 2*paddingHorizontal - 3*gap) / 4 columns
const KEYPAD_BUTTON_HEIGHT = KEYPAD_BUTTON_WIDTH * 0.7; // Giữ tỷ lệ cho nút

const TransactionInputArea = ({
    selectedCategory, // { name: string, icon: string } - icon giờ sẽ là tên icon Ionicons
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
        if (key === '⌫') { // Backspace icon name
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
            // Thay alert() bằng cách hiển thị thông báo trong UI hoặc thư viện khác
            // alert('Vui lòng nhập số tiền hợp lệ.');
             console.warn('Invalid amount entered:', numericAmount); // Log cảnh báo thay vì alert
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
        // onDateChange prop không được sử dụng trong component này,
        // logic quản lý ngày được giữ lại ở đây.
        // if (onDateChange) {
        //     onDateChange(date);
        // }
        hideDatePicker();
    };

    const formatAmountForDisplay = () => {
        if (amount === '') return '0';
        // Bạn có thể thêm logic định dạng số tiền ở đây (ví dụ: 1000000 -> 1.000.000)
        // Hiện tại chỉ hiển thị chuỗi nhập vào
        return amount;
    };

    // Cập nhật layout bàn phím với tên icon Ionicons
    const keypadLayout = [
        ['7', '8', '9', 'calendar-outline'], // Icon lịch
        ['4', '5', '6', 'add-outline'], // Icon cộng
        ['1', '2', '3', 'remove-outline'], // Icon trừ
        [',', '0', 'backspace-outline', 'checkmark-circle-outline'], // Icon backspace và checkmark
    ];

    // Hàm render nội dung nút bàn phím (Text hoặc Ionicons)
    const renderKeypadButtonContent = (key) => {
        const iconMap = {
            'calendar-outline': 'calendar-outline',
            'add-outline': 'add-outline',
            'remove-outline': 'remove-outline',
            'backspace-outline': 'backspace-outline',
            'checkmark-circle-outline': 'checkmark-circle-outline',
        };

        const ioniconName = iconMap[key];

        if (ioniconName) {
            // Nếu là một trong các key hành động có icon
            return <Ionicons name={ioniconName} size={key === 'checkmark-circle-outline' ? 28 : 24} color={key === 'checkmark-circle-outline' ? '#fff' : '#333'} />;
        } else {
            // Nếu là số hoặc dấu phẩy
            return <Text style={styles.keypadButtonText}>{key}</Text>;
        }
    };


    return (
        <View style={styles.container}>
            {/* Hiển thị thông tin danh mục và số tiền */}
            <View style={styles.displayArea}>
                <View style={styles.categoryDisplay}>
                    {/* Hiển thị icon danh mục bằng Ionicons */}
                    <Ionicons
                        name={selectedCategory?.icon || 'cash-outline'} // Sử dụng icon từ selectedCategory, mặc định là cash-outline
                        size={24}
                        color="#555" // Màu cho icon danh mục
                        style={styles.categoryIcon}
                    />
                    <Text style={styles.categoryName}>{selectedCategory?.name || 'Danh mục'}</Text>
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
                    // Tắt bàn phím mặc định
                    showSoftInputOnFocus={false}
                />
                {/* Icon camera (chưa có chức năng) - Giữ nguyên emoji hoặc thay bằng Ionicons */}
                <TouchableOpacity style={styles.cameraIconContainer}>
                    <Ionicons name="camera-outline" size={24} color="#555" />
                </TouchableOpacity>
            </View>

            {/* Bàn phím tùy chỉnh */}
            <View style={styles.keypadContainer}>
                {keypadLayout.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                        {row.map((key) => {
                            const isActionKey = ['calendar-outline', 'add-outline', 'remove-outline', 'checkmark-circle-outline'].includes(key);
                            const isConfirmKey = key === 'checkmark-circle-outline';
                            const isDateKey = key === 'calendar-outline';

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
                                            // alert('Chức năng chọn ngày chưa được triển khai hoàn chỉnh.'); // Bỏ alert này
                                        } else if (['add-outline', 'remove-outline'].includes(key)) {
                                            // Xử lý phép toán nếu cần, hiện tại chỉ log
                                            console.log(`Chức năng phép toán '${key}' chưa được triển khai.`);
                                        }
                                        else {
                                            // Xử lý nhập số và dấu phẩy
                                            handleKeyPress(key);
                                        }
                                    }}
                                >
                                    {/* Render nội dung nút (Text hoặc Ionicons) */}
                                    {renderKeypadButtonContent(key)}
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
                // locale="vi" // Có thể thêm locale tiếng Việt nếu thư viện hỗ trợ
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
        // Styles cho icon danh mục (đã là Ionicons)
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
    // cameraIcon: { // Đã bỏ style này vì dùng Ionicons
    //     fontSize: 24,
    // },
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
    actionKeyText: { // Style này không còn dùng trực tiếp cho Ionicons, có thể bỏ hoặc điều chỉnh
        // color: '#333', // Màu sắc được đặt trực tiếp trên Ionicons
        fontSize: 16, // Kích thước được đặt trực tiếp trên Ionicons
    },
    dateKeyButton: {
        backgroundColor: '#FFFACD', // Màu vàng nhạt cho nút "Hôm nay"
    },
    confirmKeyButton: {
        backgroundColor: '#2E8B57', // Màu xanh lá cho nút xác nhận
    },
    confirmKeyText: { // Style này không còn dùng trực tiếp cho Ionicons, có thể bỏ hoặc điều chỉnh
        // color: '#FFFFFF', // Màu sắc được đặt trực tiếp trên Ionicons
        fontSize: 24, // Kích thước được đặt trực tiếp trên Ionicons
        fontWeight: 'bold', // Trọng lượng font được đặt trực tiếp trên Ionicons
    },
});

export default TransactionInputArea;
