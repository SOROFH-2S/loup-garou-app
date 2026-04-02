import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  ChevronRight,
  Flame,
  Heart,
  Home,
  Menu,
  Moon,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Skull,
  Sparkles,
  Trophy,
  User,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react"
import { supabase } from "./supabase"
import wolfMoon from "./assets/wolf-bg.webp"

const ROLE_LABELS = { /* ... ton objet ROLE_LABELS complet ... */ }
const ROLE_DESCRIPTIONS = { /* ... ton objet ROLE_DESCRIPTIONS complet ... */ }
const EMPTY_ROLE_CONFIG = { /* ... ton objet EMPTY_ROLE_CONFIG complet ... */ }

const STORAGE_KEYS = {
  sessionId: "lg_session_id",
  gameId: "lg_game_id",
  entryMode: "lg_entry_mode",
  playerName: "lg_player_name",
  hostName: "lg_host_name",
  hostNotesPrefix: "lg_host_notes_",
}

const PHASE_LABELS = { /* ... ton objet PHASE_LABELS ... */ }
const PHASE_HEADLINES = { /* ... ton objet PHASE_HEADLINES ... */ }
const PHASE_SUBTEXT = { /* ... ton objet PHASE_SUBTEXT ... */ }

const WOLF_ROLES = ["loup", "loup_blanc", "loup_infecte", "grand_mechant_loup", "loup_bavard"]
const FILTER_LABELS = { all: "tous", alive: "vivants", dead: "morts" }

const COLORS = { /* ... tes couleurs ... */ }

function GlobalAnimations() {
  return (
    <style>{`
      /* ... tes styles globaux complets ... */
    `}</style>
  )
}

function App() {
  // ======================= STATE =======================
  const [entryMode, setEntryMode] = useState("")
  const [hostName, setHostName] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [message, setMessage] = useState("")
  const [currentGame, setCurrentGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [mySessionId, setMySessionId] = useState("")
  const [expectedPlayers, setExpectedPlayers] = useState(10)
  const [expectedPlayersInput, setExpectedPlayersInput] = useState("10")
  const [showHiddenRoles, setShowHiddenRoles] = useState(false)
  const [highlightedRole, setHighlightedRole] = useState("")
  const [roleConfig, setRoleConfig] = useState({
    ...EMPTY_ROLE_CONFIG,
    loup: 2,
    voyante: 1,
    sorciere: 1,
    garde: 1,
    chasseur: 1,
    villageois: 4,
  })
  const [activeHostTab, setActiveHostTab] = useState("game")
  const [activePlayerTab, setActivePlayerTab] = useState("profil")
  const [playerFilter, setPlayerFilter] = useState("all")
  const [hostNightNotes, setHostNightNotes] = useState("")   // ← Notes du MJ

  const hostNameRef = useRef(null)
  const playerNameRef = useRef(null)
  const expectedPlayersRef = useRef(null)

  // ======================= HELPERS =======================
  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  function getSessionId() {
    let sessionId = sessionStorage.getItem(STORAGE_KEYS.sessionId)
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem(STORAGE_KEYS.sessionId, sessionId)
    }
    return sessionId
  }

  function getHostNotesStorageKey(gameId) {
    return `${STORAGE_KEYS.hostNotesPrefix}${gameId}`
  }

  function clearHostNotesStorage(gameId) {
    if (!gameId) return
    localStorage.removeItem(getHostNotesStorageKey(gameId))
  }

  function normalizeName(name) {
    return name.trim().toLowerCase()
  }

  // ... (tes autres fonctions helpers : validateExpectedPlayersInput, getExpectedPlayersFromRef, commitExpectedPlayersInput, persistGameSession, clearPersistedGameSession, etc.)

  // ======================= NOTES PERSISTENCE =======================
  useEffect(() => {
    if (!currentGame?.id || !isRealHost) return
    const saved = localStorage.getItem(getHostNotesStorageKey(currentGame.id)) || ""
    setHostNightNotes(saved)
  }, [currentGame?.id, isRealHost])

  useEffect(() => {
    if (!currentGame?.id || !isRealHost) return
    localStorage.setItem(getHostNotesStorageKey(currentGame.id), hostNightNotes)
  }, [hostNightNotes, currentGame?.id, isRealHost])

  // ======================= RESET =======================
  function goToHome() {
    if (currentGame?.id) {
      clearHostNotesStorage(currentGame.id)
    }
    clearPersistedGameSession()
    setEntryMode("")
    setHostName("")
    setPlayerName("")
    setJoinCode("")
    setMessage("")
    setCurrentGame(null)
    setPlayers([])
    setMySessionId("")
    setExpectedPlayers(10)
    setExpectedPlayersInput("10")
    setShowHiddenRoles(false)
    setHighlightedRole("")
    setActiveHostTab("game")
    setActivePlayerTab("profil")
    setPlayerFilter("all")
    setHostNightNotes("")
    setRoleConfig({
      ...EMPTY_ROLE_CONFIG,
      loup: 2,
      voyante: 1,
      sorciere: 1,
      garde: 1,
      chasseur: 1,
      villageois: 4,
    })

    if (hostNameRef.current) hostNameRef.current.value = ""
    if (playerNameRef.current) playerNameRef.current.value = ""
    if (expectedPlayersRef.current) expectedPlayersRef.current.value = "10"
  }

  // ======================= HOST NOTES SCREEN =======================
  function HostNotesScreen() {
    const phaseLabel =
      currentGame?.phase === "night"
        ? `Nuit ${currentGame?.night_number || 1}`
        : currentGame?.phase === "day"
          ? `Jour ${currentGame?.day_number || 1}`
          : getPhaseLabel(currentGame?.phase)

    return (
      <div style={styles.screen} className="screen-enter">
        <div style={styles.topBar}>
          <button onClick={() => setActiveHostTab("game")} style={styles.iconBtn}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Notes du maître du jeu</div>
            <div style={{ color: "#67e8f9", fontWeight: 700 }}>
              SALON : {currentGame?.code}
            </div>
          </div>
          <div style={styles.badge}>{phaseLabel}</div>
        </div>

        <div style={{ paddingTop: 24, display: "grid", gap: 20 }}>
          <div style={styles.glassCard}>
            <textarea
              value={hostNightNotes}
              onChange={(e) => setHostNightNotes(e.target.value)}
              placeholder={`Exemples :\n- Nuit 1 : Karim huilé\n- Sara +2 voix\n- Garde protège Youssef\n- Loups ont tué Ahmed`}
              style={{
                width: "100%",
                minHeight: 340,
                borderRadius: 20,
                padding: 18,
                background: "rgba(255,255,255,0.05)",
                color: "#e2e8f0",
                border: "1px solid rgba(103,232,249,0.25)",
                fontSize: 16,
                lineHeight: 1.6,
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                onClick={() => setActiveHostTab("game")}
                style={styles.secondaryBtn}
              >
                Fermer
              </button>
              <button
                onClick={() => setHostNightNotes("")}
                style={{ ...styles.secondaryBtn, color: "#f87171" }}
              >
                Effacer tout
              </button>
            </div>
          </div>
        </div>

        {BottomNav({
          items: [
            { key: "game", label: "Jeu", icon: Moon, active: activeHostTab === "game" },
            { key: "notes", label: "Notes", icon: Menu, active: activeHostTab === "notes" },
            { key: "roles", label: "Rôles", icon: Shield, active: activeHostTab === "roles" },
            { key: "setup", label: "Réglages", icon: Settings, active: activeHostTab === "setup" },
          ],
          onPress: setActiveHostTab,
          columns: 4,
        })}
      </div>
    )
  }

  // ======================= HOST GAME SCREEN =======================
  function HostGameScreen() {
    const ended = currentGame.status === "ended"
    const canUseHostNotes = currentGame.status === "started" || ended

    if (activeHostTab === "notes" && canUseHostNotes) {
      return <HostNotesScreen />
    }

    return (
      <div style={styles.screen} className="screen-enter">
        {/* === TON CONTENU ACTUEL DE HOST GAME SCREEN ICI === */}
        {/* (la partie avec la carte de phase, liste des joueurs, boutons de fin de partie, etc.) */}

        <div style={{ paddingTop: 24, display: "grid", gap: 22 }}>
          {/* ... ton code existant pour l'écran de jeu ... */}
        </div>

        {BottomNav({
          items: [
            { key: "game", label: "Jeu", icon: Moon, active: activeHostTab === "game" },
            ...(canUseHostNotes
              ? [{ key: "notes", label: "Notes", icon: Menu, active: activeHostTab === "notes" }]
              : []),
            { key: "roles", label: "Rôles", icon: Shield, active: activeHostTab === "roles" },
            { key: "setup", label: "Réglages", icon: Settings, active: activeHostTab === "setup" },
          ],
          onPress: setActiveHostTab,
          columns: canUseHostNotes ? 4 : 3,
        })}
      </div>
    )
  }

  // ======================= NEW GAME =======================
  async function newGame() {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      goToHome()
      return
    }

    // Suppression des données
    await supabase.from("players").delete().eq("game_id", currentGame.id)
    await supabase.from("games").delete().eq("id", currentGame.id).eq("host_session_id", mySessionId)

    clearHostNotesStorage(currentGame.id)
    goToHome()
  }

  // ======================= LE RESTE DE TON CODE =======================
  // (toutes tes autres fonctions : createGameAsHost, joinGameAsPlayer, startGame, goToNextPhase, 
  //  markPlayerDead, endGameManually, restoreSession, useEffect pour realtime, renderScreen, etc.)

  // ... Colle ici tout le reste de ton code original (styles, composants HomeScreen, HostLobbyScreen, 
  // PlayerLobbyScreen, PlayerGameScreen, BottomNav, etc.)

  const isRealHost = !!currentGame && currentGame.host_session_id === mySessionId

  function renderScreen() {
    if (!currentGame) {
      if (entryMode === "host") return HostEntryScreen()
      if (entryMode === "player") return PlayerEntryScreen()
      return HomeScreen()
    }

    const isLobby = currentGame.status === "lobby"
    const isStarted = currentGame.status === "started"
    const isEnded = currentGame.status === "ended"

    if (isRealHost && isLobby) return HostLobbyScreen()
    if (isRealHost && (isStarted || isEnded)) return HostGameScreen()
    if (isLobby) return PlayerLobbyScreen()
    return PlayerGameScreen()
  }

  return (
    <div style={styles.page}>
      <GlobalAnimations />
      <div style={styles.forestGlow} />
      <div style={{ ...styles.cinematicLayer, background: phaseCinematic.overlay, animation: phaseCinematic.animation }} />
      <div style={styles.cinematicMoon} />
      <div style={styles.mobile}>{renderScreen()}</div>
    </div>
  )
}

export default App