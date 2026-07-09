import React, { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { lightTheme, darkTheme } from '../theme/colors';
import { API_BASE_URL } from '../services/api';

const ReportCardScreen = ({ isDarkMode }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { userToken, userInfo } = useContext(AuthContext);

  const handleDownloadPdf = async () => {
    if (!userToken) return;
    
    // Construct the authenticated download URL with the query parameter token
    const downloadUrl = `${API_BASE_URL}/parent/report-card/?token=${userToken}`;
    
    try {
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        console.error("Don't know how to open URI: " + downloadUrl);
      }
    } catch (err) {
      console.error('An error occurred during link navigation:', err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.centeredContent}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardEmoji, { color: theme.primary }]}>🎓</Text>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Academic Progress Report</Text>
          
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Download the official monthly report card for {userInfo?.first_name || 'your student'}. The progress report contains compiled attendance rates, recent test scores, and qualitative remarks from teachers.
          </Text>

          <TouchableOpacity
            style={[styles.downloadBtn, { backgroundColor: theme.primary }]}
            onPress={handleDownloadPdf}
          >
            <Text style={styles.downloadText}>📥 Download Report Card (PDF)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ReportCardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  downloadBtn: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  downloadText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
