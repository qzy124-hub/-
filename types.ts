
export interface UserPosition {
  lat: number;
  lng: number;
  id: string;
  name: string;
}

export interface EmotionalInsight {
  id: string;
  userId: string;
  userName: string;
  text: string;
  mood: string;
  tags: string[];
  isPublic: boolean;
  timestamp: number;
  position: { lat: number, lng: number };
}

export interface Connection {
  fromId: string;
  toId: string;
  strength: number; // 0-1
  reason: string;
}

export interface MockUser {
  id: string;
  name: string;
  position: { lat: number, lng: number };
  insights: EmotionalInsight[];
}
