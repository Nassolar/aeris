import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';

const theme = {
  pageBg: '#F1F5F9',
  text: '#1e293b',
  activeTab: '#0B1121',
  inactiveTab: '#cbd5e1',
};

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState('Active');
  const [reports, setReports] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. FETCH EMERGENCY REPORTS (current user only)
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) { setLoading(false); return; }

    const unsubscribe = firestore()
      .collection("reports")
      .where("reportedBy", "==", user.uid)
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) { setLoading(false); return; }
          const fetchedReports = snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'emergency',
            ...doc.data()
          }));
          setReports(fetchedReports);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching reports:', error);
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, []);

  // 2. REAL SERVICES (Cleaned - No more fake data)
  useEffect(() => {
    // In the future, you will fetch real service bookings here.
    // For now, we leave it empty so the "Pending" tab is clean.
    setServices([]);
  }, []);

  // 3. FILTERING LOGIC
  const getSortedItems = () => {
    const allItems = [...reports, ...services];

    const filtered = allItems.filter(item => {
      // Normalize to lowercase to handle any capitalization issues
      const status = item.status ? item.status.toLowerCase().trim() : 'pending';

      if (activeTab === 'Pending') {
        return status === 'pending';
      }

      if (activeTab === 'Active') {
        return ['accepted', 'responding', 'on_route', 'on scene', 'on_scene'].includes(status);
      }

      if (activeTab === 'History') {
        return ['resolved', 'cancelled', 'completed', 'done', 'finished', 'declined'].includes(status);
      }

      return false;
    });

    return filtered.sort((a, b) => {
      if (a.type === 'emergency' && b.type !== 'emergency') return -1;
      if (a.type !== 'emergency' && b.type === 'emergency') return 1;
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeB - timeA;
    });
  };

  const handleEmergencyPress = (reportId: string) => {
    router.push({ pathname: '/report/[id]', params: { id: reportId } });
  };

  const handleServicePress = (serviceId: string) => {
    router.push({ pathname: '/booking/[id]', params: { id: serviceId } });
  };

  const renderEmergencyCard = (item: any) => (
    <TouchableOpacity
      style={styles.cardEmergency}
      activeOpacity={0.9}
      onPress={() => handleEmergencyPress(item.id)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.emergencyBadge}>
          <Ionicons name="warning" size={16} color="#fff" />
          <Text style={styles.emergencyBadgeText}>EMERGENCY • {item.category?.toUpperCase()}</Text>
        </View>
        <Text style={[styles.statusText, { color: '#fff' }]}>{item.status?.toUpperCase()}</Text>
      </View>

      <Text style={styles.emergencyTitle}>{item.description}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.emergencyId}>ID: {item.reportId}</Text>
        <Text style={styles.emergencyTime}>
          {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderServiceCard = (item: any) => (
    <TouchableOpacity
      style={styles.cardService}
      activeOpacity={0.7}
      onPress={() => handleServicePress(item.id)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.serviceBadge}>
          <Ionicons name="construct" size={16} color="#475569" />
          <Text style={styles.serviceBadgeText}>{item.category?.toUpperCase()}</Text>
        </View>
        <Text style={[styles.statusText, { color: '#64748b' }]}>{item.status?.toUpperCase()}</Text>
      </View>
      <Text style={styles.serviceTitle}>{item.description}</Text>
      <View style={styles.cardFooterLight}>
        <Text style={styles.serviceId}>Standard Request</Text>
        <Text style={styles.serviceTime}>Today</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.pageTitle}>My Bookings</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 8, paddingHorizontal: 12, borderRadius: 20 }}
            onPress={() => router.push('/track-report')}
          >
            <Ionicons name="search" size={16} color="#475569" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#475569' }}>Track Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {['Active', 'Pending', 'History'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={getSortedItems()}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) =>
            item.type === 'emergency' ? renderEmergencyCard(item) : renderServiceCard(item)
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} items found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.pageBg },
  header: { padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: theme.text },

  tabsContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: theme.activeTab },
  tabText: { color: theme.inactiveTab, fontWeight: '600' },
  activeTabText: { color: '#fff' },

  cardEmergency: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  emergencyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  emergencyBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  emergencyTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)', paddingTop: 10 },
  emergencyId: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  emergencyTime: { color: '#fff', fontWeight: '600', fontSize: 12 },

  cardService: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  serviceBadgeText: { color: '#475569', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  serviceTitle: { color: '#1e293b', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  cardFooterLight: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  serviceId: { color: '#94a3b8', fontSize: 12 },
  serviceTime: { color: '#64748b', fontWeight: '600', fontSize: 12 },

  statusText: { fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8' }
});