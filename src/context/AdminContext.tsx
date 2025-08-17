import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AdminConfig, AdminState, NovelasConfig, DeliveryZoneConfig } from '../types/admin';

interface AdminContextType {
  state: AdminState;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updatePricing: (pricing: AdminConfig['pricing']) => void;
  addNovela: (novela: Omit<NovelasConfig, 'id'>) => void;
  updateNovela: (id: number, novela: Partial<NovelasConfig>) => void;
  deleteNovela: (id: number) => void;
  addDeliveryZone: (zone: Omit<DeliveryZoneConfig, 'id'>) => void;
  updateDeliveryZone: (id: number, zone: Partial<DeliveryZoneConfig>) => void;
  deleteDeliveryZone: (id: number) => void;
  exportConfig: () => string;
  importConfig: (configJson: string) => boolean;
  resetToDefaults: () => void;
  showNotification: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  exportSystemFiles: () => void;
}

type AdminAction = 
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PRICING'; payload: AdminConfig['pricing'] }
  | { type: 'ADD_NOVELA'; payload: NovelasConfig }
  | { type: 'UPDATE_NOVELA'; payload: { id: number; novela: Partial<NovelasConfig> } }
  | { type: 'DELETE_NOVELA'; payload: number }
  | { type: 'ADD_DELIVERY_ZONE'; payload: DeliveryZoneConfig }
  | { type: 'UPDATE_DELIVERY_ZONE'; payload: { id: number; zone: Partial<DeliveryZoneConfig> } }
  | { type: 'DELETE_DELIVERY_ZONE'; payload: number }
  | { type: 'LOAD_CONFIG'; payload: AdminConfig }
  | { type: 'RESET_CONFIG' }
  | { type: 'SHOW_NOTIFICATION'; payload: { message: string; type: 'success' | 'info' | 'warning' | 'error' } };

const defaultConfig: AdminConfig = {
  pricing: {
    moviePrice: 80,
    seriesPrice: 300,
    transferFeePercentage: 10
  },
  novelas: [
    { id: 1, titulo: "Corazón Salvaje", genero: "Drama/Romance", capitulos: 185, año: 2009, costoEfectivo: 925, costoTransferencia: 1018 },
    { id: 2, titulo: "La Usurpadora", genero: "Drama/Melodrama", capitulos: 98, año: 1998, costoEfectivo: 490, costoTransferencia: 539 },
    { id: 3, titulo: "María la del Barrio", genero: "Drama/Romance", capitulos: 73, año: 1995, costoEfectivo: 365, costoTransferencia: 402 },
    { id: 4, titulo: "Marimar", genero: "Drama/Romance", capitulos: 63, año: 1994, costoEfectivo: 315, costoTransferencia: 347 },
    { id: 5, titulo: "Rosalinda", genero: "Drama/Romance", capitulos: 80, año: 1999, costoEfectivo: 400, costoTransferencia: 440 },
    { id: 6, titulo: "La Madrastra", genero: "Drama/Suspenso", capitulos: 135, año: 2005, costoEfectivo: 675, costoTransferencia: 743 },
    { id: 7, titulo: "Rubí", genero: "Drama/Melodrama", capitulos: 115, año: 2004, costoEfectivo: 575, costoTransferencia: 633 },
    { id: 8, titulo: "Pasión de Gavilanes", genero: "Drama/Romance", capitulos: 188, año: 2003, costoEfectivo: 940, costoTransferencia: 1034 },
    { id: 9, titulo: "Yo Soy Betty, la Fea", genero: "Comedia/Romance", capitulos: 335, año: 1999, costoEfectivo: 1675, costoTransferencia: 1843 },
    { id: 10, titulo: "El Cuerpo del Deseo", genero: "Drama/Fantasía", capitulos: 178, año: 2005, costoEfectivo: 890, costoTransferencia: 979 }
  ],
  deliveryZones: [
    { id: 1, name: 'Por favor seleccionar su Barrio/Zona', fullPath: 'Por favor seleccionar su Barrio/Zona', cost: 0, active: true },
    { id: 2, name: 'Nuevo Vista Alegre', fullPath: 'Santiago de Cuba > Santiago de Cuba > Nuevo Vista Alegre', cost: 100, active: true },
    { id: 3, name: 'Vista Alegre', fullPath: 'Santiago de Cuba > Santiago de Cuba > Vista Alegre', cost: 300, active: true },
    { id: 4, name: 'Reparto Sueño', fullPath: 'Santiago de Cuba > Santiago de Cuba > Reparto Sueño', cost: 250, active: true },
    { id: 5, name: 'San Pedrito', fullPath: 'Santiago de Cuba > Santiago de Cuba > San Pedrito', cost: 150, active: true },
    { id: 6, name: 'Altamira', fullPath: 'Santiago de Cuba > Santiago de Cuba > Altamira', cost: 300, active: true },
    { id: 7, name: 'Micro 7, 8 , 9', fullPath: 'Santiago de Cuba > Santiago de Cuba > Micro 7, 8 , 9', cost: 150, active: true },
    { id: 8, name: 'Alameda', fullPath: 'Santiago de Cuba > Santiago de Cuba > Alameda', cost: 150, active: true },
    { id: 9, name: 'El Caney', fullPath: 'Santiago de Cuba > Santiago de Cuba > El Caney', cost: 800, active: true },
    { id: 10, name: 'Quintero', fullPath: 'Santiago de Cuba > Santiago de Cuba > Quintero', cost: 200, active: true },
    { id: 11, name: 'Marimon', fullPath: 'Santiago de Cuba > Santiago de Cuba > Marimon', cost: 100, active: true },
    { id: 12, name: 'Los cangrejitos', fullPath: 'Santiago de Cuba > Santiago de Cuba > Los cangrejitos', cost: 150, active: true },
    { id: 13, name: 'Trocha', fullPath: 'Santiago de Cuba > Santiago de Cuba > Trocha', cost: 200, active: true },
    { id: 14, name: 'Versalles', fullPath: 'Santiago de Cuba > Santiago de Cuba > Versalles', cost: 800, active: true },
    { id: 15, name: 'Reparto Portuondo', fullPath: 'Santiago de Cuba > Santiago de Cuba > Reparto Portuondo', cost: 600, active: true },
    { id: 16, name: '30 de Noviembre', fullPath: 'Santiago de Cuba > Santiago de Cuba > 30 de Noviembre', cost: 600, active: true },
    { id: 17, name: 'Rajayoga', fullPath: 'Santiago de Cuba > Santiago de Cuba > Rajayoga', cost: 800, active: true },
    { id: 18, name: 'Antonio Maceo', fullPath: 'Santiago de Cuba > Santiago de Cuba > Antonio Maceo', cost: 600, active: true },
    { id: 19, name: 'Los Pinos', fullPath: 'Santiago de Cuba > Santiago de Cuba > Los Pinos', cost: 200, active: true },
    { id: 20, name: 'Distrito José Martí', fullPath: 'Santiago de Cuba > Santiago de Cuba > Distrito José Martí', cost: 100, active: true },
    { id: 21, name: 'Cobre', fullPath: 'Santiago de Cuba > Santiago de Cuba > Cobre', cost: 800, active: true },
    { id: 22, name: 'El Parque Céspedes', fullPath: 'Santiago de Cuba > Santiago de Cuba > El Parque Céspedes', cost: 200, active: true },
    { id: 23, name: 'Carretera del Morro', fullPath: 'Santiago de Cuba > Santiago de Cuba > Carretera del Morro', cost: 300, active: true }
  ]
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false };
    case 'UPDATE_PRICING':
      const newConfig = { ...state.config, pricing: action.payload };
      localStorage.setItem('adminConfig', JSON.stringify(newConfig));
      return { ...state, config: newConfig };
    case 'ADD_NOVELA':
      const configWithNewNovela = {
        ...state.config,
        novelas: [...state.config.novelas, action.payload]
      };
      localStorage.setItem('adminConfig', JSON.stringify(configWithNewNovela));
      return { ...state, config: configWithNewNovela };
    case 'UPDATE_NOVELA':
      const updatedNovelas = state.config.novelas.map(novela =>
        novela.id === action.payload.id
          ? { ...novela, ...action.payload.novela }
          : novela
      );
      const configWithUpdatedNovela = { ...state.config, novelas: updatedNovelas };
      localStorage.setItem('adminConfig', JSON.stringify(configWithUpdatedNovela));
      return { ...state, config: configWithUpdatedNovela };
    case 'DELETE_NOVELA':
      const filteredNovelas = state.config.novelas.filter(novela => novela.id !== action.payload);
      const configWithDeletedNovela = { ...state.config, novelas: filteredNovelas };
      localStorage.setItem('adminConfig', JSON.stringify(configWithDeletedNovela));
      return { ...state, config: configWithDeletedNovela };
    case 'ADD_DELIVERY_ZONE':
      const configWithNewZone = {
        ...state.config,
        deliveryZones: [...state.config.deliveryZones, action.payload]
      };
      localStorage.setItem('adminConfig', JSON.stringify(configWithNewZone));
      return { ...state, config: configWithNewZone };
    case 'UPDATE_DELIVERY_ZONE':
      const updatedZones = state.config.deliveryZones.map(zone =>
        zone.id === action.payload.id
          ? { ...zone, ...action.payload.zone }
          : zone
      );
      const configWithUpdatedZone = { ...state.config, deliveryZones: updatedZones };
      localStorage.setItem('adminConfig', JSON.stringify(configWithUpdatedZone));
      return { ...state, config: configWithUpdatedZone };
    case 'DELETE_DELIVERY_ZONE':
      const filteredZones = state.config.deliveryZones.filter(zone => zone.id !== action.payload);
      const configWithDeletedZone = { ...state.config, deliveryZones: filteredZones };
      localStorage.setItem('adminConfig', JSON.stringify(configWithDeletedZone));
      return { ...state, config: configWithDeletedZone };
    case 'LOAD_CONFIG':
      return { ...state, config: action.payload };
    case 'RESET_CONFIG':
      localStorage.setItem('adminConfig', JSON.stringify(defaultConfig));
      return { ...state, config: defaultConfig };
    case 'SHOW_NOTIFICATION':
      // Esta acción se maneja en el componente, no modifica el estado
      return state;
    default:
      return state;
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, {
    isAuthenticated: false,
    config: defaultConfig
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('adminConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        // Ensure deliveryZones exists for backward compatibility
        if (!config.deliveryZones) {
          config.deliveryZones = defaultConfig.deliveryZones;
        }
        dispatch({ type: 'LOAD_CONFIG', payload: config });
      } catch (error) {
        console.error('Error loading admin config:', error);
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === 'administrador' && password === 'root') {
      dispatch({ type: 'LOGIN' });
      return true;
    }
    return false;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updatePricing = (pricing: AdminConfig['pricing']) => {
    dispatch({ type: 'UPDATE_PRICING', payload: pricing });
  };

  const addNovela = (novela: Omit<NovelasConfig, 'id'>) => {
    const newId = Math.max(...state.config.novelas.map(n => n.id), 0) + 1;
    const novelaWithId = { ...novela, id: newId };
    dispatch({ type: 'ADD_NOVELA', payload: novelaWithId });
  };

  const updateNovela = (id: number, novela: Partial<NovelasConfig>) => {
    dispatch({ type: 'UPDATE_NOVELA', payload: { id, novela } });
  };

  const deleteNovela = (id: number) => {
    dispatch({ type: 'DELETE_NOVELA', payload: id });
  };

  const addDeliveryZone = (zone: Omit<DeliveryZoneConfig, 'id'>) => {
    const newId = Math.max(...state.config.deliveryZones.map(z => z.id), 0) + 1;
    const zoneWithId = { ...zone, id: newId };
    dispatch({ type: 'ADD_DELIVERY_ZONE', payload: zoneWithId });
  };

  const updateDeliveryZone = (id: number, zone: Partial<DeliveryZoneConfig>) => {
    dispatch({ type: 'UPDATE_DELIVERY_ZONE', payload: { id, zone } });
  };

  const deleteDeliveryZone = (id: number) => {
    dispatch({ type: 'DELETE_DELIVERY_ZONE', payload: id });
  };
  const exportConfig = (): string => {
    const exportData = {
      config: state.config,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importConfig = (configJson: string): boolean => {
    try {
      const importData = JSON.parse(configJson);
      if (importData.config && importData.config.pricing && importData.config.novelas && importData.config.deliveryZones) {
        dispatch({ type: 'LOAD_CONFIG', payload: importData.config });
        localStorage.setItem('adminConfig', JSON.stringify(importData.config));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  };

  const resetToDefaults = () => {
    dispatch({ type: 'RESET_CONFIG' });
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    dispatch({ type: 'SHOW_NOTIFICATION', payload: { message, type } });
  };

  const exportSystemFiles = () => {
    const currentConfig = state.config;
    
    // Generar contenido de admin.ts
    const adminTsContent = `export interface AdminConfig {
  pricing: {
    moviePrice: number;
    seriesPrice: number;
    transferFeePercentage: number;
  };
  novelas: NovelasConfig[];
  deliveryZones: DeliveryZoneConfig[];
}

export interface NovelasConfig {
  id: number;
  titulo: string;
  genero: string;
  capitulos: number;
  año: number;
  costoEfectivo: number;
  costoTransferencia: number;
  descripcion?: string;
}

export interface DeliveryZoneConfig {
  id: number;
  name: string;
  fullPath: string;
  cost: number;
  active: boolean;
}

export interface AdminState {
  isAuthenticated: boolean;
  config: AdminConfig;
}

// Configuración actual del sistema aplicada
export const CURRENT_SYSTEM_CONFIG: AdminConfig = ${JSON.stringify(currentConfig, null, 2)};`;

    // Generar contenido de AdminContext.tsx con configuración actual
    const adminContextContent = `import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AdminConfig, AdminState, NovelasConfig, DeliveryZoneConfig } from '../types/admin';

// ... [resto del código AdminContext con configuración actual aplicada]
// Configuración por defecto actualizada con valores actuales del sistema
const defaultConfig: AdminConfig = ${JSON.stringify(currentConfig, null, 2)};

// ... [resto de la implementación del contexto]`;

    // Crear archivos y descargarlos
    const files = [
      { name: 'admin.ts', content: adminTsContent },
      { name: 'AdminContext.tsx', content: adminContextContent },
      // Agregar más archivos según sea necesario
    ];

    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

    showNotification('Archivos del sistema exportados correctamente', 'success');
  };

  return (
    <AdminContext.Provider value={{
      state,
      login,
      logout,
      updatePricing,
      addNovela,
      updateNovela,
      deleteNovela,
      addDeliveryZone,
      updateDeliveryZone,
      deleteDeliveryZone,
      exportConfig,
      importConfig,
      resetToDefaults,
      showNotification,
      exportSystemFiles
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}