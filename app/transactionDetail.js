// app/transactionDetail.js

import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns'; // Thêm parseISO nếu date lưu dạng ISO string
import { vi } from 'date-fns/locale';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { off, onValue, ref, remove } from 'firebase/database'; // Thêm onValue, off
import { useEffect, useState } from 'react'; // Thêm useState, useEffect
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Thêm ActivityIndicator
import { database } from '../firebaseConfig';

const TransactionDetailScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const auth = getAuth();
    const user = auth.currentUser;

    // State để lưu transaction ID lấy từ params
    const [transactionId, setTransactionId] = useState(null);
    // State để lưu dữ liệu giao dịch hiện tại (từ Firebase listener)
    const [currentTransaction, setCurrentTransaction] = useState(null);
    // State cho loading và lỗi
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Effect 1: Chỉ chạy 1 lần để lấy transactionId từ params
    useEffect(() => {
        console.log("--- TransactionDetailScreen ---");
        console.log("1. Params received:", params);
        let initialData = null;
        try {
            if (params.transactionData && typeof params.transactionData === 'string') {
                initialData = JSON.parse(params.transactionData);
                console.log("2. Initial data parsed from params:", initialData);
                if (initialData && initialData.id) {
                    setTransactionId(initialData.id); // Lưu ID vào state
                    // Có thể set state ban đầu để hiển thị nhanh hơn
                    setCurrentTransaction(initialData);
                } else {
                    setError("Dữ liệu giao dịch không hợp lệ (thiếu ID).");
                    setLoading(false);
                }
            } else {
                setError("Không tìm thấy dữ liệu giao dịch truyền vào.");
                setLoading(false);
            }
        } catch (e) {
            console.error("Lỗi JSON.parse ban đầu:", e);
            setError("Lỗi đọc dữ liệu giao dịch ban đầu.");
            setLoading(false);
        }
    }, [params.transactionData]); // Chỉ phụ thuộc vào dữ liệu truyền vào

    // Effect 2: Lắng nghe thay đổi trên Firebase cho transactionId cụ thể
    useEffect(() => {
        // Chỉ chạy khi có user và transactionId
        if (!user || !transactionId) {
            // Nếu không có ID và chưa có lỗi, coi như không tìm thấy
            if (!transactionId && !error) {
                setError("Không thể xác định ID giao dịch để lắng nghe.");
                setLoading(false);
            }
            return; // Không làm gì nếu thiếu thông tin
        }

        setLoading(true); // Bắt đầu tải/lắng nghe
        setError(null);   // Reset lỗi cũ
        console.log(`DetailScreen: Bắt đầu lắng nghe transaction ID: ${transactionId}`);
        const transactionRef = ref(database, `users/${user.uid}/transactions/${transactionId}`);

        const listener = onValue(transactionRef, (snapshot) => {
            const updatedTxData = snapshot.val();
            if (updatedTxData) {
                console.log("DetailScreen: Dữ liệu Firebase thay đổi:", updatedTxData);
                // Cập nhật state với dữ liệu mới nhất từ Firebase
                setCurrentTransaction({ id: snapshot.key, ...updatedTxData });
                setError(null); // Xóa lỗi nếu có dữ liệu
            } else {
                // Xử lý trường hợp giao dịch bị xóa ở nơi khác
                console.log("DetailScreen: Dữ liệu giao dịch là null (có thể đã bị xóa).");
                setError("Giao dịch này không còn tồn tại.");
                setCurrentTransaction(null); // Xóa dữ liệu hiện tại
            }
            setLoading(false); // Đã nhận dữ liệu (hoặc xác nhận null), dừng loading
        }, (firebaseError) => { // Hàm xử lý lỗi của onValue
            console.error("DetailScreen: Lỗi listener Firebase:", firebaseError);
            setError("Không thể lắng nghe cập nhật từ server.");
            setLoading(false);
        });

        // Hàm dọn dẹp: gỡ bỏ listener khi component unmount hoặc ID/user thay đổi
        return () => {
            console.log(`DetailScreen: Dừng lắng nghe transaction ID: ${transactionId}`);
            off(transactionRef, 'value', listener);
        };
        // Chạy lại effect này nếu user thay đổi hoặc transactionId thay đổi
    }, [user, transactionId]);

    // --- Các hàm xử lý nút (handleEdit, handleDelete) ---
    const handleEdit = () => {
        // Dùng currentTransaction (dữ liệu mới nhất) để truyền đi
        if (!currentTransaction) {
            Alert.alert("Lỗi", "Không có dữ liệu giao dịch để sửa.");
            return;
        }
        console.log("DetailScreen: Navigating to Edit for:", currentTransaction.id);
        router.push({
            pathname: '/editTransaction',
            params: { transactionData: JSON.stringify(currentTransaction) } // Truyền dữ liệu mới nhất
        });
    };

    const handleDelete = () => {
        if (!currentTransaction || !currentTransaction.id) {
            Alert.alert("Lỗi", "Không thể xác định giao dịch để xóa.");
            return;
        }
        Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc chắn muốn xóa giao dịch này không?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    onPress: async () => {
                        if (user && currentTransaction.id) {
                            const transactionRef = ref(database, `users/${user.uid}/transactions/${currentTransaction.id}`);
                            try {
                                await remove(transactionRef);
                                Alert.alert("Thành công", "Đã xóa giao dịch.");
                                // Listener sẽ tự động cập nhật currentTransaction thành null
                                // Chỉ cần quay lại màn hình trước
                                if (router.canGoBack()) {
                                    router.back();
                                }
                            } catch (deleteError) {
                                console.error("DetailScreen: Lỗi khi xóa:", deleteError);
                                Alert.alert("Lỗi", "Không thể xóa giao dịch. Vui lòng thử lại.");
                            }
                        } else {
                            Alert.alert("Lỗi", "Lỗi người dùng hoặc ID giao dịch.");
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    // --- Logic Render ---
    if (loading) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Đang tải...' }} />
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Lỗi' }} />
                <Text style={styles.errorText}>{error}</Text>
                {/* Có thể thêm nút thử lại hoặc quay lại */}
            </View>
        );
    }

    // Trường hợp listener chạy xong nhưng transaction không tồn tại (đã bị xóa)
    if (!currentTransaction) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Không tìm thấy' }} />
                <Text style={styles.errorText}>Giao dịch này không còn tồn tại.</Text>
            </View>
        );
    }

    // --- Hiển thị dữ liệu từ state currentTransaction ---
    // Parse date an toàn hơn, vì nó có thể là string từ Firebase
    const transactionDate = currentTransaction.date ? parseISO(currentTransaction.date) : null;
    const formattedDate = transactionDate
        ? format(transactionDate, 'dd MMMM, yyyy', { locale: vi })
        : 'Không rõ ngày';

    const formattedAmount = currentTransaction.amount != null
        ? currentTransaction.amount.toLocaleString()
        : '0';

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Chi tiết giao dịch',
                    headerStyle: { backgroundColor: '#FFD700' },
                    headerTintColor: '#333',
                    headerTitleAlign: 'center',
                    headerBackTitle: 'Quay lại',
                }}
            />

            {/* Phần Header */}
            <View style={styles.header}>
                <View style={styles.iconBackground}>
                    <Ionicons
                        name={currentTransaction.categoryIcon || 'cash-outline'}
                        size={40}
                        color="#555"
                    />
                </View>
                <Text style={styles.categoryName}>{currentTransaction.categoryName || 'Không có tên'}</Text>
            </View>

            {/* Các dòng chi tiết */}
            <View style={styles.detailRow}>
                <Text style={styles.label}>Kiểu</Text>
                <Text style={styles.value}>{currentTransaction.transactionType === 'expense' ? 'Chi tiêu' : 'Thu nhập'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.label}>Số tiền</Text>
                <Text style={[
                    styles.value,
                    { color: currentTransaction.transactionType === 'expense' ? 'red' : 'green' }
                ]}>
                    {currentTransaction.transactionType === 'expense' ? '-' : '+'} {formattedAmount} đ
                </Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.label}>Ngày</Text>
                <Text style={styles.value}>{formattedDate}</Text>
            </View>
            {currentTransaction.note && (
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Ghi chú</Text>
                    <Text style={[styles.value, styles.noteValue]}>{currentTransaction.note}</Text>
                </View>
            )}

            {/* Footer với nút Sửa/Xóa */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleEdit}>
                    <Ionicons name="pencil-outline" size={20} color="#333" />
                    <Text style={styles.buttonText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color="red" />
                    <Text style={[styles.buttonText, styles.deleteButtonText]}>Xóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 10,
    },
    iconBackground: {
        backgroundColor: '#FFD700',
        padding: 15,
        borderRadius: 40,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryName: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: '#666',
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        textAlign: 'right',
        flexShrink: 1,
    },
    noteValue: {
        fontStyle: 'italic',
        color: '#444'
    },
    errorText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: 'red',
        paddingHorizontal: 20,
    },
    footer: {
        flexDirection: 'row',
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        backgroundColor: '#fff',
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '500',
        marginLeft: 8,
        color: '#333',
    },
    deleteButton: {
        borderLeftWidth: 1,
        borderLeftColor: '#e0e0e0',
    },
    deleteButtonText: {
        color: 'red',
    }
});

export default TransactionDetailScreen;