import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { theme } from '../../constants/theme';

interface TopTabSwitcherProps {
    activeTab: 'emergency' | 'services';
    onTabChange: (tab: 'emergency' | 'services') => void;
}

export default function TopTabSwitcher({ activeTab, onTabChange }: TopTabSwitcherProps) {
    // Tab switch is instant with border color transition 0.18s ease
    // To achieve the specific underline transition, we can animate the underline bar position/colors, but requirements state:
    // "Tab switch is instant with border color transition 0.18s ease"
    // "Uber-style bottom border underline active state (no pill/background), red underline for Emergency, green for Services"

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.tab}
                onPress={() => onTabChange('emergency')}
                activeOpacity={1}
            >
                <Text style={[
                    styles.tabText,
                    activeTab === 'emergency' ? styles.activeEmergencyText : styles.inactiveText
                ]}>
                    Emergency
                </Text>
                <View style={[
                    styles.underline,
                    activeTab === 'emergency' ? styles.activeEmergencyUnderline : styles.inactiveUnderline
                ]} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tab}
                onPress={() => onTabChange('services')}
                activeOpacity={1}
            >
                <Text style={[
                    styles.tabText,
                    activeTab === 'services' ? styles.activeServicesText : styles.inactiveText
                ]}>
                    Services
                </Text>
                <View style={[
                    styles.underline,
                    activeTab === 'services' ? styles.activeServicesUnderline : styles.inactiveUnderline
                ]} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        paddingBottom: 14,
        position: 'relative',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '700',
    },
    activeEmergencyText: {
        color: theme.colors.emergencyRed,
    },
    activeServicesText: {
        color: theme.colors.uberGreen,
    },
    inactiveText: {
        color: theme.colors.textLight,
    },
    underline: {
        position: 'absolute',
        bottom: -1,
        left: 20,
        right: 20,
        height: 3,
    },
    activeEmergencyUnderline: {
        backgroundColor: theme.colors.emergencyRed,
    },
    activeServicesUnderline: {
        backgroundColor: theme.colors.uberGreen,
    },
    inactiveUnderline: {
        backgroundColor: 'transparent',
    },
});
