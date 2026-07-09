import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';
import api from '../services/api';

const FeesScreen = ({ isDarkMode }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalPaid: 0 });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/fees/payments/');
      const list = response.data || [];
      setPayments(list);

      const total = list.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      setSummary({ totalPaid: total });
    } catch (e) {
      console.error('Failed to load payment ledger:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Tuition Fees Contributed</Text>
          <Text style={[styles.summaryValue, { color: theme.success }]}>₹{summary.totalPaid.toLocaleString()}</Text>
        </View>

        {/* Ledger list */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Fee Receipts History</Text>
        
        {payments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No payments logged yet.</Text>
          </View>
        ) : (
          payments.map((item, idx) => (
            <View key={idx} style={[styles.receiptItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View>
                <Text style={[styles.receiptTitle, { color: theme.text }]}>{item.receipt_id || `REC-${1000 + idx}`}</Text>
                <Text style={[styles.receiptDate, { color: theme.textSecondary }]}>📅 {item.date}</Text>
                {item.method && (
                  <Text style={[styles.receiptMethod, { color: theme.textSecondary }]}>Method: {item.method}</Text>
                )}
              </View>
              <View style={styles.amountCol}>
                <Text style={[styles.amountValue, { color: theme.text }]}>₹{item.amount}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${theme.success}15`, borderColor: theme.success }]}>
                  <Text style={[styles.statusText, { color: theme.success }]}>Paid</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FeesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  receiptDate: {
    fontSize: 10,
    marginBottom: 2,
  },
  receiptMethod: {
    fontSize: 9,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  }
});
