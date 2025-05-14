import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

// Dữ liệu tĩnh cho mục Cài đặt
const settingsStaticData = {
  id: 'settings',
  title: 'Cài đặt',
  icon: 'cog',
  options: [
    { title: 'Thông báo', icon: 'bell', description: 'Quản lý cài đặt thông báo' },
    { title: 'Ngôn ngữ', icon: 'language', description: 'Thay đổi ngôn ngữ ứng dụng' },
    { title: 'Bảo mật', icon: 'shield_check', description: 'Cài đặt bảo mật và quyền riêng tư' },
    // Đã xóa "Đăng xuất"
  ],
};

export const SettingsItem = ({
  itemStyles,
  IconSymbolComponent,
  ThemedTextComponent,
  onPressOption,
}) => {
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  const toggleSettingsExpansion = () => {
    setIsSettingsExpanded(prev => !prev);
  };

  const handleOptionPress = (title) => {
    onPressOption(title);
  };

  const option = settingsStaticData;

  const styles = itemStyles;

  return (
    <View style={[styles.optionWrapper, styles.lightBorder]}>
      <TouchableOpacity
        style={styles.optionButtonBase}
        onPress={toggleSettingsExpansion}
        activeOpacity={0.7}
      >
        <IconSymbolComponent
          name={option.icon}
          style={[styles.optionIcon, styles.optionIconLight]}
        />
        <ThemedTextComponent style={[styles.optionText, styles.textLight]}>
          {option.title}
        </ThemedTextComponent>
        <IconSymbolComponent
          name="chevron_right"
          style={[styles.optionArrow, isSettingsExpanded && styles.arrowExpanded, styles.arrowLight]}
        />
      </TouchableOpacity>

      {isSettingsExpanded && (
        <View style={[styles.expandedArea, styles.expandedAreaLight]}>
          {option.options.map((setting, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.themeChoiceButton}
              onPress={() => handleOptionPress(setting.title)}
              activeOpacity={0.7}
            >
              <IconSymbolComponent
                name={setting.icon}
                style={[styles.optionIcon, styles.optionIconLight]}
              />
              <View style={styles.optionTextContainer}>
                <ThemedTextComponent style={[styles.themeChoiceText, styles.textLight]}>
                  {setting.title}
                </ThemedTextComponent>
                <ThemedTextComponent style={[styles.darkModeDescription, styles.descriptionLight]}>
                  {setting.description}
                </ThemedTextComponent>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};