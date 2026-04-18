import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { subscribeToBookingUpdates } from '../../services/bookingService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { theme } from '../../constants/theme';
import { AERIS_TEAL } from '../../constants/lguServices';
import {
  HomeIcon,
  ChatBubbleIcon,
  UserIcon,
  WarningTriangleIcon
} from '../../components/icons/WireframeIcons';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // 1. Global Notification Listener for Job Acceptances
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Start listening for job acceptances
    const unsubscribe = subscribeToBookingUpdates(user.uid, (booking) => {
      Alert.alert(
        "Job Accepted! 🎉",
        `${booking.providerName} has accepted your request for ${booking.serviceType}.`,
        [
          { text: "View Details", onPress: () => console.log("Navigate to booking details") },
          { text: "OK" }
        ]
      );
    });

    return () => unsubscribe();
  }, []);

  // 2. Listener for Unread Inbox Items (badge: unread chats + unread announcements)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Unread chat messages
    const chatQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      where('hasUnread', '==', true),
    );

    // Unread announcements (not in readBy array)
    // We count via a separate listener on announcements where readBy does not contain uid
    // Firestore doesn't support "not contains" — we track unread count client-side
    // using a dedicated unreadAnnouncements subcollection or a counter field.
    // For now: badge is driven by unread chats only; announcements badge added in Phase 2.
    const unsubChat = onSnapshot(chatQuery, (snapshot) => {
      setUnreadMsgCount(snapshot.size);
    });

    return () => unsubChat();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: (Platform.OS === 'android' ? 64 : 84) + insets.bottom,
          paddingBottom: insets.bottom + (Platform.OS === 'android' ? 10 : 20),
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: 4,
          fontFamily: 'Barlow',
        },
      }}
    >
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'EMERGENCY',
          tabBarActiveTintColor: theme.colors.emergencyRed,
          tabBarIcon: ({ color }) => (
            <WarningTriangleIcon size={24} color={color} strokeWidth={2.0} />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'SERVICES',
          tabBarActiveTintColor: theme.colors.primary,
          tabBarIcon: ({ color }) => (
            <HomeIcon size={24} color={color} strokeWidth={2.0} />
          ),
        }}
      />

      <Tabs.Screen
        name="city"
        options={{
          title: 'CITY',
          tabBarActiveTintColor: '#000',
          tabBarIcon: ({ color }) => (
            <Ionicons name="business-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="inbox"
        options={{
          title: 'INBOX',
          tabBarActiveTintColor: theme.colors.primary,
          tabBarIcon: ({ color }) => (
            <ChatBubbleIcon size={24} color={color} strokeWidth={2.0} />
          ),
          tabBarBadge: unreadMsgCount > 0 ? unreadMsgCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.emergencyRed,
            color: theme.colors.surface,
            fontSize: 9,
            minWidth: 16,
            height: 16,
            fontWeight: '800'
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarActiveTintColor: theme.colors.primary,
          tabBarIcon: ({ color }) => (
            <UserIcon size={24} color={color} strokeWidth={2.0} />
          ),
        }}
      />

      <Tabs.Screen
        name="lgu-services"
        options={{
          title: 'SERVICES',
          tabBarActiveTintColor: AERIS_TEAL,
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="grid-outline"
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* bookings is no longer a tab — hidden from bar, kept as a routable screen */}
      <Tabs.Screen
        name="bookings"
        options={{ href: null }}
      />
    </Tabs>
  );
}