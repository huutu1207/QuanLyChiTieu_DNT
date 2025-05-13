// components/SyncDefaultCategories.js

import { getAuth } from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';
import { database } from '../firebaseConfig'; // Đảm bảo đường dẫn này đúng

const SyncDefaultCategories = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [userId, setUserId] = useState(null);
    const auth = getAuth();

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUserId(currentUser.uid);
        } else {
            setMessage('Bạn cần đăng nhập để thực hiện hành động này.');
        }
    }, [auth]);

    const handleSyncCategories = async () => {
        if (!userId) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            return;
        }

        Alert.alert(
            "Xác nhận đồng bộ",
            "Hành động này sẽ cập nhật danh sách danh mục của bạn về mặc định. Các danh mục tùy chỉnh (nếu có) có thể bị ghi đè. Bạn có muốn tiếp tục?",
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Đồng ý",
                    onPress: async () => {
                        setLoading(true);
                        setMessage('');

                        try {
                            // 1. Tham chiếu đến nút chứa danh mục mặc định
                            const defaultCategoriesRef = ref(database, 'categories');

                            // 2. Lấy dữ liệu từ default_categories
                            console.log("Đang lấy dữ liệu từ /default_categories...");
                            const snapshot = await get(defaultCategoriesRef);

                            if (snapshot.exists()) {
                                const defaultCategoriesData = snapshot.val();
                                console.log("Dữ liệu default_categories đã lấy:", defaultCategoriesData);

                                // 3. Tham chiếu đến nút categories của người dùng hiện tại
                                const userCategoriesRef = ref(database, `users/${userId}/categories`);

                                // 4. Ghi dữ liệu vào nút categories của người dùng
                                console.log(`Đang ghi dữ liệu vào users/${userId}/categories...`);
                                await set(userCategoriesRef, defaultCategoriesData);

                                setMessage('Đồng bộ danh mục mặc định thành công!');
                                Alert.alert("Thành công", "Đã cập nhật danh sách danh mục của bạn về mặc định.");
                                console.log("Đồng bộ thành công!");
                            } else {
                                setMessage('Không tìm thấy dữ liệu danh mục mặc định. Vui lòng liên hệ quản trị viên.');
                                Alert.alert("Lỗi", "Không tìm thấy dữ liệu danh mục mặc định.");
                                console.log("Không tìm thấy /default_categories");
                            }
                        } catch (error) {
                            console.error("Lỗi khi đồng bộ danh mục: ", error);
                            setMessage(`Lỗi khi đồng bộ: ${error.message}`);
                            Alert.alert("Lỗi", `Không thể đồng bộ danh mục: ${error.message}`);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (!userId && !auth.currentUser) { // Kiểm tra lại nếu user logout khi component đang mount
        return (
            <View style={styles.container}>
                <Text style={styles.messageText}>Bạn cần đăng nhập để sử dụng chức năng này.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Đồng bộ Danh mục</Text>
            <Text style={styles.description}>
                Nhấn nút dưới đây để tải lại danh sách danh mục mặc định cho tài khoản của bạn.
                Lưu ý: Hành động này có thể ghi đè các danh mục bạn đã tự tạo.
            </Text>
            {loading ? (
                <ActivityIndicator size="large" color="#007bff" />
            ) : (
                <Button
                    title="Tải Danh mục Mặc định"
                    onPress={handleSyncCategories}
                    disabled={!userId} // Vô hiệu hóa nút nếu không có userId
                />
            )}
            {message ? <Text style={styles.messageText}>{message}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        color: '#555',
    },
    messageText: {
        marginTop: 15,
        fontSize: 14,
        color: 'red', // Mặc định là màu lỗi, có thể thay đổi dựa trên loại message
    },
});

export default SyncDefaultCategories;