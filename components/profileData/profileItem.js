// components/profileData/profileItem.js
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

// Dữ liệu tĩnh cho mục Hồ sơ
const profileStaticData = {
  id: 'profile',
  title: 'Hồ sơ',
  icon: 'user',
  description: 'Tên người dùng: Nguyễn Văn A\nEmail: nguyen.van.a@example.com\nNgày tham gia: 01/01/2023',
};

export const ProfileItem = ({
  itemStyles,
  IconSymbolComponent,
  ThemedTextComponent,
}) => {
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  const toggleProfileExpansion = () => {
    setIsProfileExpanded(prev => !prev);
  };

  const option = profileStaticData;

  const styles = itemStyles;

  return (
    <View style={[styles.optionWrapper, styles.lightBorder]}>
      <TouchableOpacity
        style={styles.optionButtonBase}
        onPress={toggleProfileExpansion}
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
          style={[styles.optionArrow, isProfileExpanded && styles.arrowExpanded, styles.arrowLight]}
        />
      </TouchableOpacity>

      {isProfileExpanded && (
        <View style={[styles.expandedArea, styles.expandedAreaLight]}>
          <ThemedTextComponent style={[styles.darkModeDescription, styles.descriptionLight]}>
            {option.description}
          </ThemedTextComponent>
        </View>
      )}
    </View>
  );
};