import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, font } from '../constants';
import { ArrowBackIcon } from '../components/icons';

export interface PolicyItem {
  label: string;
  content: string;
}

export interface PolicySection {
  heading: string;
  body?: string;
  items?: PolicyItem[];
  bullets?: string[];
}

interface PolicyLayoutProps {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: PolicySection[];
  contactEmail?: string;
}

export default function PolicyLayout({ title, effectiveDate, intro, sections, contactEmail }: PolicyLayoutProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowBackIcon size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.effectiveDate}>Effective date: {effectiveDate}</Text>
        <Text style={styles.intro}>{intro}</Text>

        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionHeading}>{`${idx + 1}. ${section.heading}`}</Text>
            {section.body ? <Text style={styles.sectionBody}>{section.body}</Text> : null}

            {section.bullets?.map((bullet, bIdx) => (
              <View key={bIdx} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}

            {section.items?.map((item, iIdx) => (
              <View key={iIdx} style={styles.itemRow}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemContent}>{item.content}</Text>
              </View>
            ))}
          </View>
        ))}

        {contactEmail ? (
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>Contact</Text>
            <Text style={styles.contactEmail}>{contactEmail}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: '#1C1C1E',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  effectiveDate: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.gray500,
    marginBottom: 12,
  },
  intro: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.black,
    marginBottom: 10,
  },
  sectionBody: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 21,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: 4,
    marginTop: 4,
  },
  bulletDot: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.text.primary,
    width: 16,
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 21,
  },
  itemRow: {
    marginTop: 10,
  },
  itemLabel: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.black,
    marginBottom: 4,
  },
  itemContent: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 21,
  },
  contactBox: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
  },
  contactLabel: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.gray500,
    marginBottom: 4,
  },
  contactEmail: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.black,
  },
});
