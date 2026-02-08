import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { SearchIcon } from '../icons';
import { colors } from '../../constants';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search Event or Provider'
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <SearchIcon size={20} color={colors.gray900} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconWrapper: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 16,
    color: colors.text.primary,
    padding: 0,
  },
});
