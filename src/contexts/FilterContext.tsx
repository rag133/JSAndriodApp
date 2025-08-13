import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FilterState {
  kary: {
    activeFilter: string;
    selectedListId: string;
    selectedTagId: string;
  };
  abhyasa: {
    activeFilter: string;
    selectedCategory: string;
  };
  dainandini: {
    activeFilter: string;
    selectedFocusId: string;
  };
}

interface FilterContextType {
  filterState: FilterState;
  updateKaryFilter: (filter: string, listId?: string, tagId?: string) => void;
  updateAbhyasaFilter: (filter: string, category?: string) => void;
  updateDainandiniFilter: (filter: string, focusId?: string) => void;
  getFilterTitle: (module: string, lists?: any[], focusAreas?: any[]) => string;
}

const defaultFilterState: FilterState = {
  kary: {
    activeFilter: 'all',
    selectedListId: '',
    selectedTagId: '',
  },
  abhyasa: {
    activeFilter: 'all',
    selectedCategory: '',
  },
  dainandini: {
    activeFilter: 'all',
    selectedFocusId: '',
  },
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filterState, setFilterState] = useState<FilterState>(defaultFilterState);

  const updateKaryFilter = (filter: string, listId?: string, tagId?: string) => {
    setFilterState(prev => ({
      ...prev,
      kary: {
        activeFilter: filter,
        selectedListId: listId || '',
        selectedTagId: tagId || '',
      }
    }));
  };

  const updateAbhyasaFilter = (filter: string, category?: string) => {
    setFilterState(prev => ({
      ...prev,
      abhyasa: {
        activeFilter: filter,
        selectedCategory: category || '',
      }
    }));
  };

  const updateDainandiniFilter = (filter: string, focusId?: string) => {
    setFilterState(prev => ({
      ...prev,
      dainandini: {
        activeFilter: filter,
        selectedFocusId: focusId || '',
      }
    }));
  };

  const getFilterTitle = (module: string, lists?: any[], focusAreas?: any[]): string => {
    switch (module.toLowerCase()) {
      case 'kary':
        const karyFilter = filterState.kary.activeFilter;
        if (karyFilter === 'filter:today') return '📅 Today';
        if (karyFilter === 'filter:due') return '⏰ Due';
        if (karyFilter === 'filter:upcoming') return '⏳ Upcoming';
        if (karyFilter.startsWith('list:')) {
          const listId = karyFilter.replace('list:', '');
          const list = lists?.find(l => l.id === listId);
          return list ? `📋 ${list.name}` : '📋 List Tasks';
        }
        if (karyFilter.startsWith('tag:')) {
          const tagName = karyFilter.replace('tag:', '');
          return `🏷️ #${tagName}`;
        }
        return '📋 All Tasks';
        
      case 'abhyasa':
        const abhyasaFilter = filterState.abhyasa.activeFilter;
        if (abhyasaFilter === 'filter:goals') return '🎯 Goals';
        if (abhyasaFilter === 'filter:milestones') return '🏁 Milestones';
        if (abhyasaFilter === 'filter:habits') return '🔄 Habits';
        if (abhyasaFilter === 'filter:calendar') return '📅 Calendar View';
        return '🎯 All Items';
        
      case 'dainandini':
        const dainandiniFilter = filterState.dainandini.activeFilter;
        if (dainandiniFilter === 'filter:today') return "📅 Today's Journal";
        if (dainandiniFilter === 'filter:calendar') return '📊 Calendar';
        if (dainandiniFilter.startsWith('focus:')) {
          const focusId = dainandiniFilter.replace('focus:', '');
          const focus = focusAreas?.find(f => f.id === focusId);
          return focus ? `🎯 ${focus.name}` : '🎯 Focus Area';
        }
        return '📝 All Logs';
        
      default:
        return 'All Items';
    }
  };

  return (
    <FilterContext.Provider value={{
      filterState,
      updateKaryFilter,
      updateAbhyasaFilter,
      updateDainandiniFilter,
      getFilterTitle,
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

export default FilterContext;
