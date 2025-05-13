// app/editTransaction.js
import { Picker } from '@react-native-picker/picker';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale'; // Import locale tiếng Việt cho date-fns
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { off, onValue, ref, update } from 'firebase/database';
import { useEffect, useState } from 'react'; // Đảm bảo React được import
import { ActivityIndicator, Alert, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { database } from '../firebaseConfig';

const EditTransactionScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const auth = getAuth();
    const user = auth.currentUser;

    // State cho form
    const [initialData, setInitialData] = useState(null);
    // Khởi tạo transactionType rỗng, sẽ được cập nhật từ initialData
    const [transactionType, setTransactionType] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(''); // Lưu category ID
    const [date, setDate] = useState(new Date());
    const [note, setNote] = useState('');

    // State cho UI
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [userCategories, setUserCategories] = useState([]);
    const [loading, setLoading] = useState(true); // Bắt đầu với loading = true

    // Effect 1: Xử lý dữ liệu đầu vào từ params
    useEffect(() => {
        console.log("EditScreen: Effect for PARAMS running. Params data:", params.transactionData);
        if (params.transactionData && typeof params.transactionData === 'string') {
            try {
                const data = JSON.parse(params.transactionData);
                console.log("EditScreen: Parsed initial data:", data);

                setInitialData(data);
                // Quan trọng: Set transactionType dựa trên dữ liệu gốc
                setTransactionType(data.transactionType || 'expense'); // Mặc định là 'expense' nếu không có
                setAmount(data.amount != null ? String(data.amount) : '');
                setCategory(data.categoryId || '');
                setDate(data.date ? parseISO(data.date) : new Date());
                setNote(data.note || '');
                setLoading(false); // Dữ liệu chính đã được parse, dừng loading chung

            } catch (e) {
                console.error("EditScreen: Lỗi parse dữ liệu:", e);
                Alert.alert("Lỗi", "Không thể đọc dữ liệu giao dịch cần sửa.");
                setLoading(false);
            }
        } else {
            console.warn("EditScreen: Không tìm thấy transactionData trong params hoặc không phải string.");
            Alert.alert("Lỗi", "Không tìm thấy dữ liệu giao dịch cần sửa.");
            setLoading(false);
        }
    }, [params.transactionData]); // Chỉ chạy lại khi chuỗi transactionData từ params thay đổi

    useEffect(() => {
        console.log("======================================================");
        console.log("EditScreen: BẮT ĐẦU useEffect LẤY DANH MỤC");
        console.log("EditScreen: User ID hiện tại:", user?.uid);
        console.log("EditScreen: transactionType dùng để lọc:", transactionType);
        console.log("======================================================");

        if (!user || !transactionType) { // transactionType phải có giá trị (không rỗng)
            console.log("EditScreen: >>> ĐIỀU KIỆN CHƯA ĐỦ (User hoặc transactionType rỗng). Bỏ qua lấy danh mục.");
            setUserCategories([]); // Đảm bảo danh mục rỗng nếu không đủ điều kiện
            // Không set loading ở đây vì loading chính do effect 1 quản lý
            return;
        }

        const categoriesRef = ref(database, `users/${user.uid}/categories`);
        console.log("EditScreen: Thiết lập listener Firebase tại path:", `users/${user.uid}/categories`);

        const listener = onValue(categoriesRef, (snapshot) => {
            console.log("EditScreen: >>> Listener onValue của categories ĐƯỢC KÍCH HOẠT <<<");
            const data = snapshot.val();
            let categoriesArray = [];

            if (data) {
                console.log("EditScreen: Dữ liệu categories THÔ từ Firebase:", JSON.stringify(data, null, 2)); // Log toàn bộ data thô
                categoriesArray = Object.keys(data)
                    .map(key => {
                        const categoryData = data[key];
                        // Log từng danh mục TRƯỚC KHI LỌC
                        console.log(`EditScreen:   - Đang xét category: ID="${key}", Name="${categoryData.name}", Type="${categoryData.type}"`);
                        return { id: key, ...categoryData };
                    })
                    .filter(cat => {
                        // Log chi tiết quá trình LỌC cho từng danh mục
                        const typeMatch = cat.type === transactionType;
                        console.log(`EditScreen:     LỌC: Category Name="${cat.name}", cat.type="${cat.type}" === transactionType="${transactionType}" ? ${typeMatch}`);
                        return typeMatch;
                    });

                categoriesArray.sort((a, b) => a.name.localeCompare(b.name));
                // Log danh sách danh mục SAU KHI LỌC
                console.log(`EditScreen: >>> SAU KHI LỌC: Lấy được ${categoriesArray.length} danh mục loại "${transactionType}". Danh sách tên: [${categoriesArray.map(c => c.name).join(', ')}]`);
            } else {
                console.log("EditScreen: >>> Không có bất kỳ dữ liệu danh mục nào trên Firebase tại path đã cho.");
            }

            setUserCategories(prevCategories => {
                if (JSON.stringify(prevCategories) !== JSON.stringify(categoriesArray)) {
                    console.log("EditScreen: Cập nhật state userCategories.");
                    return categoriesArray;
                }
                console.log("EditScreen: Dữ liệu danh mục không đổi, không cập nhật state userCategories.");
                return prevCategories;
            });

        }, (error) => {
            console.error("EditScreen: >>> LỖI TRONG LISTENER onValue categories:", error);
            setUserCategories([]); // Set rỗng nếu có lỗi
        });

        // Cleanup listener
        return () => {
            console.log("======================================================");
            console.log("EditScreen: useEffect LẤY DANH MỤC - Dọn dẹp listener.");
            console.log("======================================================");
            off(categoriesRef, 'value', listener);
        };
    }, [user, transactionType]); // Phụ thuộc vào user và transactionType

    // --- Các hàm xử lý sự kiện ---
    const handleAmountChange = (text) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        setAmount(numericValue);
    };

    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);
    const handleConfirmDate = (selectedDate) => {
        setDate(selectedDate || date);
        hideDatePicker();
    };

    const handleUpdateTransaction = async () => {
        Keyboard.dismiss();
        console.log("EditScreen: handleUpdateTransaction started.");

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            console.log("EditScreen: Validation failed - Invalid amount:", amount);
            Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ.");
            return;
        }
        if (!category) {
            console.log("EditScreen: Validation failed - No category selected.");
            Alert.alert("Lỗi", "Vui lòng chọn danh mục.");
            return;
        }
        if (!initialData || !initialData.id) {
            console.log("EditScreen: Validation failed - Missing initialData or ID:", initialData);
            Alert.alert("Lỗi", "Không tìm thấy ID của giao dịch cần cập nhật.");
            return;
        }
        if (!user) {
            console.log("EditScreen: Validation failed - No user.");
            Alert.alert("Lỗi", "Không thể xác thực người dùng.");
            return;
        }

        const selectedCategoryObject = userCategories.find(cat => cat.id === category);
        const categoryName = selectedCategoryObject ? selectedCategoryObject.name : (initialData.categoryName || 'Không rõ'); // Fallback to initial if not found
        const categoryIcon = selectedCategoryObject ? selectedCategoryObject.icon : (initialData.categoryIcon || 'help-circle-outline');

        const updatedData = {
            amount: numericAmount,
            categoryId: category,
            categoryName: categoryName,
            categoryIcon: categoryIcon,
            date: date.toISOString(),
            note: note.trim(),
            transactionType: transactionType, // Giữ nguyên loại giao dịch ban đầu
            updatedAt: new Date().toISOString(),
            // Các trường gốc không thay đổi như userId, createdAt có thể được giữ lại nếu cần
            // nhưng Firebase update chỉ cập nhật các trường được cung cấp.
            // Nếu muốn giữ userId, bạn phải thêm nó vào updatedData nếu nó không tự có trong node đó.
            // Ví dụ: userId: initialData.userId (nếu có)
        };

        console.log("EditScreen: Updating transaction ID:", initialData.id);
        console.log("EditScreen: Data to be updated:", JSON.stringify(updatedData, null, 2));

        const transactionRef = ref(database, `users/${user.uid}/transactions/${initialData.id}`);

        try {
            console.log("EditScreen: Calling Firebase update...");
            await update(transactionRef, updatedData);
            console.log("EditScreen: Firebase update successful.");
            Alert.alert("Thành công", "Đã cập nhật giao dịch.");
            if (router.canGoBack()) {
                router.back();
            }
        } catch (error) {
            console.error("EditScreen: Firebase update failed:", error);
            Alert.alert("Lỗi", "Không thể cập nhật giao dịch. Vui lòng thử lại.");
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Đang tải...' }} />
                <ActivityIndicator size="large" color="#FFD700" />
                <Text>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Stack.Screen options={{ title: 'Sửa Giao Dịch' }} />

            <Text style={styles.label}>Loại giao dịch</Text>
            <TextInput
                style={styles.readOnlyInput}
                value={transactionType === 'expense' ? 'Chi tiêu' : (transactionType === 'income' ? 'Thu nhập' : 'Đang tải...')}
                editable={false}
            />

            <Text style={styles.label}>Số tiền</Text>
            <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={handleAmountChange}
            />

            <Text style={styles.label}>Danh mục</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={category}
                    onValueChange={(itemValue) => setCategory(itemValue)}
                    style={styles.picker}
                    enabled={userCategories.length > 0 && !loading} // Chỉ bật khi có danh mục và không loading
                >
                    <Picker.Item label={loading ? "Đang tải danh mục..." : (userCategories.length > 0 ? "-- Chọn danh mục --" : "-- Không có danh mục phù hợp --")} value="" />
                    {userCategories.map((cat) => (
                        <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                    ))}
                </Picker>
            </View>

            <Text style={styles.label}>Ngày</Text>
            <TouchableOpacity onPress={showDatePicker} style={styles.input}>
                <Text>{format(date, 'dd/MM/yyyy', { locale: vi })}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                date={date}
            />

            <Text style={styles.label}>Ghi chú (tuỳ chọn)</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập ghi chú..."
                value={note}
                onChangeText={setNote}
                multiline
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateTransaction}>
                <Text style={styles.saveButtonText}>Lưu Thay Đổi</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

// --- Styles giữ nguyên ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    readOnlyInput: {
        backgroundColor: '#e9ecef',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        color: '#6c757d',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
        justifyContent: 'center',
        ...(Platform.OS === 'android' && { height: 50 }),
    },
    picker: {
        width: '100%',
        ...(Platform.OS === 'ios' ? { height: 200 } : {}),
    },
    saveButton: {
        backgroundColor: '#FFD700',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    saveButtonText: {
        color: '#333',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditTransactionScreen;