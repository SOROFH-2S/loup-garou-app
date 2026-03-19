import { useEffect, useMemo, useState } from "react"
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

const ROLE_LABELS = {
  loup: "Loup-garou",
  sorciere: "Sorcière",
  voyante: "Voyante",
  chasseur: "Chasseur",
  petite_fille: "Petite fille",
  cupidon: "Cupidon",
  pyromane: "Pyromane",
  villageois: "Villageois",
  renard: "Renard",
  corbeau: "Corbeau",
  ancien: "Ancien",
  enfant_sauvage: "Enfant sauvage",
  petit_chaperon_rouge: "Petit chaperon rouge",
  ange_dechu: "Ange déchu",
  chevalier_epee_rouillee: "Chevalier à l’épée rouillée",
  loup_blanc: "Loup blanc",
  loup_infecte: "Loup infecté",
  grand_mechant_loup: "Grand méchant loup",
  garde: "Garde",
  frere_1: "Frère 1",
  frere_2: "Frère 2",
  soeur_1: "Soeur 1",
  soeur_2: "Soeur 2",
  soeur_3: "Soeur 3",
  loup_bavard: "Loup bavard",
  vagabond: "Vagabond",
}

const ROLE_DESCRIPTIONS = {
  loup: "Chaque nuit, tu te réveilles avec les autres loups pour choisir une victime à éliminer.",
  sorciere:
    "Tu disposes d’une potion de vie et d’une potion de mort. Chaque potion n’est utilisable qu’une seule fois pendant la partie, uniquement la nuit.",
  voyante: "Chaque nuit, tu peux découvrir l’identité réelle d’un joueur.",
  chasseur:
    "Quand tu meurs, tu peux tirer immédiatement sur un joueur avec ta dernière balle.",
  petite_fille:
    "Tu peux observer discrètement les loups la nuit. Si tu es repérée, tu risques de devenir leur cible.",
  cupidon:
    "Au début de la partie, tu formes un couple d’amoureux. Ils doivent survivre ensemble pour gagner.",
  pyromane:
    "Tu joues seul. Tu peux d’abord huiler des joueurs puis les brûler plus tard. Tu gagnes si tu es le dernier survivant.",
  villageois:
    "Tu n’as aucun pouvoir spécial. Ta force, c’est l’observation, la discussion et le vote.",
  renard:
    "La nuit, tu cibles un joueur. Si aucun loup n’est trouvé parmi lui et ses voisins, tu perds ton pouvoir.",
  corbeau:
    "Chaque nuit, tu peux donner deux voix supplémentaires à un joueur pour le prochain vote.",
  ancien:
    "Tu résistes à la première attaque des loups. Si le village t’élimine, les villageois perdent leurs pouvoirs.",
  enfant_sauvage:
    "Tu choisis un modèle au début de la partie. Si ce joueur meurt, tu deviens loup.",
  petit_chaperon_rouge:
    "Tu es immunisé contre les loups tant que le chasseur est vivant.",
  ange_dechu:
    "Tu gagnes seul si le village t’élimine au premier conseil. Sinon, tu redeviens un simple villageois.",
  chevalier_epee_rouillee:
    "Quand tu meurs, le premier loup à ta gauche meurt également.",
  loup_blanc:
    "Un loup spécial avec un objectif personnel, souvent finir dernier survivant.",
  loup_infecte:
    "Une seule fois dans la partie, tu peux infecter une victime et la transformer en loup au lieu de la tuer.",
  grand_mechant_loup:
    "Un loup spécial avec un pouvoir avancé selon la variante choisie.",
  garde:
    "Chaque nuit, tu peux protéger un joueur, y compris toi-même, mais pas la même personne deux nuits de suite.",
  frere_1: "Tu fais partie du groupe des frères et joues pour le village.",
  frere_2: "Tu fais partie du groupe des frères et joues pour le village.",
  soeur_1: "Tu fais partie du groupe des soeurs et joues pour le village.",
  soeur_2: "Tu fais partie du groupe des soeurs et joues pour le village.",
  soeur_3: "Tu fais partie du groupe des soeurs et joues pour le village.",
  loup_bavard:
    "Un loup avec une règle de communication spéciale selon la variante choisie.",
  vagabond:
    "Chaque nuit, tu dors chez quelqu’un. Cette personne devient protégée pendant la nuit.",
}

const EMPTY_ROLE_CONFIG = {
  loup: 0,
  sorciere: 0,
  voyante: 0,
  chasseur: 0,
  petite_fille: 0,
  cupidon: 0,
  pyromane: 0,
  villageois: 0,
  renard: 0,
  corbeau: 0,
  ancien: 0,
  enfant_sauvage: 0,
  petit_chaperon_rouge: 0,
  ange_dechu: 0,
  chevalier_epee_rouillee: 0,
  loup_blanc: 0,
  loup_infecte: 0,
  grand_mechant_loup: 0,
  garde: 0,
  frere_1: 0,
  frere_2: 0,
  soeur_1: 0,
  soeur_2: 0,
  soeur_3: 0,
  loup_bavard: 0,
  vagabond: 0,
}

const STORAGE_KEYS = {
  sessionId: "lg_session_id",
  gameId: "lg_game_id",
  entryMode: "lg_entry_mode",
  playerName: "lg_player_name",
  hostName: "lg_host_name",
}

const PHASE_LABELS = {
  lobby: "Salon de jeu",
  setup: "Préparation",
  night: "Nuit",
  night_resolve: "Résolution de la nuit",
  day: "Jour",
  vote: "Vote du village",
  vote_resolve: "Résolution du vote",
  ended: "Partie terminée",
}

const PHASE_HEADLINES = {
  setup: "La partie commence",
  night: "Les loups se réveillent...",
  night_resolve: "Résolution des actions de nuit",
  day: "Le village se réveille",
  vote: "Le village doit voter",
  vote_resolve: "Résolution du vote",
  ended: "L’histoire est terminée",
}

const PHASE_SUBTEXT = {
  setup: "Le maître du jeu prépare le premier cycle de la partie.",
  night: "En attente du choix de la cible des loups pour cette nuit.",
  night_resolve:
    "Le maître du jeu applique toutes les actions et conséquences de la nuit.",
  day: "Discutez, observez et décidez qui se cache dans l’ombre.",
  vote: "Le village doit maintenant choisir qui éliminer.",
  vote_resolve: "La décision finale du village est en cours d’application.",
  ended: "Un camp a gagné. Consulte les survivants et les éliminés.",
}

const WOLF_ROLES = [
  "loup",
  "loup_blanc",
  "loup_infecte",
  "grand_mechant_loup",
  "loup_bavard",
]

const FILTER_LABELS = {
  all: "tous",
  alive: "vivants",
  dead: "morts",
}

const COLORS = {
  primaryBlue: "#38bdf8",
  primaryBlueLight: "#67e8f9",
  titleBlue: "#7dd3fc",
  darkText: "#dbeafe",
  darkTextSoft: "#cbd5e1",
  bodyText: "#e2e8f0",
  lightText: "#dbeafe",
  mutedText: "#94a3b8",
}

function GlobalAnimations() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      html, body, #root {
        margin: 0;
        padding: 0;
        min-height: 100%;
        background: #04070f;
      }

      button, input {
        font: inherit;
      }

      button {
        transition:
          transform 180ms ease,
          box-shadow 220ms ease,
          background 220ms ease,
          border-color 220ms ease,
          opacity 180ms ease,
          filter 220ms ease;
      }

      button:hover {
        transform: translateY(-1px);
      }

      button:active {
        transform: translateY(1px) scale(0.985);
      }

      input {
        transition:
          box-shadow 220ms ease,
          border-color 220ms ease,
          background 220ms ease;
      }

      input:focus {
        border-color: rgba(103, 232, 249, 0.48) !important;
        box-shadow:
          0 0 0 1px rgba(103, 232, 249, 0.22),
          0 0 18px rgba(56, 189, 248, 0.12),
          inset 0 1px 0 rgba(255,255,255,0.04);
        background: rgba(255,255,255,0.06) !important;
      }

      @keyframes neonPulse {
        0%, 100% {
          box-shadow:
            0 0 0 rgba(56,189,248,0),
            0 0 18px rgba(56,189,248,0.08),
            0 0 36px rgba(217,70,239,0.06);
        }
        50% {
          box-shadow:
            0 0 12px rgba(56,189,248,0.16),
            0 0 26px rgba(56,189,248,0.18),
            0 0 44px rgba(217,70,239,0.14);
        }
      }

      @keyframes neonBorderFlow {
        0% {
          border-color: rgba(103,232,249,0.18);
        }
        50% {
          border-color: rgba(217,70,239,0.24);
        }
        100% {
          border-color: rgba(103,232,249,0.18);
        }
      }

      @keyframes titleGlow {
        0%, 100% {
          text-shadow:
            0 0 10px rgba(56,189,248,0.28),
            0 0 26px rgba(56,189,248,0.18),
            0 0 46px rgba(217,70,239,0.10);
        }
        50% {
          text-shadow:
            0 0 14px rgba(56,189,248,0.40),
            0 0 34px rgba(56,189,248,0.28),
            0 0 62px rgba(217,70,239,0.18);
        }
      }

      @keyframes floatMoon {
        0%, 100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(0, -10px, 0) scale(1.02);
        }
      }

      @keyframes shimmer {
        0% {
          background-position: -220% 0;
        }
        100% {
          background-position: 220% 0;
        }
      }

      @keyframes badgePulse {
        0%, 100% {
          box-shadow:
            0 0 0 rgba(103,232,249,0),
            0 0 12px rgba(103,232,249,0.10);
        }
        50% {
          box-shadow:
            0 0 12px rgba(103,232,249,0.18),
            0 0 28px rgba(103,232,249,0.16);
        }
      }

      @keyframes ambientFog {
        0%, 100% {
          opacity: 0.94;
          filter: saturate(1.05) contrast(1.02) brightness(1);
        }
        50% {
          opacity: 1;
          filter: saturate(1.12) contrast(1.06) brightness(1.03);
        }
      }

      @keyframes roleCardGlow {
        0%, 100% {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.03),
            0 0 0 rgba(56,189,248,0),
            0 12px 30px rgba(0,0,0,0.28);
        }
        50% {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.03),
            0 0 18px rgba(56,189,248,0.08),
            0 12px 30px rgba(0,0,0,0.30);
        }
      }

      @keyframes iconOrb {
        0%, 100% {
          box-shadow:
            0 0 14px rgba(56,189,248,0.10),
            0 0 26px rgba(217,70,239,0.06);
        }
        50% {
          box-shadow:
            0 0 18px rgba(56,189,248,0.18),
            0 0 36px rgba(217,70,239,0.14);
        }
      }

      @keyframes screenEnter {
        0% {
          opacity: 0;
          transform: translateY(20px) scale(0.985);
          filter: blur(8px);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }
      }

      @keyframes cardFloat {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-6px);
        }
      }

      @keyframes playersReveal {
        0% {
          opacity: 0;
          transform: translateY(16px) scale(0.98);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes cinematicOverlay {
        0%, 100% {
          opacity: 0.48;
        }
        50% {
          opacity: 0.62;
        }
      }

      @keyframes moonSweep {
        0%, 100% {
          opacity: 0.18;
          transform: translateX(-4%) translateY(0%);
        }
        50% {
          opacity: 0.3;
          transform: translateX(4%) translateY(-2%);
        }
      }

      @keyframes dayGlow {
        0%, 100% {
          opacity: 0.18;
        }
        50% {
          opacity: 0.30;
        }
      }

      @keyframes nightGlow {
        0%, 100% {
          opacity: 0.20;
        }
        50% {
          opacity: 0.36;
        }
      }

      .screen-enter {
        animation: screenEnter 480ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .floating-card {
        animation:
          cardFloat 5.2s ease-in-out infinite,
          neonPulse 4s ease-in-out infinite,
          neonBorderFlow 5s ease-in-out infinite;
        will-change: transform;
      }

      .player-reveal {
        animation: playersReveal 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .scroll-hidden::-webkit-scrollbar {
        display: none;
      }

      .scroll-hidden {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
  )
}

function App() {
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

  function normalizeName(name) {
    return name.trim().toLowerCase()
  }

  function validateExpectedPlayersInput(rawValue, fallbackValue = expectedPlayers) {
    const parsed = Number(rawValue)
    if (Number.isNaN(parsed)) return fallbackValue
    return Math.min(44, Math.max(4, parsed))
  }

  function commitExpectedPlayersInput() {
    const validated = validateExpectedPlayersInput(expectedPlayersInput)
    setExpectedPlayers(validated)
    setExpectedPlayersInput(String(validated))
  }

  function persistGameSession({
    gameId,
    mode,
    playerNameValue = "",
    hostNameValue = "",
  }) {
    sessionStorage.setItem(STORAGE_KEYS.gameId, String(gameId))
    sessionStorage.setItem(STORAGE_KEYS.entryMode, mode)

    if (playerNameValue) {
      sessionStorage.setItem(STORAGE_KEYS.playerName, playerNameValue)
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.playerName)
    }

    if (hostNameValue) {
      sessionStorage.setItem(STORAGE_KEYS.hostName, hostNameValue)
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.hostName)
    }
  }

  function clearPersistedGameSession() {
    sessionStorage.removeItem(STORAGE_KEYS.gameId)
    sessionStorage.removeItem(STORAGE_KEYS.entryMode)
    sessionStorage.removeItem(STORAGE_KEYS.playerName)
    sessionStorage.removeItem(STORAGE_KEYS.hostName)
  }

  function goToHome() {
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
    setActiveHostTab("game")
    setActivePlayerTab("profil")
    setPlayerFilter("all")
    setRoleConfig({
      ...EMPTY_ROLE_CONFIG,
      loup: 2,
      voyante: 1,
      sorciere: 1,
      garde: 1,
      chasseur: 1,
      villageois: 4,
    })
  }

  const totalConfiguredRoles = useMemo(() => {
    return Object.values(roleConfig).reduce((sum, value) => sum + value, 0)
  }, [roleConfig])

  const me = players.find((p) => p.session_id === mySessionId)
  const isRealHost = !!currentGame && currentGame.host_session_id === mySessionId

  const filteredPlayers = useMemo(() => {
    if (playerFilter === "alive") return players.filter((p) => p.alive)
    if (playerFilter === "dead") return players.filter((p) => !p.alive)
    return players
  }, [players, playerFilter])

  const phaseCinematic = useMemo(() => {
    const phase = currentGame?.phase || "lobby"

    if (phase === "night" || phase === "night_resolve") {
      return {
        overlay:
          "radial-gradient(circle at 50% 18%, rgba(56,189,248,0.18), rgba(0,0,0,0) 26%), radial-gradient(circle at 52% 28%, rgba(168,85,247,0.22), rgba(0,0,0,0) 18%), linear-gradient(180deg, rgba(4,8,24,0.36), rgba(2,6,18,0.62))",
        animation: "nightGlow 4.5s ease-in-out infinite",
      }
    }

    if (phase === "day" || phase === "vote" || phase === "vote_resolve") {
      return {
        overlay:
          "radial-gradient(circle at 50% 12%, rgba(250,204,21,0.18), rgba(0,0,0,0) 24%), radial-gradient(circle at 52% 24%, rgba(56,189,248,0.14), rgba(0,0,0,0) 18%), linear-gradient(180deg, rgba(10,18,36,0.22), rgba(4,7,15,0.42))",
        animation: "dayGlow 4.5s ease-in-out infinite",
      }
    }

    return {
      overlay:
        "radial-gradient(circle at 50% 18%, rgba(88,240,255,0.12), rgba(0,0,0,0) 26%), linear-gradient(180deg, rgba(4,8,24,0.24), rgba(4,7,15,0.36))",
      animation: "cinematicOverlay 5.5s ease-in-out infinite",
    }
  }, [currentGame?.phase])

  function getPlayerRevealStyle(index = 0) {
    return {
      animationDelay: `${index * 70}ms`,
    }
  }

  function getRoleMaxCount(roleKey) {
    if (roleKey === "loup" || roleKey === "villageois") return 10
    return 1
  }

  function changeRoleCount(roleKey, delta) {
    setRoleConfig((prev) => {
      const currentValue = prev[roleKey] || 0
      const maxValue = getRoleMaxCount(roleKey)
      const nextValue = Math.min(maxValue, Math.max(0, currentValue + delta))
      return { ...prev, [roleKey]: nextValue }
    })
  }

  function getPhaseLabel(phase) {
    return PHASE_LABELS[phase] || phase || "Phase inconnue"
  }

  function getPhaseHeadline(phase) {
    return PHASE_HEADLINES[phase] || "Partie en cours"
  }

  function getPhaseSubtext(phase) {
    return PHASE_SUBTEXT[phase] || "Le maître du jeu prépare l’étape suivante de l’histoire."
  }

  function getNextPhase(currentPhase) {
    switch (currentPhase) {
      case "setup":
        return "night"
      case "night":
        return "night_resolve"
      case "night_resolve":
        return "day"
      case "day":
        return "vote"
      case "vote":
        return "vote_resolve"
      case "vote_resolve":
        return "night"
      default:
        return "setup"
    }
  }

  async function goToNextPhase() {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Seul le maître du jeu peut changer de phase")
      return
    }

    if (currentGame.status !== "started") {
      setMessage("La partie doit être commencée")
      return
    }

    const currentPhase = currentGame.phase || "setup"
    const nextPhase = getNextPhase(currentPhase)

    let nextNightNumber = currentGame.night_number || 0
    let nextDayNumber = currentGame.day_number || 0
    let firstVoteDone = currentGame.first_vote_done || false

    if (nextPhase === "night") nextNightNumber += 1
    if (nextPhase === "day") nextDayNumber += 1
    if (nextPhase === "vote_resolve" && !firstVoteDone) firstVoteDone = true

    const { data, error } = await supabase
      .from("games")
      .update({
        phase: nextPhase,
        night_number: nextNightNumber,
        day_number: nextDayNumber,
        first_vote_done: firstVoteDone,
      })
      .eq("id", currentGame.id)
      .eq("host_session_id", mySessionId)
      .select()
      .single()

    if (error) {
      console.error(error)
      setMessage("Erreur lors du changement de phase")
      return
    }

    setCurrentGame(data)
    setMessage(`Phase actuelle : ${getPhaseLabel(data.phase)}`)
  }

  function generateSuggestedRoles(playerCount) {
    const config = { ...EMPTY_ROLE_CONFIG }

    if (playerCount <= 4) {
      config.loup = 1
      config.voyante = 1
      config.villageois = playerCount - 2
      return config
    }

    if (playerCount <= 6) {
      config.loup = 1
      config.loup_blanc = 1
      config.voyante = 1
      config.sorciere = 1
      config.villageois = playerCount - 4
      return config
    }

    if (playerCount <= 8) {
      config.loup = 1
      config.grand_mechant_loup = 1
      config.voyante = 1
      config.sorciere = 1
      config.chasseur = 1
      config.cupidon = 1
      config.villageois = playerCount - 6
      return config
    }

    if (playerCount <= 10) {
      config.loup = 1
      config.loup_blanc = 1
      config.loup_infecte = 1
      config.voyante = 1
      config.sorciere = 1
      config.chasseur = 1
      config.cupidon = 1
      config.corbeau = 1
      config.ancien = 1
      config.villageois = playerCount - 9
      return config
    }

    if (playerCount <= 14) {
      config.loup = 1
      config.loup_blanc = 1
      config.loup_infecte = 1
      config.grand_mechant_loup = 1
      config.voyante = 1
      config.sorciere = 1
      config.chasseur = 1
      config.cupidon = 1
      config.corbeau = 1
      config.ancien = 1
      config.garde = 1
      config.frere_1 = 1
      config.frere_2 = 1
      config.villageois = playerCount - 13
      return config
    }

    config.loup = 1
    config.loup_blanc = 1
    config.loup_infecte = 1
    config.grand_mechant_loup = 1
    config.loup_bavard = 1
    config.voyante = 1
    config.sorciere = 1
    config.chasseur = 1
    config.cupidon = 1
    config.corbeau = 1
    config.ancien = 1
    config.renard = 1
    config.enfant_sauvage = 1
    config.petit_chaperon_rouge = 1
    config.ange_dechu = 1
    config.chevalier_epee_rouillee = 1
    config.garde = 1
    config.frere_1 = 1
    config.frere_2 = 1
    config.soeur_1 = 1
    config.soeur_2 = 1
    config.soeur_3 = 1
    config.vagabond = 1
    config.villageois = Math.max(0, playerCount - 23)

    return config
  }

  async function loadPlayers(gameId) {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", gameId)
      .order("joined_at", { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setPlayers(data || [])
  }

  function computeWinner(playersList) {
    const alivePlayers = playersList.filter((p) => p.alive)
    const wolves = alivePlayers.filter((p) => WOLF_ROLES.includes(p.role))
    const villageCampRoles = alivePlayers.filter(
      (p) => !WOLF_ROLES.includes(p.role) && p.role !== "pyromane"
    )
    const pyromane = alivePlayers.filter((p) => p.role === "pyromane")

    if (pyromane.length === 1 && alivePlayers.length === 1) return "Le pyromane gagne"
    if (wolves.length === 0 && alivePlayers.length > 0) return "Le village gagne"
    if (villageCampRoles.length === 0 && wolves.length > 0) return "Les loups gagnent"
    return null
  }

  async function updateGameEnded(gameId, winner) {
    const { error } = await supabase
      .from("games")
      .update({
        status: "ended",
        phase: "ended",
        winner,
        ended_at: new Date().toISOString(),
      })
      .eq("id", gameId)
      .eq("host_session_id", mySessionId)

    if (error) {
      console.error(error)
      setMessage("Erreur lors de la fin de partie")
    }
  }

  async function createGameAsHost() {
    setMessage("")

    const validatedPlayers = validateExpectedPlayersInput(expectedPlayersInput, expectedPlayers)
    setExpectedPlayers(validatedPlayers)
    setExpectedPlayersInput(String(validatedPlayers))

    if (!hostName.trim()) {
      setMessage("Entre le nom du maître du jeu")
      return
    }

    if (validatedPlayers < 4) {
      setMessage("Le nombre minimum de joueurs est 4")
      return
    }

    if (validatedPlayers > 44) {
      setMessage("Le nombre maximum de joueurs est 44")
      return
    }

    const code = generateCode()
    const sessionId = getSessionId()

    setMySessionId(sessionId)
    setEntryMode("host")

    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert([
        {
          code,
          host_name: hostName.trim(),
          host_session_id: sessionId,
          status: "lobby",
          expected_players: validatedPlayers,
          role_config: roleConfig,
          phase: "lobby",
          night_number: 0,
          day_number: 0,
          first_vote_done: false,
        },
      ])
      .select()

    if (gameError) {
      console.error(gameError)
      setMessage("Erreur lors de la création de la partie")
      return
    }

    const game = gameData[0]

    persistGameSession({
      gameId: game.id,
      mode: "host",
      hostNameValue: hostName.trim(),
    })

    setCurrentGame(game)
    setExpectedPlayers(game.expected_players || 10)
    setExpectedPlayersInput(String(game.expected_players || 10))
    setRoleConfig({
      ...EMPTY_ROLE_CONFIG,
      ...(game.role_config || {}),
    })
    setMessage("Partie créée avec succès")
    await loadPlayers(game.id)
  }

  async function joinGameAsPlayer() {
    setMessage("")

    if (!playerName.trim()) {
      setMessage("Entre ton nom")
      return
    }

    if (!joinCode.trim()) {
      setMessage("Entre le code de la partie")
      return
    }

    const sessionId = getSessionId()
    setMySessionId(sessionId)

    const { data: games, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("code", joinCode.trim().toUpperCase())

    if (gameError) {
      console.error(gameError)
      setMessage("Erreur lors de la recherche de la partie")
      return
    }

    if (!games || games.length === 0) {
      setMessage("Partie introuvable")
      return
    }

    const game = games[0]

    if (game.host_session_id === sessionId) {
      setMessage(
        "Cette fenêtre est déjà celle du maître du jeu. Utilise un autre navigateur, une fenêtre privée ou un autre téléphone pour rejoindre comme joueur."
      )
      return
    }

    const { data: existingPlayers, error: playersError } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", game.id)

    if (playersError) {
      console.error(playersError)
      setMessage("Erreur lors de la vérification des joueurs")
      return
    }

    const existingSameSessionPlayer = existingPlayers.find((p) => p.session_id === sessionId)

    if (existingSameSessionPlayer) {
      persistGameSession({
        gameId: game.id,
        mode: "player",
        playerNameValue: existingSameSessionPlayer.name,
      })

      setPlayerName(existingSameSessionPlayer.name)
      setEntryMode("player")
      setCurrentGame(game)
      setExpectedPlayers(game.expected_players || 10)
      setExpectedPlayersInput(String(game.expected_players || 10))
      setRoleConfig({
        ...EMPTY_ROLE_CONFIG,
        ...(game.role_config || {}),
      })
      setMessage("Session restaurée dans la partie")
      await loadPlayers(game.id)
      return
    }

    if (game.status !== "lobby") {
      setMessage("La partie a déjà commencé ou est terminée")
      return
    }

    if (existingPlayers.length >= game.expected_players) {
      setMessage("Cette partie est complète")
      return
    }

    const duplicateName = existingPlayers.some(
      (p) => normalizeName(p.name) === normalizeName(playerName)
    )

    if (duplicateName) {
      setMessage("Ce nom est déjà utilisé dans la partie")
      return
    }

    const { error: playerError } = await supabase.from("players").insert([
      {
        game_id: game.id,
        name: playerName.trim(),
        session_id: sessionId,
        is_host: false,
        alive: true,
      },
    ])

    if (playerError) {
      console.error(playerError)
      setMessage("Erreur lors de l’ajout du joueur")
      return
    }

    persistGameSession({
      gameId: game.id,
      mode: "player",
      playerNameValue: playerName.trim(),
    })

    setEntryMode("player")
    setCurrentGame(game)
    setExpectedPlayers(game.expected_players || 10)
    setExpectedPlayersInput(String(game.expected_players || 10))
    setRoleConfig({
      ...EMPTY_ROLE_CONFIG,
      ...(game.role_config || {}),
    })
    setMessage("Tu as rejoint la partie avec succès")
    await loadPlayers(game.id)
  }

  async function saveHostConfiguration() {
    if (!currentGame) return

    const validatedPlayers = validateExpectedPlayersInput(expectedPlayersInput, expectedPlayers)
    setExpectedPlayers(validatedPlayers)
    setExpectedPlayersInput(String(validatedPlayers))

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Seul le maître du jeu peut modifier la configuration")
      return
    }

    if (validatedPlayers < 4 || validatedPlayers > 44) {
      setMessage("Le nombre total de joueurs doit être compris entre 4 et 44")
      return
    }

    if (totalConfiguredRoles !== validatedPlayers) {
      setMessage("Le total des rôles doit être égal au nombre de joueurs attendus")
      return
    }

    const { data, error } = await supabase
      .from("games")
      .update({
        expected_players: validatedPlayers,
        role_config: roleConfig,
      })
      .eq("id", currentGame.id)
      .eq("host_session_id", mySessionId)
      .select()
      .single()

    if (error) {
      console.error(error)
      setMessage("Erreur lors de la sauvegarde de la configuration")
      return
    }

    setCurrentGame(data)
    setMessage("Configuration sauvegardée")
  }

  async function startGame() {
    if (!currentGame) return

    const validatedPlayers = validateExpectedPlayersInput(expectedPlayersInput, expectedPlayers)
    setExpectedPlayers(validatedPlayers)
    setExpectedPlayersInput(String(validatedPlayers))

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Seul le maître du jeu peut lancer la partie")
      return
    }

    if (totalConfiguredRoles !== validatedPlayers) {
      setMessage("Le total des rôles doit être égal au nombre de joueurs attendus")
      return
    }

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", currentGame.id)
      .order("joined_at", { ascending: true })

    if (playersError) {
      console.error(playersError)
      setMessage("Erreur lors de la récupération des joueurs")
      return
    }

    if (!playersData || playersData.length !== validatedPlayers) {
      setMessage("Le nombre de joueurs connectés doit correspondre au nombre configuré")
      return
    }

    const config = roleConfig
    const roles = []

    Object.keys(config).forEach((roleKey) => {
      const count = config[roleKey] || 0
      for (let i = 0; i < count; i += 1) {
        roles.push(roleKey)
      }
    })

    if (roles.length !== validatedPlayers) {
      setMessage("La composition des rôles n’est pas valide")
      return
    }

    roles.sort(() => Math.random() - 0.5)

    for (let i = 0; i < playersData.length; i += 1) {
      const { error: updateError } = await supabase
        .from("players")
        .update({
          role: roles[i],
          alive: true,
        })
        .eq("id", playersData[i].id)

      if (updateError) {
        console.error(updateError)
        setMessage("Erreur lors de l’attribution des rôles")
        return
      }
    }

    const { data: updatedGame, error: gameError } = await supabase
      .from("games")
      .update({
        status: "started",
        started_at: new Date().toISOString(),
        winner: null,
        ended_at: null,
        phase: "setup",
        night_number: 0,
        day_number: 0,
        first_vote_done: false,
        expected_players: validatedPlayers,
        role_config: roleConfig,
      })
      .eq("id", currentGame.id)
      .eq("host_session_id", mySessionId)
      .select()
      .single()

    if (gameError) {
      console.error(gameError)
      setMessage("Erreur lors du lancement de la partie")
      return
    }

    setCurrentGame(updatedGame)
    setMessage("La partie a commencé")
  }

  async function markPlayerDead(playerId, nextAliveValue) {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Seul le maître du jeu peut gérer les morts")
      return
    }

    if (currentGame.status !== "started") {
      setMessage("La partie n’a pas encore commencé")
      return
    }

    const { error: updateError } = await supabase
      .from("players")
      .update({ alive: nextAliveValue })
      .eq("id", playerId)

    if (updateError) {
      console.error(updateError)
      setMessage("Erreur lors de la mise à jour du joueur")
      return
    }

    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, alive: nextAliveValue } : p
    )

    setPlayers(updatedPlayers)

    const winner = computeWinner(updatedPlayers)
    if (winner) {
      await updateGameEnded(currentGame.id, winner)
      setMessage("Partie terminée")
    }
  }

  async function endGameManually(winner) {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Seul le maître du jeu peut terminer la partie")
      return
    }

    await updateGameEnded(currentGame.id, winner)
    setMessage("Partie terminée")
  }

  async function newGame() {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      goToHome()
      return
    }

    const { error: deletePlayersError } = await supabase
      .from("players")
      .delete()
      .eq("game_id", currentGame.id)

    if (deletePlayersError) {
      console.error(deletePlayersError)
      setMessage("Erreur lors de la réinitialisation des joueurs")
      return
    }

    const { error: deleteGameError } = await supabase
      .from("games")
      .delete()
      .eq("id", currentGame.id)
      .eq("host_session_id", mySessionId)

    if (deleteGameError) {
      console.error(deleteGameError)
      setMessage("Erreur lors de la réinitialisation de la partie")
      return
    }

    goToHome()
  }

  useEffect(() => {
    async function restoreSession() {
      const savedGameId = sessionStorage.getItem(STORAGE_KEYS.gameId)
      const savedEntryMode = sessionStorage.getItem(STORAGE_KEYS.entryMode)
      const savedPlayerName = sessionStorage.getItem(STORAGE_KEYS.playerName) || ""
      const savedHostName = sessionStorage.getItem(STORAGE_KEYS.hostName) || ""

      const sessionId = getSessionId()
      setMySessionId(sessionId)

      if (!savedGameId || !savedEntryMode) return

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", savedGameId)
        .single()

      if (gameError || !game) {
        clearPersistedGameSession()
        return
      }

      if (savedEntryMode === "host") {
        if (game.host_session_id !== sessionId) {
          clearPersistedGameSession()
          return
        }

        setHostName(savedHostName || game.host_name || "")
        setEntryMode("host")
        setCurrentGame(game)
        setExpectedPlayers(game.expected_players || 10)
        setExpectedPlayersInput(String(game.expected_players || 10))
        setRoleConfig({
          ...EMPTY_ROLE_CONFIG,
          ...(game.role_config || {}),
        })
        await loadPlayers(game.id)
        return
      }

      if (savedEntryMode === "player") {
        const { data: player, error: playerError } = await supabase
          .from("players")
          .select("*")
          .eq("game_id", game.id)
          .eq("session_id", sessionId)
          .maybeSingle()

        if (playerError || !player) {
          clearPersistedGameSession()
          return
        }

        setPlayerName(savedPlayerName || player.name || "")
        setEntryMode("player")
        setCurrentGame(game)
        setExpectedPlayers(game.expected_players || 10)
        setExpectedPlayersInput(String(game.expected_players || 10))
        setRoleConfig({
          ...EMPTY_ROLE_CONFIG,
          ...(game.role_config || {}),
        })
        await loadPlayers(game.id)
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    if (!currentGame) return

    loadPlayers(currentGame.id)

    const channel = supabase
      .channel(`room-${currentGame.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${currentGame.id}`,
        },
        () => {
          loadPlayers(currentGame.id)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${currentGame.id}`,
        },
        async () => {
          const { data, error } = await supabase
            .from("games")
            .select("*")
            .eq("id", currentGame.id)
            .single()

          if (!error && data) {
            setCurrentGame(data)
            if (data.expected_players) {
              setExpectedPlayers(data.expected_players)
              setExpectedPlayersInput(String(data.expected_players))
            }
            if (data.role_config) {
              setRoleConfig({
                ...EMPTY_ROLE_CONFIG,
                ...data.role_config,
              })
            }
          } else {
            goToHome()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentGame])

  function getRoleAccent(roleKey) {
    if (WOLF_ROLES.includes(roleKey)) {
      return {
        bg: "rgba(210, 66, 255, 0.14)",
        border: "rgba(210, 66, 255, 0.32)",
        text: "#e879f9",
      }
    }

    if (roleKey === "voyante") {
      return {
        bg: "rgba(88, 240, 255, 0.14)",
        border: "rgba(88, 240, 255, 0.32)",
        text: "#67e8f9",
      }
    }

    if (roleKey === "sorciere") {
      return {
        bg: "rgba(244, 114, 182, 0.14)",
        border: "rgba(244, 114, 182, 0.3)",
        text: "#f472b6",
      }
    }

    if (roleKey === "garde") {
      return {
        bg: "rgba(34, 211, 238, 0.14)",
        border: "rgba(34, 211, 238, 0.28)",
        text: "#22d3ee",
      }
    }

    return {
      bg: "rgba(129, 140, 248, 0.12)",
      border: "rgba(129, 140, 248, 0.22)",
      text: "#a5b4fc",
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 50% 18%, rgba(88,240,255,0.18), rgba(6,10,24,0.0) 28%), radial-gradient(circle at 50% 55%, rgba(217,70,239,0.16), rgba(6,10,24,0.0) 30%), linear-gradient(180deg, #050816 0%, #070b1d 35%, #04070f 100%)",
      color: "#f8fafc",
      fontFamily: "Inter, system-ui, sans-serif",
      paddingBottom: "120px",
      position: "relative",
      overflow: "hidden",
    },

    forestGlow: {
      position: "fixed",
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(4,6,16,0.42), rgba(4,6,16,0.76)),
        radial-gradient(circle at 50% 22%, rgba(110,255,241,0.22), rgba(0,0,0,0) 24%),
        radial-gradient(circle at 52% 62%, rgba(236,72,153,0.16), rgba(0,0,0,0) 22%),
        url(${wolfMoon})
      `,
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      opacity: 1,
      pointerEvents: "none",
      filter: "saturate(1.08) contrast(1.02)",
      animation: "ambientFog 7s ease-in-out infinite, floatMoon 10s ease-in-out infinite",
      transformOrigin: "center center",
    },

    mobile: {
      position: "relative",
      zIndex: 1,
      width: "100%",
      maxWidth: "480px",
      margin: "0 auto",
      minHeight: "100vh",
      borderLeft: "1px solid rgba(103,232,249,0.08)",
      borderRight: "1px solid rgba(217,70,239,0.08)",
      background:
        "linear-gradient(180deg, rgba(5,8,22,0.22), rgba(5,8,20,0.34), rgba(4,7,15,0.48))",
      boxShadow:
        "0 30px 80px rgba(0,0,0,0.55), 0 0 42px rgba(56,189,248,0.08), 0 0 62px rgba(217,70,239,0.06)",
      backdropFilter: "blur(4px)",
    },

    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "22px 20px 18px",
      borderBottom: "1px solid rgba(103,232,249,0.10)",
      background: "rgba(5, 8, 20, 0.18)",
      backdropFilter: "blur(8px)",
    },

    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      border: "1px solid rgba(129,140,248,0.18)",
      background: "rgba(255,255,255,0.04)",
      color: "#eef2ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
      animation: "iconOrb 2.8s ease-in-out infinite, neonBorderFlow 4s ease-in-out infinite",
    },

    screen: {
      padding: "20px",
      position: "relative",
      zIndex: 1,
    },

    headingXL: {
      fontSize: 52,
      lineHeight: 1,
      margin: "0 0 16px",
      fontWeight: 800,
      letterSpacing: "-0.04em",
      color: "#e0f2fe",
      textShadow: "0 0 24px rgba(88,240,255,0.08)",
      animation: "titleGlow 3.2s ease-in-out infinite",
    },

    subtitle: {
      color: COLORS.bodyText,
      fontSize: 17,
      lineHeight: 1.65,
      margin: 0,
    },

    labelUpper: {
      fontSize: 12,
      letterSpacing: "0.28em",
      color: "#67e8f9",
      textTransform: "uppercase",
      fontWeight: 700,
      textShadow: "0 0 10px rgba(103,232,249,0.28)",
    },

    glassCard: {
      background:
        "linear-gradient(180deg, rgba(11,16,34,0.82), rgba(8,12,26,0.90))",
      border: "1px solid rgba(109, 120, 255, 0.16)",
      borderRadius: 24,
      padding: 20,
      boxShadow:
        "0 18px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(103,232,249,0.05), 0 0 18px rgba(56,189,248,0.06), 0 0 28px rgba(217,70,239,0.05)",
      backdropFilter: "blur(10px)",
      animation: "neonPulse 4s ease-in-out infinite, neonBorderFlow 5s ease-in-out infinite",
    },

    softCard: {
      background:
        "linear-gradient(180deg, rgba(12,18,38,0.74), rgba(8,12,25,0.84))",
      border: "1px solid rgba(129,140,248,0.12)",
      borderRadius: 20,
      padding: 18,
      boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
      animation: "roleCardGlow 4.5s ease-in-out infinite",
    },

    primaryBtn: {
      width: "100%",
      minHeight: 58,
      borderRadius: 18,
      border: "1px solid rgba(103,232,249,0.18)",
      background:
        "linear-gradient(90deg, #1d4ed8 0%, #2563eb 35%, #7c3aed 70%, #38bdf8 100%)",
      backgroundSize: "200% 100%",
      color: "white",
      fontSize: 17,
      fontWeight: 800,
      letterSpacing: "0.01em",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      boxShadow:
        "0 14px 30px rgba(37,99,235,0.32), 0 0 24px rgba(217,70,239,0.16), 0 0 18px rgba(56,189,248,0.16)",
      cursor: "pointer",
      animation: "shimmer 5s linear infinite, neonPulse 2.8s ease-in-out infinite",
    },

    secondaryBtn: {
      minHeight: 48,
      borderRadius: 16,
      border: "1px solid rgba(129,140,248,0.20)",
      background: "rgba(21, 28, 54, 0.58)",
      color: "#dbeafe",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      cursor: "pointer",
      padding: "0 16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.18), 0 0 16px rgba(56,189,248,0.05)",
      animation: "neonBorderFlow 5s ease-in-out infinite",
    },

    field: {
      width: "100%",
      height: 56,
      borderRadius: 16,
      border: "1px solid rgba(129,140,248,0.16)",
      background: "rgba(255,255,255,0.04)",
      color: "#f8fafc",
      fontSize: 17,
      padding: "0 16px",
      outline: "none",
      boxSizing: "border-box",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },

    badge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      border: "1px solid rgba(103,232,249,0.18)",
      color: "#67e8f9",
      background: "rgba(18, 36, 85, 0.34)",
      padding: "10px 18px",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      boxShadow: "0 8px 22px rgba(0,0,0,0.20)",
      animation: "badgePulse 2.6s ease-in-out infinite, neonBorderFlow 4s ease-in-out infinite",
    },

    sectionTitle: {
      margin: "0 0 14px",
      fontSize: 16,
      fontWeight: 800,
      color: "#d7def7",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      textShadow: "0 0 12px rgba(103,232,249,0.08)",
    },

    bottomNav: {
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 32px)",
      maxWidth: 448,
      background: "rgba(11, 16, 30, 0.88)",
      border: "1px solid rgba(129,140,248,0.12)",
      borderRadius: 26,
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      padding: 12,
      boxShadow:
        "0 20px 50px rgba(0,0,0,0.50), 0 0 26px rgba(56,189,248,0.06), 0 0 34px rgba(217,70,239,0.05)",
      zIndex: 5,
      backdropFilter: "blur(14px)",
      animation: "neonPulse 4.8s ease-in-out infinite",
    },

    navItem: (active) => ({
      minHeight: 58,
      borderRadius: 18,
      border: "none",
      background: active ? "rgba(29,78,216,0.18)" : "transparent",
      color: active ? "#67e8f9" : "#94a3b8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      textTransform: "uppercase",
      boxShadow: active
        ? "inset 0 0 18px rgba(103,232,249,0.10), 0 0 18px rgba(103,232,249,0.06)"
        : "none",
    }),

    cinematicLayer: {
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,
      mixBlendMode: "screen",
    },

    cinematicMoon: {
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,
      background:
        "radial-gradient(circle at 50% 18%, rgba(255,255,255,0.09), rgba(125,211,252,0.08) 8%, rgba(125,211,252,0.02) 18%, rgba(0,0,0,0) 28%)",
      animation: "moonSweep 8s ease-in-out infinite",
    },
  }

  function HeaderBar({ title, onBack, right }) {
    return (
      <div style={styles.topBar}>
        <button onClick={onBack} style={styles.iconBtn}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ fontSize: 17, fontWeight: 800, textShadow: "0 0 12px rgba(103,232,249,0.12)" }}>
          {title}
        </div>
        <button style={styles.iconBtn}>{right}</button>
      </div>
    )
  }

  function MessageBox({ text }) {
    return (
      <div
        className="floating-card"
        style={{
          ...styles.glassCard,
          marginTop: 18,
          color: "#dbeafe",
          borderColor: "rgba(59,130,246,0.3)",
        }}
      >
        {text}
      </div>
    )
  }

  function BottomNav({ items, onPress, columns = 4 }) {
    return (
      <div
        style={{
          ...styles.bottomNav,
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {items.map(({ key, label, icon: Icon, active }) => (
          <button key={key} onClick={() => onPress(key)} style={styles.navItem(active)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    )
  }

  function WinnerButton({ icon: Icon, label, onClick, danger = false }) {
    return (
      <button
        onClick={onClick}
        style={{
          ...styles.softCard,
          minHeight: 128,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          color: danger ? "#ff79c8" : "#f8fafc",
          border: `1px solid ${danger ? "rgba(255,121,200,0.26)" : "rgba(103,232,249,0.16)"}`,
          boxShadow: danger
            ? "0 10px 30px rgba(0,0,0,0.28), 0 0 20px rgba(255,121,200,0.10)"
            : "0 10px 30px rgba(0,0,0,0.28), 0 0 20px rgba(56,189,248,0.08)",
        }}
      >
        <Icon size={30} />
        <span style={{ fontSize: 18, fontWeight: 800 }}>{label}</span>
      </button>
    )
  }

  function PlayersNumberInput() {
    return (
      <input
        type="number"
        min="4"
        max="44"
        inputMode="numeric"
        value={expectedPlayersInput}
        onChange={(e) => {
          setExpectedPlayersInput(e.target.value)
        }}
        onBlur={commitExpectedPlayersInput}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur()
          }
        }}
        style={styles.field}
      />
    )
  }

  function HomeScreen() {
    return (
      <div style={styles.screen} className="screen-enter">
        <div style={{ ...styles.topBar, padding: "24px 0 12px", borderBottom: "none" }}>
          <button style={styles.iconBtn}>
            <Menu size={22} />
          </button>
          <button style={styles.iconBtn}>
            <Settings size={22} />
          </button>
        </div>

        <div style={{ textAlign: "center", padding: "14px 12px 26px" }}>
          <div style={styles.labelUpper}>Le village se réveille</div>

          <h1
            style={{
              ...styles.headingXL,
              marginTop: 18,
              marginBottom: 24,
              color: COLORS.titleBlue,
            }}
          >
            Loup-
            <br />
            Garou
          </h1>

          <p
            style={{
              ...styles.subtitle,
              fontSize: 18,
              maxWidth: 340,
              margin: "0 auto",
              color: COLORS.darkText,
              fontWeight: 500,
            }}
          >
            Ne fais confiance à personne. La nuit tombe sur le village, et la chasse commence.
          </p>
        </div>

        <div style={{ display: "grid", gap: 20, marginTop: 26 }}>
          <button
            onClick={() => {
              setEntryMode("host")
              setMessage("")
            }}
            style={{
              ...styles.glassCard,
              display: "flex",
              alignItems: "center",
              gap: 18,
              textAlign: "left",
              cursor: "pointer",
            }}
            className="floating-card"
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(180deg,#2563eb,#7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 24px rgba(29,78,216,0.35), 0 0 18px rgba(103,232,249,0.16)",
                color: "#fff",
                animation: "iconOrb 2.6s ease-in-out infinite",
              }}
            >
              <Sparkles size={26} />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 6,
                  color: COLORS.primaryBlue,
                  textShadow: "0 0 14px rgba(56,189,248,0.18)",
                }}
              >
                Maître du jeu
              </div>

              <div
                style={{
                  color: COLORS.darkTextSoft,
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Contrôle l’histoire et les rôles
              </div>
            </div>

            <ChevronRight size={28} color="#c7d2fe" />
          </button>

          <button
            onClick={() => {
              setEntryMode("player")
              setMessage("")
            }}
            style={{
              ...styles.glassCard,
              display: "flex",
              alignItems: "center",
              gap: 18,
              textAlign: "left",
              cursor: "pointer",
            }}
            className="floating-card"
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "rgba(17, 24, 39, 0.72)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 0 18px rgba(103,232,249,0.08)",
                animation: "iconOrb 2.6s ease-in-out infinite",
              }}
            >
              <Users size={26} />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 6,
                  color: COLORS.primaryBlue,
                  textShadow: "0 0 14px rgba(56,189,248,0.18)",
                }}
              >
                Entrer comme joueur
              </div>

              <div
                style={{
                  color: COLORS.darkTextSoft,
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Ta survie dépend de ton intuition
              </div>
            </div>

            <ChevronRight size={28} color="#c7d2fe" />
          </button>
        </div>

        {message ? <MessageBox text={message} /> : null}

        <BottomNav
          items={[
            { key: "home", label: "Accueil", icon: Home, active: true },
            { key: "recent", label: "Récent", icon: RotateCcw },
            { key: "profile", label: "Profil", icon: User },
            { key: "trophy", label: "Victoires", icon: Trophy },
          ]}
          onPress={() => {}}
        />
      </div>
    )
  }

  function HostEntryScreen() {
    return (
      <div style={styles.screen} className="screen-enter">
        <HeaderBar title="Créer comme maître du jeu" onBack={goToHome} right={<Settings size={20} />} />

        <div style={{ paddingTop: 18, display: "grid", gap: 18 }}>
          <div>
            <div style={styles.labelUpper}>Maître du jeu</div>
            <h2 style={{ ...styles.headingXL, fontSize: 42, marginTop: 14, color: COLORS.titleBlue }}>
              Créer le salon
            </h2>
          </div>

          <div style={styles.glassCard} className="floating-card">
            <div style={{ display: "grid", gap: 14 }}>
              <input
                type="text"
                placeholder="Nom du maître du jeu"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                style={styles.field}
              />

              <PlayersNumberInput />

              <button onClick={createGameAsHost} style={styles.primaryBtn}>
                <Sparkles size={18} /> Créer la partie
              </button>
            </div>
          </div>

          {message ? <MessageBox text={message} /> : null}
        </div>
      </div>
    )
  }

  function PlayerEntryScreen() {
    return (
      <div style={styles.screen} className="screen-enter">
        <HeaderBar title="Entrer comme joueur" onBack={goToHome} right={<Settings size={20} />} />

        <div style={{ paddingTop: 18, display: "grid", gap: 18 }}>
          <div>
            <div style={styles.labelUpper}>Entre dans la partie</div>
            <h2 style={{ ...styles.headingXL, fontSize: 42, marginTop: 14, color: COLORS.titleBlue }}>
              Rejoindre un salon
            </h2>
          </div>

          <div style={styles.glassCard} className="floating-card">
            <div style={{ display: "grid", gap: 14 }}>
              <input
                type="text"
                placeholder="Ton nom"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={styles.field}
              />
              <input
                type="text"
                placeholder="Code de la partie"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={{ ...styles.field, letterSpacing: "0.18em", textTransform: "uppercase" }}
              />
              <button onClick={joinGameAsPlayer} style={styles.primaryBtn}>
                <Users size={18} /> Rejoindre la partie
              </button>
            </div>
          </div>

          {message ? <MessageBox text={message} /> : null}
        </div>
      </div>
    )
  }

  function HostLobbyScreen() {
    return (
      <div style={styles.screen} className="screen-enter">
        <HeaderBar title="Salon Loup-Garou" onBack={goToHome} right={<Settings size={20} />} />

        <div style={{ textAlign: "center", paddingTop: 12, paddingBottom: 22 }}>
          <div
            style={{
              fontSize: 62,
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: COLORS.titleBlue,
              animation: "titleGlow 2.8s ease-in-out infinite",
            }}
          >
            {currentGame.code}
          </div>
          <div style={{ ...styles.sectionTitle, marginTop: 10, marginBottom: 0 }}>
            Code de la partie
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={styles.glassCard} className="floating-card">
            <div style={{ color: "#d7def7", fontSize: 15, marginBottom: 10 }}>Joueurs connectés</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 54, fontWeight: 800, textShadow: "0 0 16px rgba(103,232,249,0.10)" }}>
                {players.length}/{expectedPlayers}
              </div>
              <div style={{ display: "flex", marginLeft: 6 }}>
                {players.slice(0, 3).map((player, index) => (
                  <div
                    key={player.id}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: "linear-gradient(180deg,#1436a5,#0f246d)",
                      border: "2px solid #081121",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: index === 0 ? 0 : -8,
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: "0 0 16px rgba(56,189,248,0.12)",
                      animation: "iconOrb 2.8s ease-in-out infinite",
                    }}
                  >
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.glassCard} className="floating-card">
            <div style={{ color: "#d7def7", fontSize: 15, marginBottom: 12 }}>
              Nombre total de joueurs (4–44)
            </div>
            <PlayersNumberInput />
          </div>

          <div style={{ ...styles.glassCard, padding: 0, overflow: "hidden" }} className="floating-card">
            <div
              style={{
                padding: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800 }}>Configuration des rôles</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    const suggested = generateSuggestedRoles(expectedPlayers)
                    setRoleConfig(suggested)
                    setMessage("Composition intelligente générée")
                  }}
                  style={styles.secondaryBtn}
                >
                  <Sparkles size={16} /> Composition auto
                </button>
                <button
                  onClick={() => {
                    setRoleConfig({ ...EMPTY_ROLE_CONFIG })
                    setMessage("Rôles réinitialisés")
                  }}
                  style={styles.secondaryBtn}
                >
                  <RotateCcw size={16} /> Réinitialiser
                </button>
              </div>
            </div>

            <div>
              {Object.keys(roleConfig)
                .filter(
                  (roleKey) =>
                    roleConfig[roleKey] > 0 ||
                    ["loup", "voyante", "sorciere", "garde", "chasseur", "villageois"].includes(
                      roleKey
                    )
                )
                .map((roleKey) => {
                  const accent = getRoleAccent(roleKey)
                  return (
                    <div
                      key={roleKey}
                      style={{
                        padding: "18px 20px",
                        borderTop: "1px solid rgba(148,163,184,0.1)",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: accent.bg,
                            border: `1px solid ${accent.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: accent.text,
                            fontWeight: 900,
                            boxShadow: `0 0 16px ${accent.border}`,
                            animation: "iconOrb 2.4s ease-in-out infinite",
                          }}
                        >
                          {ROLE_LABELS[roleKey].slice(0, 1)}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{ROLE_LABELS[roleKey]}</div>
                          <div style={{ color: "#b8c3e0", fontSize: 13 }}>
                            {WOLF_ROLES.includes(roleKey) ? "Camp des loups" : "Village"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                          onClick={() => changeRoleCount(roleKey, -1)}
                          disabled={roleConfig[roleKey] <= 0}
                          style={{
                            ...styles.iconBtn,
                            width: 40,
                            height: 40,
                            opacity: roleConfig[roleKey] <= 0 ? 0.4 : 1,
                          }}
                        >
                          −
                        </button>
                        <div
                          style={{
                            width: 24,
                            textAlign: "center",
                            fontSize: 24,
                            fontWeight: 800,
                            textShadow: "0 0 12px rgba(103,232,249,0.10)",
                          }}
                        >
                          {roleConfig[roleKey]}
                        </div>
                        <button
                          onClick={() => changeRoleCount(roleKey, 1)}
                          disabled={roleConfig[roleKey] >= getRoleMaxCount(roleKey)}
                          style={{
                            ...styles.iconBtn,
                            width: 40,
                            height: 40,
                            background: "linear-gradient(180deg, #2563eb, #7c3aed)",
                            border: "none",
                            opacity:
                              roleConfig[roleKey] >= getRoleMaxCount(roleKey) ? 0.45 : 1,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div
              style={{
                padding: 20,
                borderTop: "1px solid rgba(148,163,184,0.1)",
                color: "#67e8f9",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 10,
                textShadow: "0 0 12px rgba(103,232,249,0.18)",
              }}
            >
              <UserPlus size={18} /> Ajouter des rôles
            </div>
          </div>

          <div>
            <div style={styles.sectionTitle}>Joueurs dans le salon</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[{ name: currentGame.host_name, host: true }, ...players].map((player, index) => (
                <div
                  key={`${player.name}-${index}`}
                  className="player-reveal"
                  style={{
                    ...getPlayerRevealStyle(index),
                    borderRadius: 999,
                    border: "1px solid rgba(59,130,246,0.32)",
                    padding: "10px 14px",
                    background: "rgba(15,23,42,0.6)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 0 14px rgba(56,189,248,0.06)",
                    animation: `playersReveal 420ms cubic-bezier(0.22, 1, 0.36, 1) both, neonBorderFlow 4.5s ease-in-out infinite`,
                    animationDelay: `${index * 70}ms, 0ms`,
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      background: "#22c55e",
                      display: "inline-block",
                      boxShadow: "0 0 10px rgba(34,197,94,0.6)",
                    }}
                  />
                  <span>
                    {player.name}
                    {player.host ? " (Hôte)" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <button
              onClick={saveHostConfiguration}
              style={{ ...styles.secondaryBtn, width: "100%", minHeight: 58 }}
            >
              Sauvegarder la configuration
            </button>
            <button onClick={startGame} style={styles.primaryBtn}>
              <Play size={18} /> LANCER LA PARTIE
            </button>
          </div>

          <div
            style={{
              textAlign: "center",
              color: totalConfiguredRoles === expectedPlayers ? "#22c55e" : "#f59e0b",
              fontWeight: 700,
              textShadow:
                totalConfiguredRoles === expectedPlayers
                  ? "0 0 12px rgba(34,197,94,0.25)"
                  : "0 0 12px rgba(245,158,11,0.18)",
            }}
          >
            Rôles configurés : {totalConfiguredRoles} / {expectedPlayers}
          </div>

          {message ? <MessageBox text={message} /> : null}
        </div>
      </div>
    )
  }

  function HostGameScreen() {
    const ended = currentGame.status === "ended"
    const chipLabel =
      currentGame.phase === "night"
        ? `Nuit ${currentGame.night_number || 1}`
        : currentGame.phase === "day"
          ? `Jour ${currentGame.day_number || 1}`
          : getPhaseLabel(currentGame.phase)

    return (
      <div style={styles.screen} className="screen-enter">
        <div style={styles.topBar}>
          <button onClick={goToHome} style={styles.iconBtn}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Loup-Garou</div>
            <div style={{ color: "#67e8f9", fontWeight: 700, textShadow: "0 0 12px rgba(103,232,249,0.16)" }}>
              SALON : {currentGame.code}
            </div>
          </div>
          <div style={styles.badge}>{chipLabel}</div>
        </div>

        <div style={{ paddingTop: 24, display: "grid", gap: 22 }}>
          <div style={styles.glassCard} className="floating-card">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 20,
                  background: "linear-gradient(180deg,#2563eb,#7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 14px 30px rgba(29,78,216,0.28), 0 0 24px rgba(103,232,249,0.16)",
                  color: "#fff",
                  animation: "iconOrb 2.6s ease-in-out infinite",
                }}
              >
                <Moon size={34} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                  {getPhaseHeadline(currentGame.phase)}
                </div>
                <div style={{ color: "#b8c3e0", fontSize: 16, lineHeight: 1.55 }}>
                  {getPhaseSubtext(currentGame.phase)}
                </div>
              </div>
            </div>

            {!ended ? (
              <button onClick={goToNextPhase} style={{ ...styles.primaryBtn, marginTop: 22 }}>
                Phase suivante <ChevronRight size={18} />
              </button>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={styles.sectionTitle}>Joueurs ({players.length})</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["all", "alive", "dead"].map((filterValue) => (
                <button
                  key={filterValue}
                  onClick={() => setPlayerFilter(filterValue)}
                  style={{
                    ...styles.secondaryBtn,
                    minHeight: 40,
                    padding: "0 12px",
                    background:
                      playerFilter === filterValue
                        ? "rgba(29,78,216,0.24)"
                        : "rgba(255,255,255,0.04)",
                  }}
                >
                  {FILTER_LABELS[filterValue]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {filteredPlayers.map((player, index) => {
              const accent = getRoleAccent(player.role)
              return (
                <div
                  key={player.id}
                  className="player-reveal"
                  style={{
                    ...styles.softCard,
                    ...getPlayerRevealStyle(index),
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 29,
                          background: player.alive
                            ? "linear-gradient(180deg,#dbeafe,#93c5fd)"
                            : "linear-gradient(180deg,#475569,#1e293b)",
                          color: "#0f172a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                          fontWeight: 900,
                          boxShadow: player.alive
                            ? "0 0 18px rgba(103,232,249,0.18)"
                            : "0 0 10px rgba(148,163,184,0.08)",
                        }}
                      >
                        {player.name.slice(0, 1).toUpperCase()}
                      </div>
                      <span
                        style={{
                          position: "absolute",
                          right: -2,
                          bottom: -2,
                          width: 16,
                          height: 16,
                          borderRadius: 16,
                          background: player.alive ? "#22c55e" : "#6b7280",
                          border: "2px solid #0b1220",
                          boxShadow: player.alive
                            ? "0 0 10px rgba(34,197,94,0.6)"
                            : "none",
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            textDecoration: player.alive ? "none" : "line-through",
                            opacity: player.alive ? 1 : 0.6,
                          }}
                        >
                          {player.name}
                        </span>
                        <span
                          style={{
                            borderRadius: 8,
                            padding: "5px 8px",
                            background: accent.bg,
                            color: accent.text,
                            fontSize: 12,
                            fontWeight: 800,
                            border: `1px solid ${accent.border}`,
                            boxShadow: `0 0 14px ${accent.border}`,
                          }}
                        >
                          {ROLE_LABELS[player.role] || "Inconnu"}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          color: player.alive ? "#b8c3e0" : "#ef4444",
                          fontSize: 16,
                        }}
                      >
                        {player.alive ? "Vivant" : "Mort"}
                      </div>
                    </div>
                  </div>

                  {!ended ? (
                    <button
                      onClick={() => markPlayerDead(player.id, !player.alive)}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        border: `1px solid ${
                          player.alive ? "rgba(239,68,68,0.32)" : "rgba(34,197,94,0.32)"
                        }`,
                        background: player.alive
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(34,197,94,0.08)",
                        color: player.alive ? "#ff6b6b" : "#22c55e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: player.alive
                          ? "0 0 16px rgba(239,68,68,0.12)"
                          : "0 0 16px rgba(34,197,94,0.12)",
                        animation: "neonBorderFlow 4s ease-in-out infinite",
                      }}
                    >
                      {player.alive ? <UserMinus size={24} /> : <UserPlus size={24} />}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div>
            <div style={styles.sectionTitle}>Fin manuelle de partie</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <WinnerButton icon={Home} label="Village" onClick={() => endGameManually("Le village gagne")} />
              <WinnerButton
                icon={Users}
                label="Loups"
                onClick={() => endGameManually("Les loups gagnent")}
                danger
              />
              <WinnerButton icon={Heart} label="Amoureux" onClick={() => endGameManually("Les amoureux gagnent")} />
              <WinnerButton
                icon={Flame}
                label="Pyromane"
                onClick={() => endGameManually("Le pyromane gagne")}
              />
            </div>
          </div>

          {ended ? (
            <div
              style={{
                ...styles.glassCard,
                color: "#fca5a5",
                fontWeight: 800,
                textShadow: "0 0 12px rgba(252,165,165,0.16)",
              }}
            >
              Partie terminée{currentGame.winner ? ` — ${currentGame.winner}` : ""}
            </div>
          ) : null}

          <button onClick={newGame} style={{ ...styles.secondaryBtn, width: "100%", minHeight: 58 }}>
            Nouvelle partie
          </button>

          {message ? <MessageBox text={message} /> : null}
        </div>

        <BottomNav
          items={[
            { key: "game", label: "Jeu", icon: Moon, active: activeHostTab === "game" },
            { key: "roles", label: "Rôles", icon: Shield, active: activeHostTab === "roles" },
            { key: "log", label: "Journal", icon: RotateCcw, active: activeHostTab === "log" },
            { key: "setup", label: "Réglages", icon: Settings, active: activeHostTab === "setup" },
          ]}
          onPress={setActiveHostTab}
        />
      </div>
    )
  }

  function PlayerLobbyScreen() {
    return (
      <div style={styles.screen} className="screen-enter">
        <HeaderBar title="Loup-Garou" onBack={goToHome} right={<Settings size={20} />} />

        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <div style={styles.badge}>Salon de jeu</div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 900,
              letterSpacing: "0.06em",
              marginTop: 20,
              color: COLORS.titleBlue,
              animation: "titleGlow 3s ease-in-out infinite",
            }}
          >
            {currentGame.code}
          </div>
          <div style={{ marginTop: 10, color: "#b8c3e0", fontSize: 18 }}>
            Hôte : <span style={{ color: "#67e8f9", textShadow: "0 0 12px rgba(103,232,249,0.16)" }}>{currentGame.host_name}</span>
          </div>
        </div>

        <div style={{ paddingTop: 20, display: "grid", gap: 18 }}>
          <div style={{ ...styles.glassCard, textAlign: "center", padding: 28 }} className="floating-card">
            <div
              style={{
                width: 86,
                height: 86,
                borderRadius: 999,
                margin: "0 auto 20px",
                border: "6px solid rgba(29,78,216,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#67e8f9",
                boxShadow: "0 0 24px rgba(56,189,248,0.12)",
                animation: "iconOrb 2.6s ease-in-out infinite",
              }}
            >
              <RotateCcw size={32} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4 }}>
              En attente du début de la partie...
            </div>
            <div style={{ color: "#b8c3e0", fontSize: 18, lineHeight: 1.6, marginTop: 12 }}>
              Le maître du jeu va bientôt lancer la session. Prépare-toi pour la chasse.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Joueurs connectés</div>
            <div style={{ ...styles.badge, padding: "8px 14px" }}>
              {players.length}/{currentGame.expected_players}
            </div>
          </div>

          <div style={{ ...styles.glassCard, padding: 0, overflow: "hidden" }}>
            {[{ name: currentGame.host_name, subtitle: "HÔTE", alive: true }, ...players].map(
              (player, index) => (
                <div
                  key={`${player.name}-${index}`}
                  className="player-reveal"
                  style={{
                    ...getPlayerRevealStyle(index),
                    padding: "18px 20px",
                    borderTop: index === 0 ? "none" : "1px solid rgba(148,163,184,0.1)",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        background: "rgba(30,64,175,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#93c5fd",
                        boxShadow: "0 0 14px rgba(103,232,249,0.10)",
                        animation: "iconOrb 2.8s ease-in-out infinite",
                      }}
                    >
                      <User size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>{player.name}</div>
                      <div
                        style={{
                          color: player.subtitle ? "#67e8f9" : "#b8c3e0",
                          fontSize: 14,
                        }}
                      >
                        {player.subtitle || "Prêt"}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: "#22c55e",
                      display: "inline-block",
                      boxShadow: "0 0 10px rgba(34,197,94,0.6)",
                    }}
                  />
                </div>
              )
            )}
          </div>

          {isRealHost ? (
            <button onClick={startGame} style={styles.primaryBtn}>
              <Play size={18} /> LANCER LA PARTIE
            </button>
          ) : (
            <button style={{ ...styles.primaryBtn, opacity: 0.6 }} disabled>
              En attente du maître du jeu
            </button>
          )}

          <button style={{ ...styles.secondaryBtn, width: "100%", minHeight: 58 }}>
            Inviter des amis
          </button>

          {message ? <MessageBox text={message} /> : null}
        </div>
      </div>
    )
  }

  function PlayerGameScreen() {
    const roleAccent = getRoleAccent(me?.role)
    const phaseLabel =
      currentGame.phase === "night"
        ? `NUIT ${currentGame.night_number || 1}`
        : currentGame.phase === "day"
          ? `JOUR ${currentGame.day_number || 1}`
          : getPhaseLabel(currentGame.phase).toUpperCase()

    return (
      <div style={styles.screen} className="screen-enter">
        <div style={{ ...styles.topBar, justifyContent: "center", position: "relative" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{phaseLabel}</div>
            <div style={{ color: "#67e8f9", fontSize: 16, fontWeight: 700, marginTop: 4, textShadow: "0 0 12px rgba(103,232,249,0.16)" }}>
              {getPhaseLabel(currentGame.phase).toUpperCase()}
            </div>
          </div>
          <div style={{ position: "absolute", left: 20 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 18,
                background: "rgba(29,78,216,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#67e8f9",
                boxShadow: "0 0 18px rgba(103,232,249,0.12)",
                animation: "iconOrb 2.6s ease-in-out infinite",
              }}
            >
              <Moon size={24} />
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 26 }}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ ...styles.sectionTitle, marginBottom: 10 }}>Identité secrète</div>
            <h2 style={{ ...styles.headingXL, fontSize: 32, margin: 0, color: COLORS.titleBlue }}>
              Ton rôle
            </h2>
          </div>

          <div style={{ ...styles.glassCard, padding: 24 }} className="floating-card">
            <div
              style={{
                borderRadius: 24,
                minHeight: 320,
                background:
                  "linear-gradient(180deg, rgba(22,48,122,0.42), rgba(86,25,132,0.20), rgba(8,16,40,0.58))",
                border: "1px solid rgba(59,130,246,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 140,
                boxShadow: "inset 0 0 30px rgba(56,189,248,0.06), 0 0 24px rgba(56,189,248,0.08)",
                animation: "neonPulse 3.4s ease-in-out infinite, neonBorderFlow 4.8s ease-in-out infinite",
              }}
            >
              {me?.role
                ? WOLF_ROLES.includes(me.role)
                  ? "🐺"
                  : me.role === "voyante"
                    ? "🔮"
                    : me.role === "sorciere"
                      ? "🧪"
                      : me.role === "chasseur"
                        ? "🏹"
                        : me.role === "garde"
                          ? "🛡️"
                          : "🧑"
                : "🎭"}
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <div style={{ ...styles.labelUpper, color: roleAccent.text }}>Ton camp</div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  marginTop: 14,
                  color: COLORS.titleBlue,
                  textShadow: `0 0 18px ${roleAccent.border}`,
                }}
              >
                {ROLE_LABELS[me?.role] || "Rôle inconnu"}
              </div>
              <div
                style={{
                  width: 70,
                  height: 2,
                  background: "rgba(103,232,249,0.6)",
                  margin: "18px auto 24px",
                  boxShadow: "0 0 12px rgba(103,232,249,0.5)",
                }}
              />
              <p style={{ ...styles.subtitle, fontSize: 18, color: COLORS.darkText }}>
                {ROLE_DESCRIPTIONS[me?.role] || "Ton destin sera bientôt révélé."}
              </p>
            </div>

            <div
              style={{
                marginTop: 24,
                borderRadius: 18,
                background: "rgba(10, 18, 38, 0.72)",
                border: "1px solid rgba(59,130,246,0.16)",
                padding: 18,
                boxShadow: "0 0 18px rgba(56,189,248,0.06)",
                animation: "neonBorderFlow 5s ease-in-out infinite",
              }}
            >
              <div style={{ ...styles.sectionTitle, marginBottom: 10, color: "#67e8f9" }}>
                Ton objectif
              </div>
              <div style={{ color: "#dbeafe", lineHeight: 1.7 }}>
                {WOLF_ROLES.includes(me?.role)
                  ? "Travaille avec les loups, évite les soupçons et élimine le village jusqu’à ce que ton camp prenne le contrôle."
                  : me?.role === "pyromane"
                    ? "Survis à tout le monde et deviens le dernier survivant."
                    : "Aide le village à démasquer le mal caché et survis jusqu’à la victoire de ton camp."}
              </div>
            </div>
          </div>

          <div style={{ ...styles.glassCard, marginTop: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Statut</div>
            <div style={{ marginTop: 8, color: me?.alive ? "#4ade80" : "#f87171", fontWeight: 700 }}>
              Tu es actuellement {me?.alive ? "vivant" : "mort"}
            </div>
            {currentGame.status === "ended" ? (
              <div style={{ marginTop: 10, color: "#fca5a5", fontWeight: 700 }}>
                Vainqueur : {currentGame.winner || "Inconnu"}
              </div>
            ) : null}
          </div>

          {message ? <MessageBox text={message} /> : null}
        </div>

        <BottomNav
          items={[
            { key: "profil", label: "Profil", icon: User, active: activePlayerTab === "profil" },
            {
              key: "historique",
              label: "Historique",
              icon: Shield,
              active: activePlayerTab === "historique",
            },
            {
              key: "cimetiere",
              label: "Cimetière",
              icon: Skull,
              active: activePlayerTab === "cimetiere",
            },
          ]}
          onPress={setActivePlayerTab}
          columns={3}
        />
      </div>
    )
  }

  function renderScreen() {
    if (!currentGame) {
      if (entryMode === "host") return <HostEntryScreen />
      if (entryMode === "player") return <PlayerEntryScreen />
      return <HomeScreen />
    }

    const isLobby = currentGame.status === "lobby"
    const isStarted = currentGame.status === "started"
    const isEnded = currentGame.status === "ended"

    if (isRealHost && isLobby) return <HostLobbyScreen />
    if (isRealHost && (isStarted || isEnded)) return <HostGameScreen />
    if (isLobby) return <PlayerLobbyScreen />
    return <PlayerGameScreen />
  }

  return (
    <div style={styles.page}>
      <GlobalAnimations />
      <div style={styles.forestGlow} />
      <div
        style={{
          ...styles.cinematicLayer,
          background: phaseCinematic.overlay,
          animation: phaseCinematic.animation,
        }}
      />
      <div style={styles.cinematicMoon} />
      <div style={styles.mobile}>{renderScreen()}</div>
    </div>
  )
}

export default App