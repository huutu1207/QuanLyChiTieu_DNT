// components/profileData/darkModeItem.js
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
// Giả sử IconSymbol và ThemedText được truyền vào như props để đảm bảo tính nhất quán
// Hoặc bạn có thể import chúng nếu chúng là global components hoặc có đường dẫn cố định.

// Dữ liệu tĩnh cho mục Chế độ tối - có thể để nội bộ trong component này
const darkModeStaticData = {
  id: 'darkMode',
  title: 'Chế độ tối',
  icon: 'moon',
  description: 'Điều chỉnh giao diện để giảm độ chói và cho đôi mắt được nghỉ ngơi.',
};

export const DarkModeSectionUI = ({
  // Props để nhận các style chung và components từ cha
  itemStyles,
  IconSymbolComponent,
  ThemedTextComponent,
}) => {
  const [darkModeSetting, setDarkModeSetting] = useState('Sáng');
  const [isDarkModeOptionExpanded, setIsDarkModeOptionExpanded] = useState(false);

  const toggleDarkModeExpansion = () => {
    setIsDarkModeOptionExpanded(prev => !prev);
  };

  const handleThemeSelection = (selection) => {
    setDarkModeSetting(selection);
    // setIsDarkModeOptionExpanded(false); // Tùy chọn đóng lại
  };

  const option = darkModeStaticData; // Sử dụng dữ liệu tĩnh đã định nghĩa

  // Sử dụng itemStyles được truyền vào để lấy các style cụ thể
  const styles = itemStyles; // Gán vào biến styles để dễ sử dụng trong JSX

  return (
    <View style={[styles.optionWrapper, styles.lightBorder]}>
      <TouchableOpacity
        style={styles.optionButtonBase}
        onPress={toggleDarkModeExpansion}
        activeOpacity={0.7}
      >
        <IconSymbolComponent
          name={option.icon}
          style={[styles.optionIcon, styles.optionIconLight]}
          isSelected={darkModeSetting}
        />
        <ThemedTextComponent style={[styles.optionText, styles.textLight]}>
          {option.title}
        </ThemedTextComponent>
        <ThemedTextComponent style={[styles.optionTrailingText, styles.trailingTextLight]}>
          {darkModeSetting === 'Sáng' ? 'Tắt' : 'Bật'}
        </ThemedTextComponent>
        <IconSymbolComponent
          name="chevron_right"
          style={[styles.optionArrow, isDarkModeOptionExpanded && styles.arrowExpanded, styles.arrowLight]}
        />
      </TouchableOpacity>

      {isDarkModeOptionExpanded && (
        <View style={[styles.expandedArea, styles.expandedAreaLight]}>
          <ThemedTextComponent style={[styles.darkModeDescription, styles.descriptionLight]}>
            {option.description}
          </ThemedTextComponent>
          <TouchableOpacity
            style={styles.themeChoiceButton}
            onPress={() => handleThemeSelection('Sáng')}
          >
            <IconSymbolComponent
              name={darkModeSetting === 'Sáng' ? 'radio_on' : 'radio_off'}
              style={[styles.radioIcon, styles.radioIconLight]}
            />
            <ThemedTextComponent style={[styles.themeChoiceText, styles.textLight]}>
              Sáng
            </ThemedTextComponent>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.themeChoiceButton}
            onPress={() => handleThemeSelection('Tối')}
          >
            <IconSymbolComponent
              name={darkModeSetting === 'Tối' ? 'radio_on' : 'radio_off'}
              style={[styles.radioIcon, styles.radioIconLight]}
            />
            <ThemedTextComponent style={[styles.themeChoiceText, styles.textLight]}>
              Tối
            </ThemedTextComponent>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};