import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  Animated,
  Dimensions 
} from 'react-native';
import { listService, focusService, habitService, goalService, tagService } from '../services/dataService';
import { useFilter } from '../contexts/FilterContext';

const { width: screenWidth } = Dimensions.get('window');

interface DrawerItem {
  id: string;
  title: string;
  icon: string;
  count?: number;
  onPress?: () => void;
  isSubItem?: boolean;
  isActive?: boolean;
}

interface SimpleDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  currentModule: 'Home' | 'Kary' | 'Abhyasa' | 'Dainandini';
  onModuleChange: (module: string) => void;
}

const SimpleDrawer: React.FC<SimpleDrawerProps> = ({ 
  isVisible, 
  onClose, 
  currentModule, 
  onModuleChange 
}) => {
  const [lists, setLists] = useState<any[]>([]);
  const [focusAreas, setFocusAreas] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { 
    filterState, 
    updateKaryFilter, 
    updateAbhyasaFilter, 
    updateDainandiniFilter 
  } = useFilter();

  useEffect(() => {
    if (isVisible) {
      loadFirebaseData();
    }
  }, [isVisible, currentModule]);

  const loadFirebaseData = async () => {
    setLoading(true);
    try {
      const [listsData, focusData, habitsData, goalsData, tagsData] = await Promise.all([
        listService?.getAll?.() || Promise.resolve([]),
        focusService?.getAll?.() || Promise.resolve([]),
        habitService?.getAll?.() || Promise.resolve([]),
        goalService?.getAll?.() || Promise.resolve([]),
        tagService?.getAll?.() || Promise.resolve([])
      ]);
      setLists(listsData);
      setFocusAreas(focusData);
      setHabits(habitsData);
      setGoals(goalsData);
      setTags(tagsData);
    } catch (error) {
      console.log('Error loading drawer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleItems = (): DrawerItem[] => {
    switch (currentModule) {
      case 'Kary':
        const karyItems: DrawerItem[] = [
          { 
            id: 'today', 
            title: 'Today', 
            icon: '📅', 
            count: 0,
            isActive: filterState.kary.activeFilter === 'filter:today',
            onPress: () => {
              updateKaryFilter('filter:today');
              onModuleChange('filter:today');
            }
          },
          { 
            id: 'due', 
            title: 'Due', 
            icon: '⏰', 
            count: 1,
            isActive: filterState.kary.activeFilter === 'filter:due',
            onPress: () => {
              updateKaryFilter('filter:due');
              onModuleChange('filter:due');
            }
          },
          { 
            id: 'upcoming', 
            title: 'Upcoming', 
            icon: '⏳', 
            count: 1,
            isActive: filterState.kary.activeFilter === 'filter:upcoming',
            onPress: () => {
              updateKaryFilter('filter:upcoming');
              onModuleChange('filter:upcoming');
            }
          },
        ];
        
        // Add Lists section based on Firebase data
        lists.forEach(list => {
          karyItems.push({
            id: `list-${list.id}`,
            title: list.name,
            icon: '📋',
            count: 0, // TODO: Calculate actual task count
            isSubItem: true,
            isActive: filterState.kary.activeFilter === `list:${list.id}`,
            onPress: () => {
              updateKaryFilter(`list:${list.id}`, list.id);
              onModuleChange(`list:${list.id}`);
            }
          });
        });
        
        // Add Tags section based on Firebase data
        tags.forEach(tag => {
          karyItems.push({
            id: `tag-${tag.id}`,
            title: `#${tag.name}`,
            icon: '🏷️',
            isSubItem: true,
            isActive: filterState.kary.activeFilter === `tag:${tag.name}`,
            onPress: () => {
              updateKaryFilter(`tag:${tag.name}`, '', tag.name);
              onModuleChange(`tag:${tag.name}`);
            }
          });
        });
        
        return karyItems;
      case 'Abhyasa':
        const abhyasaItems: DrawerItem[] = [
          // Goals section
          { 
            id: 'all-goals', 
            title: 'All Goals', 
            icon: '🎯', 
            count: goals.length, 
            onPress: () => {
              updateAbhyasaFilter('filter:goals');
              onModuleChange('filter:goals');
            }
          },
        ];
        
        // Milestones section  
        abhyasaItems.push({
          id: 'all-milestones', 
          title: 'All Milestones', 
          icon: '🏁', 
          count: 0, 
          onPress: () => {
            updateAbhyasaFilter('filter:milestones');
            onModuleChange('filter:milestones');
          }
        });
        
        // Habits section
        abhyasaItems.push(
          { 
            id: 'calendar-view', 
            title: 'Calendar View', 
            icon: '📅', 
            onPress: () => {
              updateAbhyasaFilter('filter:calendar');
              onModuleChange('filter:calendar');
            }
          },
          { 
            id: 'all-habits', 
            title: 'All Habits', 
            icon: '🔄', 
            count: habits.length, 
            onPress: () => {
              updateAbhyasaFilter('filter:habits');
              onModuleChange('filter:habits');
            }
          }
        );
        
        return abhyasaItems;
      case 'Dainandini':
        const dainandiniItems: DrawerItem[] = [
          { 
            id: 'today-journal', 
            title: "Today's Journal", 
            icon: '📅', 
            onPress: () => {
              updateDainandiniFilter('filter:today');
              onModuleChange('filter:today');
            }
          },
          { 
            id: 'calendar', 
            title: 'Calendar', 
            icon: '📊', 
            onPress: () => {
              updateDainandiniFilter('filter:calendar');
              onModuleChange('filter:calendar');
            }
          },
        ];
        
        // Add Focus Areas section based on Firebase data
        focusAreas.forEach(focus => {
          const getIconForFocus = (name: string) => {
            const lowerName = name.toLowerCase();
            if (lowerName.includes('kary')) return '✅';
            if (lowerName.includes('general')) return '📝';
            if (lowerName.includes('sleep')) return '😴';
            if (lowerName.includes('emotion')) return '😊';
            if (lowerName.includes('gratitude')) return '💛';
            return '📋';
          };
          
          dainandiniItems.push({
            id: `focus-${focus.id}`,
            title: focus.name,
            icon: getIconForFocus(focus.name),
            count: 0, // TODO: Calculate actual log count
            isSubItem: true,
            onPress: () => {
              updateDainandiniFilter(`focus:${focus.id}`, focus.id);
              onModuleChange(`focus:${focus.id}`);
            }
          });
        });
        
        return dainandiniItems;
      default:
        return [
          { id: 'overview', title: 'Overview', icon: '📊' },
          { id: 'today-summary', title: "Today's Summary", icon: '📅' },
          { id: 'weekly', title: 'Weekly Progress', icon: '📈' },
          { id: 'quick-actions', title: 'Quick Actions', icon: '⚡' },
        ];
    }
  };

  const moduleItems = getModuleItems();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🌟</Text>
              <Text style={styles.logoText}>Jeevan Saathi</Text>
            </View>
            <Text style={styles.logoSubtext}>Life Management Companion</Text>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Module Title */}
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>
              {currentModule === 'Kary' && 'Kary AI'}
              {currentModule === 'Abhyasa' && 'Abhyasa'}
              {currentModule === 'Dainandini' && 'Dainandini'}
              {currentModule === 'Home' && '🏠 Dashboard'}
            </Text>
            <Text style={styles.moduleSubtitle}>
              {currentModule === 'Kary' && 'Organize your work'}
              {currentModule === 'Abhyasa' && 'Master your habits & goals'}
              {currentModule === 'Dainandini' && 'Reflect on your day'}
              {currentModule === 'Home' && 'Life Management Companion'}
            </Text>
          </View>

          {/* Module Items */}
          <ScrollView style={styles.itemsContainer}>
            {currentModule === 'Kary' && (
              <>
                {/* Smart Filters */}
                {moduleItems.slice(0, 3).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.drawerItem,
                      item.isActive && styles.activeDrawerItem
                    ]}
                    onPress={item.onPress}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={[
                      styles.itemText,
                      item.isActive && styles.activeItemText
                    ]}>{item.title}</Text>
                    {item.count !== undefined && (
                      <Text style={styles.itemCount}>{item.count}</Text>
                    )}
                  </TouchableOpacity>
                ))}
                
                {/* Lists Section */}
                {lists.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>📋 LISTS</Text>
                      <TouchableOpacity>
                        <Text style={styles.addIcon}>+</Text>
                      </TouchableOpacity>
                    </View>
                    {moduleItems.slice(3, -1).map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.drawerItem, 
                          styles.subItem,
                          item.isActive && styles.activeDrawerItem
                        ]}
                        onPress={item.onPress}
                      >
                        <Text style={styles.itemIcon}>{item.icon}</Text>
                        <Text style={[
                          styles.subItemText,
                          item.isActive && styles.activeItemText
                        ]}>{item.title}</Text>
                        {item.count !== undefined && (
                          <Text style={styles.itemCount}>{item.count}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                
                {/* Tags Section */}
                {tags.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>🏷️ TAGS</Text>
                      <TouchableOpacity>
                        <Text style={styles.addIcon}>+</Text>
                      </TouchableOpacity>
                    </View>
                    {moduleItems.slice(3 + lists.length).map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.drawerItem, 
                          styles.subItem,
                          item.isActive && styles.activeDrawerItem
                        ]}
                        onPress={item.onPress}
                      >
                        <Text style={[
                          styles.itemIcon, 
                          styles.tagItem,
                          item.isActive && styles.activeItemText
                        ]}>{item.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </>
            )}
            
            {currentModule === 'Abhyasa' && (
              <>
                {/* Goals Section */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🎯 GOALS</Text>
                  <TouchableOpacity>
                    <Text style={styles.addIcon}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={moduleItems[0]?.onPress}
                >
                  <Text style={styles.itemIcon}>{moduleItems[0]?.icon}</Text>
                  <Text style={styles.itemText}>{moduleItems[0]?.title}</Text>
                </TouchableOpacity>
                
                {/* Milestones Section */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🏁 MILESTONES</Text>
                  <TouchableOpacity>
                    <Text style={styles.addIcon}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={moduleItems[1]?.onPress}
                >
                  <Text style={styles.itemIcon}>{moduleItems[1]?.icon}</Text>
                  <Text style={styles.itemText}>{moduleItems[1]?.title}</Text>
                </TouchableOpacity>
                
                {/* Habits Section */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🔄 HABITS</Text>
                  <TouchableOpacity>
                    <Text style={styles.addIcon}>+</Text>
                  </TouchableOpacity>
                </View>
                {moduleItems.slice(2).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.drawerItem}
                    onPress={item.onPress}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={styles.itemText}>{item.title}</Text>
                    {item.count !== undefined && (
                      <Text style={styles.itemCount}>{item.count}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
            
            {currentModule === 'Dainandini' && (
              <>
                {/* Journal Section */}
                {moduleItems.slice(0, 2).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.drawerItem}
                    onPress={item.onPress}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={styles.itemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
                
                {/* Focus Areas Section */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🎯 FOCUS AREAS</Text>
                  <TouchableOpacity>
                    <Text style={styles.addIcon}>+</Text>
                  </TouchableOpacity>
                </View>
                {moduleItems.slice(2).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.drawerItem, styles.subItem]}
                    onPress={item.onPress}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={styles.subItemText}>{item.title}</Text>
                    {item.count !== undefined && (
                      <Text style={styles.itemCount}>{item.count}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
            
            {currentModule === 'Home' && (
              <>
                {moduleItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.drawerItem}
                    onPress={item.onPress}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={styles.itemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.drawerItem}>
              <Text style={styles.itemIcon}>⚙️</Text>
              <Text style={styles.itemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem}>
              <Text style={styles.itemIcon}>📊</Text>
              <Text style={styles.itemText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: screenWidth * 0.8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  drawerHeader: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
    position: 'relative',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  logoSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  moduleHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  moduleSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addIcon: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tagItem: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  itemsContainer: {
    flex: 1,
    padding: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  subItem: {
    marginLeft: 16,
    backgroundColor: '#f8f9fa',
  },
  itemIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  subItemText: {
    fontSize: 15,
    color: '#666',
  },
  itemCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    textAlign: 'center',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    padding: 16,
  },
  activeDrawerItem: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  activeItemText: {
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default SimpleDrawer;
