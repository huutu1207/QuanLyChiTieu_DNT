// app/utils/firebaseUserUtils.js
import { database } from '@/firebaseConfig'; // Đảm bảo đường dẫn tới firebaseConfig của bạn là đúng
import { get, ref, set } from 'firebase/database';

/**
 * Sao chép danh mục mặc định vào tài khoản người dùng.
 * @param {string} userId - ID của người dùng.
 * @param {string} defaultCategoriesPath - Đường dẫn đến nút chứa danh mục mặc định trong Firebase (ví dụ: 'default_categories').
 * @returns {Promise<boolean>} - True nếu thành công, false nếu không tìm thấy dữ liệu nguồn.
 * @throws {Error} - Ném lỗi nếu có sự cố.
 */
export const copyDefaultCategoriesToUserAccount = async (userId, defaultCategoriesPath = 'categories') => {
    if (!userId) {
        console.error("[UserUtils] User ID is required to copy categories.");
        throw new Error("User ID is required.");
    }

    console.log(`[UserUtils] Attempting to copy categories for user ${userId} from /${defaultCategoriesPath}`);
    try {
        const defaultCategoriesRef = ref(database, defaultCategoriesPath);
        const snapshot = await get(defaultCategoriesRef);

        if (snapshot.exists()) {
            const defaultCategoriesData = snapshot.val();
            const userCategoriesRef = ref(database, `users/${userId}/categories`);
            await set(userCategoriesRef, defaultCategoriesData);
            console.log(`[UserUtils] Successfully copied default categories from /${defaultCategoriesPath} for user: ${userId}`);
            return true;
        } else {
            console.warn(`[UserUtils] Default categories data not found at /${defaultCategoriesPath}.`);
            return false;
        }
    } catch (error) {
        console.error(`[UserUtils] Error copying default categories for user ${userId} from /${defaultCategoriesPath}:`, error);
        throw error; // Ném lỗi để nơi gọi xử lý
    }
};