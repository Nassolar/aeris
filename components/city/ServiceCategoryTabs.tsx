import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { SERVICE_CATALOG } from '../../constants/serviceCatalog';
import { theme } from '../../constants/theme';

const ACTIVE_COLOR = '#2ECC71';
const INACTIVE_TEXT = '#888888';

export interface ServiceCategoryTabsProps {
  selectedCategoryId: string | null; // null = All
  onSelectCategory: (id: string | null) => void;
}

export default function ServiceCategoryTabs({
  selectedCategoryId,
  onSelectCategory,
}: ServiceCategoryTabsProps) {
  const tabs = [
    { id: null, label: 'All' },
    ...SERVICE_CATALOG.map((cat) => ({ id: cat.id as string | null, label: cat.label })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {tabs.map((tab) => {
        const isActive = selectedCategoryId === tab.id;
        return (
          <TouchableOpacity
            key={tab.id ?? '__all__'}
            onPress={() => onSelectCategory(tab.id)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.underline} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    gap: 4,
  },
  tab: {
    marginRight: 20,
    paddingBottom: 6,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
  },
  labelActive: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  labelInactive: {
    color: INACTIVE_TEXT,
    fontWeight: '400',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ACTIVE_COLOR,
    borderRadius: 1,
  },
});
