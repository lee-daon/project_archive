import { defineStore } from 'pinia';

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    isOpen: true, // 사이드바 열림/닫힘 상태
    categoryOpen: {
      collection: true,
      processing: true,
      registration: true,
      market: true
    }
  }),
  
  actions: {
    // 사이드바 열기/닫기
    toggleSidebar() {
      this.isOpen = !this.isOpen;
    },
    
    // 사이드바 열기
    openSidebar() {
      this.isOpen = true;
    },
    
    // 사이드바 닫기
    closeSidebar() {
      this.isOpen = false;
    },
    
    toggleCategory(category) {
      this.categoryOpen[category] = !this.categoryOpen[category];
    },
    
    setCategoryState(category, isOpen) {
      this.categoryOpen[category] = isOpen;
    },
    
    // 모든 카테고리 열기
    openAllCategories() {
      Object.keys(this.categoryOpen).forEach(category => {
        this.categoryOpen[category] = true;
      });
    },
    
    // 모든 카테고리 닫기
    closeAllCategories() {
      Object.keys(this.categoryOpen).forEach(category => {
        this.categoryOpen[category] = false;
      });
    }
  },
  
  persist: true
}); 