
import React, { useState, useEffect } from 'react';
import EarthVisualization from './components/EarthVisualization';
import ThoughtInput from './components/ThoughtInput';
import UserProfile from './components/UserProfile';
import { MockUser, EmotionalInsight, Connection } from './types';
import { analyzeEmotionalState, findConnections } from './services/geminiService';

// Better landmass approximation for mock data
const LAND_CENTERS = [
  { lat: 40, lng: -100 }, // North America
  { lat: -15, lng: -60 }, // South America
  { lat: 50, lng: 10 },   // Europe
  { lat: 10, lng: 20 },   // Africa
  { lat: 35, lng: 100 },  // Asia
  { lat: -25, lng: 135 }, // Australia
  { lat: 35, lng: 140 },  // Japan
];

const generateMockUsers = (count: number): MockUser[] => {
  const names = ['Kael', 'Lyra', 'Zion', 'Vex', 'Nova', 'Echo', 'Atlas', 'Sol', 'Juna', 'Miro'];
  return Array.from({ length: count }).map((_, i) => {
    const center = LAND_CENTERS[i % LAND_CENTERS.length];
    return {
      id: `soul-${i}`,
      name: `${names[i % names.length]}_${Math.floor(Math.random() * 999)}`,
      position: {
        lat: center.lat + (Math.random() - 0.5) * 40,
        lng: center.lng + (Math.random() - 0.5) * 40
      },
      insights: Math.random() > 0.85 ? [{
        id: `ins-${i}`,
        userId: `soul-${i}`,
        userName: names[i % names.length],
        text: "The universe is a vast network of unspoken dreams.",
        mood: ['joy', 'peace', 'inspired', 'lonely', 'sadness'][Math.floor(Math.random() * 5)],
        tags: ['resonance', 'cosmos'],
        isPublic: true,
        timestamp: Date.now() - Math.random() * 1000000,
        position: { lat: 0, lng: 0 }
      }] : []
    };
  });
};

const INITIAL_MOCK_USERS = generateMockUsers(400);

const App: React.FC = () => {
  const [users, setUsers] = useState<MockUser[]>(INITIAL_MOCK_USERS);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{ id: string, msg: string }[]>([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCurrentPosition({ lat: 31.23, lng: 121.47 })
    );
  }, []);

  const handleUpload = async (text: string, isPublic: boolean) => {
    setIsUploading(true);
    try {
      const analysis = await analyzeEmotionalState(text);
      const newInsight: EmotionalInsight = {
        id: Math.random().toString(36).substring(7),
        userId: 'me',
        userName: 'Me',
        text,
        mood: analysis.mood,
        tags: analysis.tags,
        isPublic,
        timestamp: Date.now(),
        position: currentPosition || { lat: 0, lng: 0 }
      };

      setUsers(prev => {
          const exists = prev.find(u => u.id === 'me');
          if (!exists) return [...prev, { id: 'me', name: 'My Core', position: newInsight.position, insights: [newInsight] }];
          return prev.map(u => u.id === 'me' ? { ...u, insights: [newInsight, ...u.insights] } : u);
      });

      const usersWithInsights = users.filter(u => u.insights.length > 0 && u.id !== 'me');
      if (usersWithInsights.length > 0) {
        const simulatedOthers = usersWithInsights.map(u => u.insights[0]);
        const newConns = await findConnections(newInsight, simulatedOthers);
        
        if (newConns.length > 0) {
            const mapped = newConns.map(nc => ({ fromId: 'me', toId: nc.toId, strength: nc.strength, reason: nc.reason }));
            setConnections(prev => [...prev, ...mapped]);
            
            // Notification for Stable Connection
            const topConn = newConns.sort((a, b) => b.strength - a.strength)[0];
            const foundUser = users.find(u => u.id === topConn.toId);
            if (foundUser) {
                const notifId = Math.random().toString();
                setNotifications(prev => [...prev, { id: notifId, msg: `Stable Connection Established with ${foundUser.name}` }]);
                setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== notifId)), 5000);
            }
        }
      }
    } catch (e) { console.error(e); } finally { setIsUploading(false); }
  };

  return (
    <div className="relative w-full h-screen bg-[#010409] overflow-hidden text-white font-mono">
      <EarthVisualization users={users} connections={connections} onUserClick={setSelectedUser} currentUserId="me" />

      {/* UI Overlay */}
      <div className="relative z-10 p-8 pointer-events-none h-full flex flex-col justify-between">
        <header className="flex justify-between items-start">
          <div className="pointer-events-auto">
            <h1 className="text-2xl font-black tracking-[0.4em] uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              COSMIC ORACLE
            </h1>
            <div className="flex items-center space-x-2 mt-2">
                <div className="w-12 h-[1px] bg-blue-500/50" />
                <p className="text-[10px] text-blue-400/70 tracking-[0.2em] font-bold">EMOTIONAL GRID v2.5</p>
            </div>
          </div>
          
          <div className="pointer-events-auto flex flex-col items-end space-y-3">
             {notifications.map(n => (
                 <div key={n.id} className="flex items-center space-x-3 bg-red-600/10 border border-red-500/30 px-5 py-3 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-200">{n.msg}</span>
                 </div>
             ))}
          </div>
        </header>

        <div className="flex flex-col items-center space-y-10">
          <div className="pointer-events-auto w-full flex justify-center pb-12">
            <ThoughtInput onUpload={handleUpload} isLoading={isUploading} />
          </div>
        </div>
      </div>

      {selectedUser && (
        <UserProfile 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onAddFriend={(id) => setFriends(prev => [...prev, id])}
          isFriend={friends.includes(selectedUser.id)}
        />
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center space-y-8">
          <div className="w-32 h-[2px] bg-blue-900 overflow-hidden relative">
            <div className="absolute inset-0 bg-blue-400 animate-loading-bar" />
          </div>
          <p className="text-[10px] font-black tracking-[0.5em] text-blue-400 animate-pulse uppercase">Searching for resonance in the dark...</p>
        </div>
      )}

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar { animation: loading-bar 1.5s infinite; }
      `}</style>
    </div>
  );
};

export default App;
