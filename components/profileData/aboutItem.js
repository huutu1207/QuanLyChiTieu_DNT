// components/profileData/aboutItem.js
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

// Dữ liệu tĩnh cho mục Về chúng tôi
const aboutUsStaticData = {
  id: 'aboutUs',
  title: 'Về chúng tôi',
  icon: 'info_circle',
  description: 'Môn học: Phát triển ứng dụng đa nền tảng\nTên nhóm: Nhóm 3\nMô tả: Ứng dụng này được phát triển nhằm cung cấp trải nghiệm quản lý thông tin cá nhân tiện lợi và trực quan trên nhiều nền tảng.',
};

export const AboutItem = ({
  itemStyles,
  IconSymbolComponent,
  ThemedTextComponent,
}) => {
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  const toggleAboutExpansion = () => {
    setIsAboutExpanded(prev => !prev);
  };

  const option = aboutUsStaticData;

  const styles = itemStyles;

  return (
    <View style={[styles.optionWrapper, styles.lightBorder]}>
      <TouchableOpacity
        style={styles.optionButtonBase}
        onPress={toggleAboutExpansion}
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
          style={[styles.optionArrow, isAboutExpanded && styles.arrowExpanded, styles.arrowLight]}
        />
      </TouchableOpacity>

      {isAboutExpanded && (
        <View style={[styles.expandedArea, styles.expandedAreaLight]}>
          <ThemedTextComponent style={[styles.darkModeDescription, styles.descriptionLight]}>
            {option.description}
          </ThemedTextComponent>
        </View>
      )}
    </View>
  );
};