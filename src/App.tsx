import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LabelList
} from "recharts";
import { 
  Plus, 
  Trash2, 
  Zap, 
  Moon, 
  Sun, 
  ChevronRight,
  LayoutDashboard,
  Calculator,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Search,
  User,
  Save,
  Users,
  Settings2,
  VenetianMask
} from "lucide-react";
import { 
  Element, 
  Modality, 
  PlanetaryPosition, 
  SIGN_DATA, 
  PLANET_SCORES,
  BirthData,
  SavedPerson
} from "./types";
import { calculateMatrix } from "./services/matrixService";
import { getPlanetaryPositionsFromBirthData, getLocationSuggestions } from "./services/astrologyService";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ELEMENT_COLORS: Record<Element, string> = {
  [Element.Fuego]: "#ef4444", // Red 500
  [Element.Tierra]: "#84cc16", // Lime 500
  [Element.Aire]: "#06b6d4", // Cyan 500
  [Element.Agua]: "#3b82f6", // Blue 500
};

const MODALITY_COLORS: Record<Modality, string> = {
  [Modality.Cardinal]: "#8b5cf6", // Violet 500
  [Modality.Fijo]: "#f59e0b", // Amber 500
  [Modality.Mutable]: "#ec4899", // Pink 500
};

const INITIAL_POSITIONS: PlanetaryPosition[] = [
  { planeta: "Sol", signo: "Aries" },
  { planeta: "Luna", signo: "Cáncer" },
  { planeta: "Ascendente", signo: "Libra" },
];

export default function App() {
  const [positions, setPositions] = useState<PlanetaryPosition[]>(INITIAL_POSITIONS);
  const [calculatedPositions, setCalculatedPositions] = useState<PlanetaryPosition[]>(INITIAL_POSITIONS);
  const [activeTab, setActiveTab] = useState<"input" | "results">("input");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [birthData, setBirthData] = useState<BirthData>({
    name: "",
    date: "",
    time: "",
    location: ""
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedPeople, setSavedPeople] = useState<SavedPerson[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [ignoreNextSuggestion, setIgnoreNextSuggestion] = useState(false);
  const [showManualAdjustment, setShowManualAdjustment] = useState(false);

  // Generate stable random positions for stars covering a larger area for rotation
  const stars = useMemo(() => {
    return [...Array(500)].map((_, i) => ({
      id: i,
      // Spread stars over a larger area to avoid empty spaces during rotation
      x: Math.random() * 200 - 50, 
      y: Math.random() * 200 - 50,
      opacity: 0.3 + Math.random() * 0.7,
      size: Math.random() * 2.5 + 0.5,
      twinkleDuration: 2 + Math.random() * 4,
      twinkleDelay: Math.random() * 5,
    }));
  }, []);

  useEffect(() => {
    fetchSavedPeople();
  }, []);

  const fetchSavedPeople = () => {
    try {
      const stored = localStorage.getItem("saved_people");
      if (stored) {
        const data = JSON.parse(stored);
        setSavedPeople(data);
      }
    } catch (error) {
      console.error("Failed to fetch saved people:", error);
    }
  };

  const handleSavePerson = () => {
    if (!birthData.name || !birthData.date || !birthData.location) {
      alert("Por favor completa el nombre, fecha y lugar para guardar.");
      return;
    }

    setIsSaving(true);
    try {
      const stored = localStorage.getItem("saved_people");
      const people = stored ? JSON.parse(stored) : [];
      
      const newPerson: SavedPerson = {
        id: Date.now(),
        name: birthData.name,
        date: birthData.date,
        time: birthData.time,
        location: birthData.location,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        utcOffset: birthData.utcOffset,
        created_at: new Date().toISOString(),
      };
      
      people.push(newPerson);
      localStorage.setItem("saved_people", JSON.stringify(people));
      setSavedPeople(people);
      alert("Persona guardada con éxito.");
    } catch (error) {
      alert("Error al guardar la persona.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadPerson = (person: SavedPerson) => {
    setBirthData({
      name: person.name,
      date: person.date,
      time: person.time,
      location: person.location,
      latitude: person.latitude,
      longitude: person.longitude,
      utcOffset: person.utcOffset
    });
    setShowSavedList(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setIgnoreNextSuggestion(true);
  };

  const results = useMemo(() => calculateMatrix(calculatedPositions), [calculatedPositions]);
  const liveResults = useMemo(() => calculateMatrix(positions), [positions]);

  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(positions) !== JSON.stringify(calculatedPositions);
  }, [positions, calculatedPositions]);

  const handleRecalculate = () => {
    setCalculatedPositions([...positions]);
  };

  useEffect(() => {
    if (ignoreNextSuggestion) {
      setIgnoreNextSuggestion(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (birthData.location.length >= 3) {
        try {
          const list = await getLocationSuggestions(birthData.location);
          setSuggestions(list);
          setShowSuggestions(list.length > 0);
        } catch (e) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [birthData.location]);

  const addPosition = () => {
    setPositions([...positions, { planeta: "Mercurio", signo: "Aries" }]);
  };

  const updatePosition = (index: number, field: keyof PlanetaryPosition, value: string) => {
    const newPositions = [...positions];
    newPositions[index] = { ...newPositions[index], [field]: value };
    setPositions(newPositions);
  };

  const removePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  const handleAutoCalculate = async () => {
    if (!birthData.date || !birthData.location) {
      alert("Por favor ingresa al menos la fecha y el lugar de nacimiento.");
      return;
    }

    setIsCalculating(true);
    try {
      const result = await getPlanetaryPositionsFromBirthData(birthData);
      setPositions(result.positions);
      setCalculatedPositions(result.positions);
      setBirthData(prev => ({
        ...prev,
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
        utcOffset: result.utcOffset
      }));
      setActiveTab("results");
    } catch (error) {
      alert("Hubo un error al calcular la carta. Por favor intenta de nuevo.");
    } finally {
      setIsCalculating(false);
    }
  };

  const totalElementPoints = useMemo(() => 
    Object.values(results.totalesElemento).reduce((acc: number, curr: number) => acc + curr, 0),
    [results.totalesElemento]
  );

  const elementChartData = useMemo(() => 
    Object.entries(results.totalesElemento).map(([name, value]) => ({
      name,
      value,
      percentage: totalElementPoints > 0 ? ((value as number) / totalElementPoints) * 100 : 0
    })),
    [results.totalesElemento, totalElementPoints]
  );

  const totalModalityPoints = useMemo(() => 
    Object.values(results.totalesModalidad).reduce((acc: number, curr: number) => acc + curr, 0),
    [results.totalesModalidad]
  );

  const elementPercentages = useMemo(() => 
    Object.entries(results.totalesElemento).map(([name, value]) => ({
      name: name as Element,
      value: value as number,
      count: results.conteoPlanetasElemento[name as Element] || 0,
      percentage: totalElementPoints > 0 ? ((value as number) / totalElementPoints) * 100 : 0
    })).sort((a, b) => b.value - a.value || b.count - a.count),
    [results.totalesElemento, results.conteoPlanetasElemento, totalElementPoints]
  );

  const modalityChartData = useMemo(() => 
    Object.entries(results.totalesModalidad).map(([name, value]) => ({
      name,
      value,
      percentage: totalModalityPoints > 0 ? ((value as number) / totalModalityPoints) * 100 : 0
    })),
    [results.totalesModalidad, totalModalityPoints]
  );

  return (
    <div className="min-h-screen bg-[#0B1026] text-white font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      {/* Global Dynamic Star Field */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {(() => {
          const totalInputLength = birthData.name.length + birthData.location.length + birthData.date.length + birthData.time.length;
          return (
            <motion.div 
              className="absolute inset-0 w-full h-full"
              animate={{
                rotate: totalInputLength * 12,
              }}
              transition={{
                type: "spring",
                stiffness: 40,
                damping: 25,
              }}
            >
              {stars.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute bg-white rounded-full"
                  animate={{
                    opacity: [star.opacity * 0.5, star.opacity, star.opacity * 0.5],
                  }}
                  transition={{
                    duration: star.twinkleDuration,
                    repeat: Infinity,
                    delay: star.twinkleDelay,
                    ease: "easeInOut",
                  }}
                  style={{
                    top: `${star.y}%`,
                    left: `${star.x}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    boxShadow: star.opacity > 0.5 ? `0 0 ${star.size * 3}px rgba(255,255,255,0.4)` : 'none',
                  }}
                />
              ))}
              
              {/* Constellation Lines - More prominent in results */}
              <motion.svg 
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: activeTab === 'results' ? 0.6 : 0.3 }}
              >
                <line x1="10%" y1="10%" x2="40%" y2="30%" stroke="white" strokeWidth="1" />
                <line x1="40%" y1="30%" x2="30%" y2="60%" stroke="white" strokeWidth="1" />
                <line x1="70%" y1="20%" x2="90%" y2="40%" stroke="white" strokeWidth="1" />
                <line x1="90%" y1="40%" x2="80%" y2="80%" stroke="white" strokeWidth="1" />
                
                {activeTab === 'results' && (
                  <>
                    <motion.line 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      x1="15%" y1="85%" x2="25%" y2="75%" stroke="white" strokeWidth="1" 
                    />
                    <motion.line 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      x1="25%" y1="75%" x2="45%" y2="80%" stroke="white" strokeWidth="1" 
                    />
                    <motion.line 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      x1="60%" y1="15%" x2="55%" y2="35%" stroke="white" strokeWidth="1" 
                    />
                    <motion.line 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      x1="55%" y1="35%" x2="65%" y2="45%" stroke="white" strokeWidth="1" 
                    />
                  </>
                )}
              </motion.svg>
            </motion.div>
          );
        })()}
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-[#0B1026]/40 backdrop-blur-[2px] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Matriz Elemental</h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-stone-100 p-1 rounded-full">
            <button
              onClick={() => setActiveTab("input")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                activeTab === "input" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"
              )}
            >
              <Calculator className="w-4 h-4" />
              Configuración
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                activeTab === "results" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Resultados
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "input" ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 1.2,
                filter: "blur(10px)",
                transition: { duration: 0.8, ease: "easeIn" }
              }}
              className="space-y-8 relative z-10"
            >
              {/* Birth Data Section */}
              <section className="relative bg-white/[0.02] backdrop-blur-[1px] p-8 rounded-3xl border border-white/10 shadow-2xl">
                <div className="relative z-40 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Datos Consultante</h2>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowSavedList(!showSavedList)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors border border-white/10 backdrop-blur-sm"
                    >
                      <Users className="w-4 h-4" />
                      Personas Guardadas
                    </button>
                    <AnimatePresence>
                      {showSavedList && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-2 w-80 bg-[#0B1026]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                        >
                          <div className="p-3 border-b border-white/10 bg-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Seleccionar Guardado</span>
                          </div>
                          <div className="max-h-72 overflow-y-auto">
                            {savedPeople.length === 0 ? (
                              <div className="p-8 text-center text-stone-500 text-xs italic">No hay personas guardadas.</div>
                            ) : (
                              savedPeople.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => loadPerson(p)}
                                  className="w-full text-left px-5 py-4 hover:bg-emerald-500/20 transition-colors border-b border-white/5 last:border-0 group"
                                >
                                  <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">{p.name}</div>
                                  <div className="text-[10px] text-stone-400 group-hover:text-stone-200 mt-1">{p.location} • {p.date}</div>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="relative z-30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                      <User className="w-3 h-3" /> Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre de la persona"
                      value={birthData.name}
                      onChange={(e) => setBirthData({ ...birthData, name: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                      <Calendar className="w-3 h-3" /> Fecha
                    </label>
                    <input
                      type="date"
                      value={birthData.date}
                      onChange={(e) => setBirthData({ ...birthData, date: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                      <Clock className="w-3 h-3" /> Hora
                    </label>
                    <input
                      type="time"
                      value={birthData.time}
                      onChange={(e) => setBirthData({ ...birthData, time: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                      <MapPin className="w-3 h-3" /> Lugar
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ciudad, País"
                        value={birthData.location}
                        onChange={(e) => setBirthData({ ...birthData, location: e.target.value })}
                        onFocus={() => setShowSuggestions(suggestions.length > 0)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[100] w-full mt-1 bg-[#0B1026]/70 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                          >
                            <div className="max-h-60 overflow-y-auto">
                              {suggestions.map((s, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    setBirthData({ ...birthData, location: s });
                                    setShowSuggestions(false);
                                    setSuggestions([]);
                                    setIgnoreNextSuggestion(true);
                                  }}
                                  className="w-full text-left px-5 py-3 text-sm text-white hover:bg-emerald-500/20 transition-colors flex items-center gap-2 group border-b border-white/5 last:border-0"
                                >
                                  <Search className="w-3 h-3 text-stone-500 group-hover:text-emerald-300" />
                                  <span className="group-hover:text-emerald-300 transition-colors">{s}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {birthData.latitude !== undefined && birthData.longitude !== undefined && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="relative z-10 mt-6 p-3 bg-white/5 rounded-xl border border-white/5 flex flex-wrap gap-4 text-[10px] font-mono text-white/40"
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white/60 uppercase">Lat:</span>
                      {birthData.latitude.toFixed(4)}°
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white/60 uppercase">Long:</span>
                      {birthData.longitude.toFixed(4)}°
                    </div>
                    {birthData.utcOffset !== undefined && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <span className="font-bold uppercase">Zona Horaria:</span>
                        UTC {birthData.utcOffset >= 0 ? '+' : ''}{birthData.utcOffset}
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="relative z-10 mt-8 flex gap-4">
                  <button
                    onClick={handleAutoCalculate}
                    disabled={isCalculating}
                    className="flex-1 bg-emerald-600/80 backdrop-blur-sm text-white py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Calculando Posiciones...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generar Carta Natal
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSavePerson}
                    disabled={isSaving || !birthData.name}
                    className="px-6 bg-white/10 text-white py-3 rounded-2xl font-bold hover:bg-white/20 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar
                  </button>

                  <button
                    onClick={() => setShowManualAdjustment(!showManualAdjustment)}
                    className={cn(
                      "px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg border border-white/10",
                      showManualAdjustment 
                        ? "bg-white/20 text-white" 
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    )}
                  >
                    <Settings2 className="w-4 h-4" />
                    {showManualAdjustment ? "Ocultar Manual" : "Ingreso Manual"}
                  </button>
                </div>
              </section>

              {/* Manual Input Section */}
              <AnimatePresence>
                {showManualAdjustment && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 overflow-hidden relative z-10 bg-white/[0.02] backdrop-blur-[1px] p-6 rounded-3xl border border-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Ajuste Manual</h2>
                        <p className="text-stone-400 text-sm">Modifica o agrega posiciones manualmente.</p>
                      </div>
                      <button
                        onClick={addPosition}
                        className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Planeta
                      </button>
                    </div>

                    {/* Live Summary Preview */}
                    <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-xl flex flex-wrap gap-8 items-center relative overflow-hidden">
                      {hasPendingChanges && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />
                      )}
                      
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">Vista Previa (Borrador)</h3>
                        <div className="flex gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-stone-500 uppercase font-bold">Luz</span>
                            <div className="flex gap-1">
                              {liveResults.luz.map(el => (
                                <div key={el} className="w-2 h-2 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[el] }} />
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-stone-500 uppercase font-bold">Sombra</span>
                            <div className="flex gap-1">
                              {liveResults.sombra.map(el => (
                                <div key={el} className="w-2 h-2 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[el] }} />
                              ))}
                            </div>
                          </div>
                          {liveResults.regenteAscendente && (
                            <div className="flex flex-col border-l border-stone-800 pl-4">
                              <span className="text-[10px] text-stone-500 uppercase font-bold">Regente AC</span>
                              <span className="text-xs font-bold text-emerald-400">
                                {liveResults.regenteAscendente.planeta}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-6 items-center">
                        <div className="flex gap-6">
                          {liveResults.luz.map(el => (
                            <div key={el} className="flex flex-col">
                              <span className="text-xl font-bold" style={{ color: ELEMENT_COLORS[el] }}>{el}</span>
                              <span className="text-[10px] text-stone-500 uppercase font-bold">Predominante</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleRecalculate}
                          disabled={!hasPendingChanges}
                          className={cn(
                            "ml-4 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg",
                            hasPendingChanges 
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 scale-105" 
                              : "bg-stone-800 text-stone-500 cursor-not-allowed"
                          )}
                        >
                          <Calculator className="w-5 h-5" />
                          Recalcular Matriz
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {positions.map((pos, index) => (
                        <motion.div
                          layout
                          key={index}
                          className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow group"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Posición {index + 1}</span>
                            <button
                              onClick={() => removePosition(index)}
                              className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Planeta</label>
                                <select
                                  value={pos.planeta}
                                  onChange={(e) => updatePosition(index, "planeta", e.target.value)}
                                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                  {Object.keys(PLANET_SCORES).map((p) => (
                                    <option key={p} value={p} className="bg-[#0B1026]">{p}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Signo</label>
                                <select
                                  value={pos.signo}
                                  onChange={(e) => updatePosition(index, "signo", e.target.value)}
                                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                  {Object.keys(SIGN_DATA).map((s) => (
                                    <option key={s} value={s} className="bg-[#0B1026]">{s}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 relative z-10"
            >
              {/* Regente del Ascendente Section */}
              {results.regenteAscendente && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.02] backdrop-blur-[1px] text-white p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-16 h-16 text-emerald-400" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Planeta Regente del Ascendente</h3>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold tracking-tight text-white">
                          {results.regenteAscendente.planeta} en {results.regenteAscendente.signo}
                        </span>
                        <span className="text-white/60 text-sm font-medium">
                          (Rige a {results.regenteAscendente.signoAscendente})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Elemento</span>
                        <span 
                          className="text-sm font-bold"
                          style={{ color: ELEMENT_COLORS[SIGN_DATA[results.regenteAscendente.signo].element] }}
                        >
                          {SIGN_DATA[results.regenteAscendente.signo].element}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Modalidad</span>
                        <span 
                          className="text-sm font-bold"
                          style={{ color: MODALITY_COLORS[SIGN_DATA[results.regenteAscendente.signo].modality] }}
                        >
                          {SIGN_DATA[results.regenteAscendente.signo].modality}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Classification Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/[0.02] backdrop-blur-[1px] p-6 rounded-3xl border border-white/10 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 group-hover:drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                    <Sun className="w-12 h-12 text-amber-500" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Luz</h3>
                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                    {results.luz.map((el) => (
                      <div key={el} className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[el] }} />
                            <span className="font-bold text-white text-sm">{el}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-white leading-none">{results.totalesElemento[el]}</span>
                            <span className="text-[10px] text-white/40 font-mono uppercase font-bold">pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-white/80">Elementos con mayor predominancia y consciencia.</p>
                </div>

                <div className="bg-white/[0.02] backdrop-blur-[1px] p-6 rounded-3xl border border-white/10 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                    <VenetianMask className="w-12 h-12 text-cyan-500" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Máscara</h3>
                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                    {results.mascara.map((el) => (
                      <div key={el} className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[el] }} />
                            <span className="font-bold text-white text-sm">{el}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-white leading-none">{results.totalesElemento[el]}</span>
                            <span className="text-[10px] text-white/40 font-mono uppercase font-bold">pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {results.mascara.length === 0 && <span className="text-white/40 italic">Ninguno</span>}
                  </div>
                  <p className="mt-4 text-sm text-white/80">Elemento de equilibrio o integración secundaria.</p>
                </div>

                <div className="bg-white/[0.02] backdrop-blur-[1px] p-6 rounded-3xl border border-white/10 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 group-hover:drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <Moon className="w-12 h-12 text-indigo-500" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Sombra</h3>
                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                    {results.sombra.map((el) => (
                      <div key={el} className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[el] }} />
                            <span className="font-bold text-white text-sm">{el}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-white leading-none">{results.totalesElemento[el]}</span>
                            <span className="text-[10px] text-white/40 font-mono uppercase font-bold">pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-white/80">Elemento con menor puntaje, a menudo inconsciente.</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Elements Chart */}
                <div className="bg-white/[0.02] backdrop-blur-[1px] p-8 rounded-3xl border border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold tracking-tight text-white">Distribución por Elemento</h3>
                    <div className="flex gap-2">
                      {Object.entries(ELEMENT_COLORS).map(([name, color]) => (
                        <div key={name} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-[10px] font-bold uppercase text-white/50">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={elementChartData} layout="vertical" margin={{ left: 20, right: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fontWeight: 600, fill: '#a8a29e' }}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#0B1026', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                          itemStyle={{ color: '#fff' }}
                          formatter={(value: number, name: string, props: any) => [
                            `${value} pts (${props.payload.percentage.toFixed(1)}%)`, 
                            "Puntaje"
                          ]}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                          {elementChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={ELEMENT_COLORS[entry.name as Element]} />
                          ))}
                          <LabelList 
                            dataKey="value" 
                            position="right" 
                            content={(props: any) => {
                              const { x, y, width, value, payload } = props;
                              return (
                                <text 
                                  x={x + width + 10} 
                                  y={y + 16} 
                                  fill="#fff" 
                                  fontSize={11} 
                                  fontWeight="bold" 
                                  textAnchor="start" 
                                  dominantBaseline="middle"
                                >
                                  {value} pts ({payload.percentage.toFixed(1)}%)
                                </text>
                              );
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Element Percentages Table */}
                <div className="bg-white/[0.02] backdrop-blur-[1px] p-8 rounded-3xl border border-white/10 shadow-sm">
                  <h3 className="text-xl font-bold tracking-tight mb-8 text-white">Porcentajes por Elemento</h3>
                  <div className="space-y-6">
                    {elementPercentages.map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[item.name] }} />
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{item.name}</span>
                              <span className="text-[10px] text-white/60 uppercase font-bold">
                                {item.count} {item.count === 1 ? 'Planeta' : 'Planetas'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-white">
                              {item.percentage > 0 ? `${item.percentage.toFixed(1)}%` : '0%'}
                            </span>
                            <span className="text-xs text-white/40 block font-mono">{item.value} pts</span>
                          </div>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: ELEMENT_COLORS[item.name] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modalities Chart */}
                <div className="bg-white/[0.02] backdrop-blur-[1px] p-8 rounded-3xl border border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold tracking-tight text-white">Distribución por Modalidad</h3>
                    <div className="flex gap-2">
                      {Object.entries(MODALITY_COLORS).map(([name, color]) => (
                        <div key={name} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-[10px] font-bold uppercase text-white/50">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modalityChartData} layout="vertical" margin={{ left: 40, right: 80 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#0B1026', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                          itemStyle={{ color: '#fff' }}
                          formatter={(value: number, name: string, props: any) => [
                            `${value} pts (${props.payload.percentage.toFixed(1)}%)`, 
                            "Puntaje"
                          ]}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
                          {modalityChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={MODALITY_COLORS[entry.name as Modality]} />
                          ))}
                          <LabelList 
                            dataKey="value" 
                            position="right" 
                            content={(props: any) => {
                              const { x, y, width, value, payload } = props;
                              return (
                                <text 
                                  x={x + width + 10} 
                                  y={y + 20} 
                                  fill="#fff" 
                                  fontSize={11} 
                                  fontWeight="bold" 
                                  textAnchor="start" 
                                  dominantBaseline="middle"
                                >
                                  {value} pts ({payload.percentage.toFixed(1)}%)
                                </text>
                              );
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              {/* Detailed Table */}
              <div className="bg-white/[0.02] backdrop-blur-[1px] rounded-3xl border border-white/10 shadow-sm overflow-hidden mt-8">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-lg font-bold tracking-tight text-white">Desglose de Puntajes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-white/40">Planeta</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-white/40">Signo</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-white/40">Elemento</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-white/40">Modalidad</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-white/40 text-right">Puntaje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {calculatedPositions.map((pos, i) => {
                        const signInfo = SIGN_DATA[pos.signo];
                        const scores = PLANET_SCORES[pos.planeta];
                        if (!signInfo || !scores) return null;
                        return (
                          <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium">{pos.planeta}</td>
                            <td className="px-6 py-4 text-sm text-stone-600">{pos.signo}</td>
                            <td className="px-6 py-4">
                              <span 
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                                style={{ backgroundColor: ELEMENT_COLORS[signInfo.element] }}
                              >
                                {signInfo.element}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span 
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                                style={{ backgroundColor: MODALITY_COLORS[signInfo.modality] }}
                              >
                                {signInfo.modality}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-right font-bold text-stone-900">{scores.elementScore}</td>
                          </tr>
                        );
                      })}
                      {results.regenteAscendente && (
                        <tr className="bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-emerald-700">Regente del Ascendente (RA)</td>
                          <td className="px-6 py-4 text-sm text-stone-600 italic">Extra por {results.regenteAscendente.planeta}</td>
                          <td className="px-6 py-4">
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                              style={{ backgroundColor: ELEMENT_COLORS[SIGN_DATA[results.regenteAscendente.signo].element] }}
                            >
                              {SIGN_DATA[results.regenteAscendente.signo].element}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                              style={{ backgroundColor: MODALITY_COLORS[SIGN_DATA[results.regenteAscendente.signo].modality] }}
                            >
                              {SIGN_DATA[results.regenteAscendente.signo].modality}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-right font-bold text-emerald-700">
                            +{PLANET_SCORES["Regente del Ascendente (RA)"].elementScore}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-white/10 mt-12 opacity-80">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-30">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Sistema Matriz Elemental v1.0</span>
          </div>
          <div className="flex gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Metodología</span>
              <p className="text-xs text-white/40">Puntajes ponderados por relevancia planetaria.</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Clasificación</span>
              <p className="text-xs text-white/40">Luz (Top 2), Sombra (Min), Máscara (Resto).</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
