import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
// Removed MaterialIcons import to avoid font issues
import { logService, focusService } from '../services/dataService';
import { Log, Focus, LogType } from '../types/dainandini';
import SimpleDrawer from '../navigation/SimpleDrawerNavigator';
import { useFilter } from '../contexts/FilterContext';

const DainandiniScreen = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [foci, setFoci] = useState<Focus[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddFocus, setShowAddFocus] = useState(false);
  
  // Form states
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogContent, setNewLogContent] = useState('');
  const [selectedFocusId, setSelectedFocusId] = useState<string>('');
  const [newFocusName, setNewFocusName] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  
  const { filterState, getFilterTitle } = useFilter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, fociData] = await Promise.all([
        logService.getAll(),
        focusService.getAll(),
      ]);
      
      setLogs(logsData);
      setFoci(fociData);
      
      // Set default focus if none selected
      if (!selectedFocusId && fociData.length > 0) {
        setSelectedFocusId(fociData[0].id);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!newLogTitle.trim()) {
      Alert.alert('Error', 'Please enter a log title');
      return;
    }

    if (!selectedFocusId) {
      Alert.alert('Error', 'Please select a focus area');
      return;
    }

    try {
      await logService.add({
        title: newLogTitle.trim(),
        content: newLogContent.trim(),
        type: LogType.TEXT,
        focusId: selectedFocusId,
        date: new Date(),
        userId: '',
      });
      
      setNewLogTitle('');
      setNewLogContent('');
      setShowAddLog(false);
      loadData();
      Alert.alert('Success', 'Log entry added!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddFocus = async () => {
    if (!newFocusName.trim()) {
      Alert.alert('Error', 'Please enter a focus name');
      return;
    }

    try {
      const focusId = await focusService.add({
        name: newFocusName.trim(),
        description: `Focus area for ${newFocusName.trim()}`,
        icon: 'bookmark',
        color: '#2196F3',
        allowedLogTypes: [LogType.TEXT, LogType.CHECKLIST, LogType.RATING],
      });
      
      setNewFocusName('');
      setShowAddFocus(false);
      setSelectedFocusId(focusId);
      loadData();
      Alert.alert('Success', 'Focus area added!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this log entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await logService.delete(logId);
              loadData();
              Alert.alert('Success', 'Log entry deleted!');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  // Apply filtering based on filter context
  const getFilteredLogs = () => {
    const { activeFilter, selectedFocusId } = filterState.dainandini;
    let filtered = logs;

    if (activeFilter === 'filter:today') {
      const today = new Date();
      filtered = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.toDateString() === today.toDateString();
      });
    } else if (activeFilter.startsWith('focus:')) {
      const focusId = activeFilter.replace('focus:', '');
      filtered = logs.filter(log => log.focusId === focusId);
    }

    return filtered;
  };

  const filteredLogs = getFilteredLogs();
  const selectedFocus = foci.find(focus => focus.id === filterState.dainandini.selectedFocusId);

  const getLogIcon = (type: LogType) => {
    switch (type) {
      case LogType.TEXT: return '📝';
      case LogType.CHECKLIST: return '✅';
      case LogType.RATING: return '⭐';
      case LogType.IMAGE: return '🖼️';
      case LogType.VOICE: return '🎤';
      default: return '📄';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Focus Selector */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.hamburgerButton}
            onPress={() => setShowDrawer(true)}
          >
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{getFilterTitle('dainandini')}</Text>
            <Text style={styles.subtitle}>
              {filteredLogs.length} entries
            </Text>
          </View>
        </View>
      </View>

      {/* Logs List */}
      <ScrollView 
        style={styles.logsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>No log entries yet</Text>
            <Text style={styles.emptySubtext}>
              {selectedFocus ? `Start logging in ${selectedFocus.name}` : 'Create a focus area and start logging'}
            </Text>
          </View>
        ) : (
          filteredLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logTitleRow}>
                  <Text style={styles.logIcon}>
                    {getLogIcon(log.type)}
                  </Text>
                  <Text style={styles.logTitle}>{log.title}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteLog(log.id)}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
              
              {log.content && (
                <Text style={styles.logContent} numberOfLines={3}>
                  {log.content}
                </Text>
              )}
              
              <View style={styles.logMeta}>
                <Text style={styles.logDate}>
                  {log.date.toLocaleDateString()} at {log.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {log.mood && (
                  <Text style={styles.logMood}>
                    Mood: {log.mood}/10
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Log Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddLog(true)}
        disabled={!selectedFocusId}
      >
        <Text style={styles.addButtonIcon}>➕</Text>
      </TouchableOpacity>

      {/* Add Log Modal */}
      <Modal visible={showAddLog} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Log Entry</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Log title..."
              value={newLogTitle}
              onChangeText={setNewLogTitle}
              autoFocus
            />
            
            <TextInput
              style={[styles.textInput, styles.contentInput]}
              placeholder="What's on your mind? (optional)"
              value={newLogContent}
              onChangeText={setNewLogContent}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddLog(false);
                  setNewLogTitle('');
                  setNewLogContent('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddLog}
              >
                <Text style={styles.addButtonText}>Add Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Focus Modal */}
      <Modal visible={showAddFocus} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Focus Area</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Focus area name..."
              value={newFocusName}
              onChangeText={setNewFocusName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddFocus(false);
                  setNewFocusName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddFocus}
              >
                <Text style={styles.addButtonText}>Add Focus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Simple Drawer */}
      <SimpleDrawer
        isVisible={showDrawer}
        onClose={() => setShowDrawer(false)}
        currentModule="Dainandini"
        onModuleChange={(action) => {
          // Filter state is now managed by FilterContext
          setShowDrawer(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hamburgerButton: {
    padding: 5,
    marginRight: 15,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#2196F3',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    marginBottom: 15,
  },
  focusSelector: {
    flexDirection: 'row',
  },
  focusChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedFocusChip: {
    backgroundColor: '#2196F3',
  },
  focusChipText: {
    color: '#666',
    fontSize: 14,
  },
  selectedFocusChipText: {
    color: 'white',
  },
  addFocusChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFocusText: {
    color: '#2196F3',
    fontSize: 14,
    marginLeft: 4,
  },
  logsList: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  logCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  logContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logDate: {
    fontSize: 12,
    color: '#999',
  },
  logMood: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonIcon: {
    color: 'white',
    fontSize: 24,
  },
  logIcon: {
    fontSize: 18,
    color: '#2196F3',
    marginRight: 8,
  },
  deleteIcon: {
    fontSize: 18,
    color: '#FF3B30',
  },
  emptyIcon: {
    fontSize: 64,
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  contentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  addButtonModal: {
    backgroundColor: '#2196F3',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DainandiniScreen;
