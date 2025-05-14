// Giả sử bạn lưu file này là components/UploadCategoriesScreen.js

import { ref, set, update } from "firebase/database";
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { database } from '../firebaseConfig';
// Bạn sẽ cần import Ionicons ở nơi hiển thị các icon này, ví dụ trong HomeScreen

// Cập nhật danh sách dữ liệu danh mục ban đầu với trường "type"
const initialCategoriesData = [
    { id: '1', name: 'Mua sắm', icon: 'cart-outline', type: 'expense' },
    { id: '2', name: 'Đồ ăn', icon: 'fast-food-outline', type: 'expense' },
    { id: '3', name: 'Điện thoại', icon: 'phone-portrait-outline', type: 'expense' },
    { id: '4', name: 'Giải trí', icon: 'game-controller-outline', type: 'expense' },
    { id: '5', name: 'Giáo dục', icon: 'book-outline', type: 'expense' },
    { id: '6', name: 'Sắc đẹp', icon: 'sparkles-outline', type: 'expense' },
    { id: '7', name: 'Thể thao', icon: 'basketball-outline', type: 'expense' },
    { id: '8', name: 'Xã hội', icon: 'people-outline', type: 'expense' },
    { id: '9', name: 'Vận tải', icon: 'car-outline', type: 'expense' },
    { id: '10', name: 'Quần áo', icon: 'shirt-outline', type: 'expense' },
    { id: '11', name: 'Xe hơi', icon: 'car-outline', type: 'expense' },
    { id: '12', name: 'Rượu', icon: 'wine-outline', type: 'expense' },
    { id: '13', name: 'Thuốc lá', icon: 'close-circle-outline', type: 'expense' },
    { id: '14', name: 'Thiết bị ĐT', icon: 'headset-outline', type: 'expense' },
    { id: '15', name: 'Du lịch', icon: 'airplane-outline', type: 'expense' },
    { id: '16', name: 'Sức khỏe', icon: 'heart-outline', type: 'expense' },
    { id: '17', name: 'Thú cưng', icon: 'paw-outline', type: 'expense' },
    { id: '18', name: 'Sửa chữa', icon: 'build-outline', type: 'expense' },
    { id: '19', name: 'Nhà ở', icon: 'home-outline', type: 'expense' },
    { id: '20', name: 'Nhà', icon: 'home-outline', type: 'expense' },
    { id: '21', name: 'Quà tặng', icon: 'gift-outline', type: 'expense' },
    { id: '22', name: 'Quyên góp', icon: 'heart-circle-outline', type: 'expense' },
    { id: '23', name: 'Vé số', icon: 'ticket-outline', type: 'expense' },
    { id: '24', name: 'Đồ ăn nhẹ', icon: 'nutrition-outline', type: 'expense' },
    // Mục 'add' không nhất thiết cần type, nhưng thêm vào cho đồng bộ nếu muốn.
    // Hoặc bạn có thể bỏ qua nó trong logic upload nếu nó không phải là một category thực sự.
    // Nếu 'add' được xử lý đặc biệt ở client và không cần lưu type, có thể bỏ qua.
    // Ở đây tôi vẫn thêm type cho nó, bạn có thể tùy chỉnh.
    { id: 'add', name: 'Thêm mới', icon: 'add-circle-outline', type: 'expense' }, // Hoặc một type mặc định nào đó

    { id: '101', name: 'Lương', icon: 'cash-outline', type: 'income' },
    { id: '102', name: 'Thưởng', icon: 'trophy-outline', type: 'income' },
    { id: '103', name: 'Được tặng', icon: 'gift-outline', type: 'income' }, // Icon này cũng có thể dùng cho chi tiêu, nhưng type sẽ phân biệt
    { id: '104', name: 'Làm thêm', icon: 'laptop-outline', type: 'income' }, // Hoặc 'briefcase-outline'
    { id: '105', name: 'Đầu tư', icon: 'trending-up-outline', type: 'income' },
    { id: '106', name: 'Bán đồ', icon: 'pricetags-outline', type: 'income' },
    { id: '107', name: 'Thu nhập khác', icon: 'ellipsis-horizontal-circle-outline', type: 'income' },
];

const UploadCategoriesScreen = () => {
    const [status, setStatus] = useState('');

    const handleUploadWithSet = async () => {
        setStatus('Đang tải lên (SET)...');
        try {
            const categoriesNode = {};
            initialCategoriesData.forEach(category => {
                // Bỏ qua 'add' nếu bạn không muốn nó là một category có type trên DB
                // if (category.id === 'add') return; 
                categoriesNode[category.id] = {
                    name: category.name,
                    icon: category.icon,
                    type: category.type, // <<< THÊM TRƯỜNG TYPE
                };
            });

            await set(ref(database, 'categories'), categoriesNode);

            setStatus('');
            Alert.alert('Thành công', 'Danh sách danh mục (với type) đã được tải lên Firebase bằng SET!');
        } catch (error) {
            setStatus('');
            console.error("Lỗi khi tải lên (SET): ", error);
            Alert.alert('Lỗi', `Có lỗi xảy ra: ${error.message}`);
        }
    };

    const handleUploadWithUpdate = async () => {
        setStatus('Đang tải lên (UPDATE)...');
        try {
            const updates = {};
            initialCategoriesData.forEach(category => {
                // Bỏ qua 'add' nếu bạn không muốn nó là một category có type trên DB
                // if (category.id === 'add') return;
                updates[`categories/${category.id}`] = {
                    name: category.name,
                    icon: category.icon,
                    type: category.type, // <<< THÊM TRƯỜNG TYPE
                };
            });

            await update(ref(database), updates);

            setStatus('');
            Alert.alert('Thành công', 'Danh sách danh mục (với type) đã được tải lên Firebase bằng UPDATE!');
        } catch (error) {
            setStatus('');
            console.error("Lỗi khi tải lên (UPDATE): ", error);
            Alert.alert('Lỗi', `Có lỗi xảy ra: ${error.message}`);
        }
    };

    return (
        <View style={styles.container}>
            {/* <View style={styles.buttonContainer}>
                <Button title="Tải lên dữ liệu (SET)" onPress={handleUploadWithSet} color="#FF9800" />
            </View> */}
            <View style={styles.buttonContainer}>
                <Button title="Tải lên dữ liệu danh mục mặc định" onPress={handleUploadWithUpdate} color="#4CAF50" />
            </View>
            {status ? <Text style={styles.statusText}>{status}</Text> : null}
            <Text style={styles.note}>
                Lưu ý: Việc này thường chỉ cần thực hiện một lần để khởi tạo dữ liệu danh mục mặc định có trường `type`.
                Nếu danh mục 'add' không cần trường `type`, bạn có thể bỏ qua nó trong `initialCategoriesData` hoặc logic upload.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '80%',
        marginVertical: 10,
    },
    statusText: {
        marginTop: 20,
        color: 'blue',
        fontSize: 16,
    },
    note: {
        marginTop: 30,
        textAlign: 'center',
        color: '#555',
        fontStyle: 'italic',
    }
});

export default UploadCategoriesScreen;