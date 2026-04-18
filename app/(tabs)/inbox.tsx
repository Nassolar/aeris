import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { theme } from '../../constants/theme';
import { Announcement } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatItem {
  id: string;
  reportId?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: { seconds: number } | null;
  lastMessageSenderId?: string;
  responderName?: string;
  reportCategory?: string;
  otherUserName?: string;
  otherUserRole?: string;
  otherUserRating?: number;
}

interface BookingItem {
  id: string;
  type: 'emergency' | 'service';
  status: string;
  category?: string;
  description?: string;
  timestamp?: { seconds: number } | null;
  reportId?: string;
  serviceType?: string;
  providerName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: { seconds: number } | null | undefined): string {
  if (!ts?.seconds) return '';
  const date = new Date(ts.seconds * 1000);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDate(ts: { seconds: number } | null | undefined): string {
  if (!ts?.seconds) return '';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Chat Sub-tab ─────────────────────────────────────────────────────────────

function ChatTab() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) { setLoading(false); return; }

    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', user.uid)
      .orderBy('lastMessageTime', 'desc')
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) { setLoading(false); return; }
          setChats(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChatItem)));
          setLoading(false);
        },
        (error) => { console.error('[Inbox/Chat] error:', error); setLoading(false); },
      );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.emergencyRed} style={styles.loader} />;
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      contentContainerStyle={chats.length === 0 ? styles.emptyWrap : { paddingVertical: 8 }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => {
        const user = auth().currentUser;
        const isLastMine = item.lastMessageSenderId === user?.uid;
        return (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => router.push({
              pathname: '/chat/[chatId]',
              params: {
                chatId: item.id,
                otherUserName: item.otherUserName ?? item.responderName ?? 'Responder',
                otherUserRole: item.otherUserRole ?? item.reportCategory?.toUpperCase() ?? 'Emergency',
                otherUserRating: String(item.otherUserRating ?? '5.0'),
              },
            })}
          >
            <View style={[styles.avatar, { backgroundColor: theme.colors.emergencyRed }]}>
              <Ionicons name="shield-checkmark" size={22} color="#fff" />
            </View>
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle}>
                  {item.responderName ?? item.otherUserName ?? 'Responder'}
                </Text>
                <Text style={styles.rowTime}>{formatTime(item.lastMessageTime)}</Text>
              </View>
              <Text style={styles.rowSub} numberOfLines={1}>
                {isLastMine ? 'You: ' : ''}{item.lastMessage ?? 'New conversation'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySub}>
            Messages from responders and partners will appear here.
          </Text>
        </View>
      }
    />
  );
}

// ─── Bookings Sub-tab ─────────────────────────────────────────────────────────

const STATUS_ACTIVE = ['accepted', 'responding', 'on_route', 'on scene', 'on_scene'];
const STATUS_PENDING = ['pending'];
const STATUS_HISTORY = ['resolved', 'cancelled', 'completed', 'done', 'finished', 'declined'];

function BookingsTab() {
  const router = useRouter();
  const [filter, setFilter] = useState<'Active' | 'Pending' | 'History'>('Active');
  const [reports, setReports] = useState<BookingItem[]>([]);
  const [services, setServices] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) { setLoading(false); return; }

    const unsubscribe = firestore()
      .collection('reports')
      .where('reportedBy', '==', user.uid)
      .orderBy('timestamp', 'desc')
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) { setLoading(false); return; }
          setReports(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              type: 'emergency' as const,
              ...doc.data(),
            } as BookingItem)),
          );
          setLoading(false);
        },
        (error) => { console.error('[Inbox/Bookings] error:', error); setLoading(false); },
      );

    return () => unsubscribe();
  }, []);

  const filtered = [...reports, ...services].filter((item) => {
    const s = (item.status ?? 'pending').toLowerCase().trim();
    if (filter === 'Active') return STATUS_ACTIVE.includes(s);
    if (filter === 'Pending') return STATUS_PENDING.includes(s);
    return STATUS_HISTORY.includes(s);
  }).sort((a, b) => {
    if (a.type === 'emergency' && b.type !== 'emergency') return -1;
    if (a.type !== 'emergency' && b.type === 'emergency') return 1;
    return (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0);
  });

  const hasActiveBooking = services.some((s) => STATUS_ACTIVE.includes((s.status ?? '').toLowerCase()));

  return (
    <View style={{ flex: 1 }}>
      {hasActiveBooking && (
        <View style={styles.activeDot}>
          <View style={styles.activeDotIndicator} />
          <Text style={styles.activeDotText}>Active booking in progress</Text>
        </View>
      )}
      <View style={styles.filterRow}>
        {(['Active', 'Pending', 'History'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterBtn, filter === tab && styles.filterBtnActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterLabel, filter === tab && styles.filterLabelActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.id ?? String(i)}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) =>
            item.type === 'emergency' ? (
              <TouchableOpacity
                style={styles.cardEmergency}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/report/[id]', params: { id: item.id } })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.emergencyBadge}>
                    <Ionicons name="warning" size={14} color="#fff" />
                    <Text style={styles.emergencyBadgeText}>
                      EMERGENCY · {item.category?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.statusText, { color: '#fff' }]}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.emergencyTitle} numberOfLines={2}>{item.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.emergencyId}>ID: {item.reportId}</Text>
                  <Text style={styles.emergencyTime}>
                    {item.timestamp?.seconds
                      ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.cardService}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/booking/[id]', params: { id: item.id } })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.serviceBadge}>
                    <Ionicons name="construct" size={14} color="#475569" />
                    <Text style={styles.serviceBadgeText}>{item.serviceType?.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.statusText, { color: '#64748b' }]}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.serviceTitle} numberOfLines={2}>{item.description}</Text>
                <View style={styles.cardFooterLight}>
                  <Text style={styles.serviceId}>{item.providerName ?? 'Partner'}</Text>
                  <Text style={styles.serviceTime}>
                    {item.timestamp ? formatTime(item.timestamp) : 'Today'}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>No {filter.toLowerCase()} bookings</Text>
              <Text style={styles.emptySub}>
                Your emergency reports and service bookings will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Announcements Sub-tab ────────────────────────────────────────────────────

function AnnouncementsTab() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) { setLoading(false); return; }

    // Fetch platform-wide announcements (psgcCode == null or scope == 'all')
    // Full scoped query (by citizen's lguScopes.primary.psgcCode) added when KYC is live.
    const unsubscribe = firestore()
      .collection('announcements')
      .where('psgcCode', '==', null)
      .orderBy('publishedAt', 'desc')
      .limit(30)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) { setLoading(false); return; }
          setAnnouncements(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Announcement)),
          );
          setLoading(false);
        },
        (error) => { console.error('[Inbox/Announcements] error:', error); setLoading(false); },
      );

    return () => unsubscribe();
  }, []);

  const markRead = async (announcementId: string) => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      await firestore()
        .collection('announcements')
        .doc(announcementId)
        .update({ readBy: firestore.FieldValue.arrayUnion(user.uid) });
    } catch (err) {
      console.error('[Inbox/Announcements] markRead error:', err);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.emergencyRed} style={styles.loader} />;
  }

  if (announcements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="megaphone-outline" size={40} color="#9CA3AF" />
        <Text style={styles.emptyText}>No announcements yet</Text>
        <Text style={styles.emptySub}>
          LGU and AERIS platform announcements will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={announcements}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingVertical: 8 }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => {
        const user = auth().currentUser;
        const isRead = user ? item.readBy?.includes(user.uid) : true;
        return (
          <TouchableOpacity
            style={[styles.row, !isRead && styles.rowUnread]}
            activeOpacity={0.7}
            onPress={() => { if (!isRead) markRead(item.id); }}
          >
            <View style={[styles.avatar, {
              backgroundColor: item.priority === 'urgent' ? '#E84040' : '#2ECC71',
            }]}>
              <Ionicons name="megaphone" size={18} color="#fff" />
            </View>
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowTime}>{formatDate(item.publishedAt)}</Text>
              </View>
              <Text style={styles.rowSub} numberOfLines={1}>{item.source}</Text>
              <Text style={styles.rowPreview} numberOfLines={2}>{item.body}</Text>
            </View>
            {!isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ─── Inbox Screen ─────────────────────────────────────────────────────────────

type InboxTab = 'chat' | 'bookings' | 'announcements';

export default function InboxScreen() {
  const [tab, setTab] = useState<InboxTab>('chat');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Inbox</Text>
      </View>

      <View style={styles.tabBar}>
        {(
          [
            { key: 'chat', label: 'Chat' },
            { key: 'bookings', label: 'Bookings' },
            { key: 'announcements', label: 'Announcements' },
          ] as { key: InboxTab; label: string }[]
        ).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'chat' && <ChatTab />}
      {tab === 'bookings' && <BookingsTab />}
      {tab === 'announcements' && <AnnouncementsTab />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { marginTop: 60 },

  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#111827' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: theme.colors.primary },
  tabLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  tabLabelActive: { color: theme.colors.primary },

  // Chat / Announcement rows
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
  },
  rowUnread: { backgroundColor: '#F0F9FF' },
  separator: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 76 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  rowTime: { fontSize: 12, color: '#9CA3AF' },
  rowSub: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  rowPreview: { fontSize: 12, color: '#9CA3AF', lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
    marginTop: 4,
  },

  // Bookings
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterBtnActive: { backgroundColor: '#0B1121' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#CBD5E1' },
  filterLabelActive: { color: '#fff' },

  activeDot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ECC71',
    marginRight: 8,
  },
  activeDotText: { fontSize: 12, fontWeight: '600', color: '#065F46' },

  cardEmergency: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emergencyBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  emergencyTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: 10,
  },
  emergencyId: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  emergencyTime: { color: '#fff', fontWeight: '600', fontSize: 12 },

  cardService: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  serviceBadgeText: { color: '#475569', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  serviceTitle: { color: '#1E293B', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  cardFooterLight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  serviceId: { color: '#94A3B8', fontSize: 12 },
  serviceTime: { color: '#64748B', fontWeight: '600', fontSize: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },

  // Empty states
  emptyWrap: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8, marginTop: 16 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
