// components/NumericKeypad.js
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../app/colors';

const Key = ({ value, onPress, style, textStyle, flex = 1, iconName, iconSize = 28 }) => (
  <TouchableOpacity style={[styles.key, { flex }, style]} onPress={() => onPress(value)}>
    {iconName ? (<Ionicons name={iconName} size={iconSize} color={textStyle.color} />) : (<Text style={[styles.keyText, textStyle]}>{value}</Text>)}
  </TouchableOpacity>
);

export default function NumericKeypad({ onKeyPress, onBackspace, onConfirm }) {
  const currentColors = {
    keypadBackground: COLORS.keypadBackground, keyBackground: COLORS.keyBackground, keyText: { color: COLORS.keyText },
    keySpecialBackground: COLORS.keySpecialBackground, keyConfirmBackground: COLORS.keyConfirmBackground, keyConfirmText: { color: COLORS.keyConfirmText },
  };
  return (
    <View style={[styles.keypadContainer, { backgroundColor: currentColors.keypadBackground }]}>
      <View style={styles.row}><Key value="7" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /><Key value="8" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /><Key value="9" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /></View>
      <View style={styles.row}><Key value="4" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /><Key value="5" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /><Key value="6" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /></View>
      <View style={styles.row}><Key value="1" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /><Key value="2" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /><Key value="3" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /></View>
      <View style={styles.row}><Key value="." onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /><Key value="0" onPress={onKeyPress} style={{ backgroundColor: currentColors.keyBackground }} textStyle={currentColors.keyText} /><Key value="backspace" onPress={onBackspace} style={{ backgroundColor: currentColors.keySpecialBackground }} textStyle={currentColors.keyText} iconName="backspace-outline" /></View>
      <TouchableOpacity style={[styles.confirmButton, { backgroundColor: currentColors.keyConfirmBackground }]} onPress={onConfirm}><Ionicons name="checkmark-outline" size={32} color={currentColors.keyConfirmText.color} /></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  keypadContainer: { paddingHorizontal: 5, paddingTop: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 },
  key: { height: 55, margin: 3, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05 },
  keyText: { fontSize: 24, fontWeight: '500' },
  confirmButton: { height: 60, marginHorizontal: 3, marginBottom: Platform.OS === 'ios' ? 20 : 5, marginTop: 5, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 1 },
});