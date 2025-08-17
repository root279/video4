export interface AdminConfig {
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
  notifications?: Array<{
    id: number;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    timestamp: Date;
  }>;
}

// Interfaz para el sistema de notificaciones
export interface AdminNotification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
}

// Interfaz para la exportación de archivos del sistema
export interface SystemFileExport {
  fileName: string;
  content: string;
  type: 'typescript' | 'tsx';
  description: string;
}