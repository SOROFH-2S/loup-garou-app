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
import wolfMoon from "./assets/wolf-moon.png"

const ROLE_LABELS = {
  loup: "Werewolf",
  sorciere: "Witch",
  voyante: "Seer",
  chasseur: "Hunter",
  petite_fille: "Little Girl",
  cupidon: "Cupidon",
  pyromane: "Pyromaniac",
  villageois: "Villager",
  renard: "Fox",
  corbeau: "Crow",
  ancien: "Elder",
  enfant_sauvage: "Wild Child",
  petit_chaperon_rouge: "Red Riding Hood",
  ange_dechu: "Fallen Angel",
  chevalier_epee_rouillee: "Rusty Knight",
  loup_blanc: "White Wolf",
  loup_infecte: "Infected Wolf",
  grand_mechant_loup: "Big Bad Wolf",
  garde: "Guardian",
  frere_1: "Brother 1",
  frere_2: "Brother 2",
  soeur_1: "Sister 1",
  soeur_2: "Sister 2",
  soeur_3: "Sister 3",
  loup_bavard: "Talkative Wolf",
  vagabond: "Wanderer",
}

const ROLE_DESCRIPTIONS = {
  loup: "Each night, you wake up with your fellow wolves to choose a victim to eliminate from the village.",
  sorciere:
    "You have one healing potion and one poison potion. Each can be used only once during the game and only at night.",
  voyante: "Every night, you may discover the true identity of one player.",
  chasseur:
    "When you die, you may immediately shoot one player with your final bullet.",
  petite_fille:
    "You may secretly observe the werewolves at night. If you are noticed, you risk becoming their victim.",
  cupidon:
    "At the beginning of the game, you create a pair of lovers. They must survive together to win.",
  pyromane:
    "You play alone. You may oil players first, then burn them later. You win if you become the last survivor.",
  villageois: "You have no special power. Your strength is discussion, intuition, and voting.",
  renard:
    "At night, you target a player. If no wolf is found among that player and both neighbors, you lose your power.",
  corbeau:
    "Each night, you can give two extra votes to a player for the next village vote.",
  ancien:
    "You survive the first attack from the wolves. If the village executes you, the villagers lose their powers.",
  enfant_sauvage:
    "You choose a model player at the start. If that player dies, you become a wolf.",
  petit_chaperon_rouge:
    "You are immune to wolves as long as the hunter is still alive.",
  ange_dechu:
    "You win alone if the village eliminates you during the first council. Otherwise you become a simple villager.",
  chevalier_epee_rouillee:
    "When you die, the first wolf to your left dies as well.",
  loup_blanc: "A special wolf with a personal objective, often to become the last survivor.",
  loup_infecte:
    "Once in the game, you can infect a victim and turn them into a wolf instead of killing them.",
  grand_mechant_loup:
    "A special wolf role with advanced power depending on the chosen variant.",
  garde:
    "Each night, you may protect one player, including yourself, but not the same target two nights in a row.",
  frere_1: "You belong to the brothers group and play for the village.",
  frere_2: "You belong to the brothers group and play for the village.",
  soeur_1: "You belong to the sisters group and play for the village.",
  soeur_2: "You belong to the sisters group and play for the village.",
  soeur_3: "You belong to the sisters group and play for the village.",
  loup_bavard: "A wolf with a communication rule depending on the selected game variant.",
  vagabond:
    "Each night, you sleep at someone else's house. That player becomes immune for the night.",
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
  lobby: "Game Lobby",
  setup: "Preparation",
  night: "Night",
  night_resolve: "Night Resolve",
  day: "Day",
  vote: "Village Vote",
  vote_resolve: "Vote Resolve",
  ended: "Game Ended",
}

const PHASE_HEADLINES = {
  setup: "The game begins",
  night: "Wolves are waking up...",
  night_resolve: "Night results are being resolved",
  day: "The village awakes",
  vote: "Village voting time",
  vote_resolve: "Vote results are being resolved",
  ended: "The story has ended",
}

const PHASE_SUBTEXT = {
  setup: "The host is preparing the first cycle of the game.",
  night: "Waiting for the werewolves to select their target for the night.",
  night_resolve: "The host is resolving all night actions and consequences.",
  day: "Discuss, observe, and decide who may be hiding in the shadows.",
  vote: "The village must now choose who to eliminate.",
  vote_resolve: "The final decision of the village is being applied.",
  ended: "One side has won. Review the survivors and the fallen.",
}

const WOLF_ROLES = ["loup", "loup_blanc", "loup_infecte", "grand_mechant_loup", "loup_bavard"]

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
  const [activePlayerTab, setActivePlayerTab] = useState("profile")
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

  function persistGameSession({ gameId, mode, playerNameValue = "", hostNameValue = "" }) {
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
    setActiveHostTab("game")
    setActivePlayerTab("profile")
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
    return PHASE_LABELS[phase] || phase || "Unknown phase"
  }

  function getPhaseHeadline(phase) {
    return PHASE_HEADLINES[phase] || "Game in progress"
  }

  function getPhaseSubtext(phase) {
    return PHASE_SUBTEXT[phase] || "The host is coordinating the next step of the story."
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
      setMessage("Only the game master can change phase")
      return
    }
    if (currentGame.status !== "started") {
      setMessage("The game must be started first")
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
      setMessage("Error while changing phase")
      return
    }

    setCurrentGame(data)
    setMessage(`Current phase: ${getPhaseLabel(data.phase)}`)
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

    if (pyromane.length === 1 && alivePlayers.length === 1) return "The pyromaniac wins"
    if (wolves.length === 0 && alivePlayers.length > 0) return "The village wins"
    if (villageCampRoles.length === 0 && wolves.length > 0) return "The wolves win"
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
      setMessage("Error while ending the game")
    }
  }

  async function createGameAsHost() {
    setMessage("")

    if (!hostName.trim()) {
      setMessage("Enter the host name")
      return
    }

    if (expectedPlayers < 4) {
      setMessage("Minimum number of players is 4")
      return
    }

    if (expectedPlayers > 44) {
      setMessage("Maximum number of players is 44")
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
          expected_players: expectedPlayers,
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
      setMessage("Error while creating the game")
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
    setRoleConfig({
      ...EMPTY_ROLE_CONFIG,
      ...(game.role_config || {}),
    })
    setMessage("Game created successfully")
    await loadPlayers(game.id)
  }

  async function joinGameAsPlayer() {
    setMessage("")

    if (!playerName.trim()) {
      setMessage("Enter your name")
      return
    }

    if (!joinCode.trim()) {
      setMessage("Enter the game code")
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
      setMessage("Error while searching for the game")
      return
    }

    if (!games || games.length === 0) {
      setMessage("Game not found")
      return
    }

    const game = games[0]

    if (game.host_session_id === sessionId) {
      setMessage(
        "This browser is already the host session. Use another device, private tab, or another browser to join as a player."
      )
      return
    }

    const { data: existingPlayers, error: playersError } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", game.id)

    if (playersError) {
      console.error(playersError)
      setMessage("Error while checking existing players")
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
      setRoleConfig({
        ...EMPTY_ROLE_CONFIG,
        ...(game.role_config || {}),
      })
      setMessage("Session restored in the game")
      await loadPlayers(game.id)
      return
    }

    if (game.status !== "lobby") {
      setMessage("The game has already started or ended")
      return
    }

    if (existingPlayers.length >= game.expected_players) {
      setMessage("This game is full")
      return
    }

    const duplicateName = existingPlayers.some(
      (p) => normalizeName(p.name) === normalizeName(playerName)
    )

    if (duplicateName) {
      setMessage("This name is already used in the game")
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
      setMessage("Error while adding the player")
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
    setRoleConfig({
      ...EMPTY_ROLE_CONFIG,
      ...(game.role_config || {}),
    })
    setMessage("You joined the game successfully")
    await loadPlayers(game.id)
  }

  async function saveHostConfiguration() {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Only the game master can edit the configuration")
      return
    }

    if (expectedPlayers < 4 || expectedPlayers > 44) {
      setMessage("The total number of players must be between 4 and 44")
      return
    }

    if (totalConfiguredRoles !== expectedPlayers) {
      setMessage("The total amount of roles must equal the number of expected players")
      return
    }

    const { data, error } = await supabase
      .from("games")
      .update({
        expected_players: expectedPlayers,
        role_config: roleConfig,
      })
      .eq("id", currentGame.id)
      .eq("host_session_id", mySessionId)
      .select()
      .single()

    if (error) {
      console.error(error)
      setMessage("Error while saving configuration")
      return
    }

    setCurrentGame(data)
    setMessage("Configuration saved")
  }

  async function startGame() {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Only the game master can start the game")
      return
    }

    if (totalConfiguredRoles !== expectedPlayers) {
      setMessage("The total amount of roles must equal the number of expected players")
      return
    }

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", currentGame.id)
      .order("joined_at", { ascending: true })

    if (playersError) {
      console.error(playersError)
      setMessage("Error while loading players")
      return
    }

    if (!playersData || playersData.length !== currentGame.expected_players) {
      setMessage("The number of connected players must match the configured total")
      return
    }

    const config = currentGame.role_config || {}
    const roles = []

    Object.keys(config).forEach((roleKey) => {
      const count = config[roleKey] || 0
      for (let i = 0; i < count; i += 1) {
        roles.push(roleKey)
      }
    })

    if (roles.length !== currentGame.expected_players) {
      setMessage("The role composition is invalid")
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
        setMessage("Error while assigning roles")
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
      })
      .eq("id", currentGame.id)
      .eq("host_session_id", mySessionId)
      .select()
      .single()

    if (gameError) {
      console.error(gameError)
      setMessage("Error while starting the game")
      return
    }

    setCurrentGame(updatedGame)
    setMessage("The game has started")
  }

  async function markPlayerDead(playerId, nextAliveValue) {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Only the game master can manage deaths")
      return
    }

    if (currentGame.status !== "started") {
      setMessage("The game has not started yet")
      return
    }

    const { error: updateError } = await supabase
      .from("players")
      .update({ alive: nextAliveValue })
      .eq("id", playerId)

    if (updateError) {
      console.error(updateError)
      setMessage("Error while updating the player")
      return
    }

    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, alive: nextAliveValue } : p
    )

    setPlayers(updatedPlayers)

    const winner = computeWinner(updatedPlayers)
    if (winner) {
      await updateGameEnded(currentGame.id, winner)
      setMessage("Game ended")
    }
  }

  async function endGameManually(winner) {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Only the game master can end the game")
      return
    }

    await updateGameEnded(currentGame.id, winner)
    setMessage("Game ended")
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
      setMessage("Error while resetting players")
      return
    }

    const { error: deleteGameError } = await supabase
      .from("games")
      .delete()
      .eq("id", currentGame.id)
      .eq("host_session_id", mySessionId)

    if (deleteGameError) {
      console.error(deleteGameError)
      setMessage("Error while resetting game")
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
            if (data.expected_players) setExpectedPlayers(data.expected_players)
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
    if (WOLF_ROLES.includes(roleKey)) return { bg: "rgba(27,78,255,0.18)", border: "rgba(27,78,255,0.35)", text: "#2f6bff" }
    if (roleKey === "voyante") return { bg: "rgba(102,112,255,0.14)", border: "rgba(102,112,255,0.3)", text: "#94a3ff" }
    if (roleKey === "sorciere") return { bg: "rgba(236,72,153,0.14)", border: "rgba(236,72,153,0.3)", text: "#f472b6" }
    if (roleKey === "garde") return { bg: "rgba(16,185,129,0.14)", border: "rgba(16,185,129,0.28)", text: "#34d399" }
    return { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.22)", text: "#94a3b8" }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, rgba(20,42,120,0.35), rgba(4,10,26,0.96) 45%), #040916",
      color: "#f8fafc",
      fontFamily: "Inter, system-ui, sans-serif",
      paddingBottom: "120px",
      position: "relative",
      overflow: "hidden",
    },
    forestGlow: {
      position: "fixed",
      inset: 0,
      backgroundImage: `linear-gradient(rgba(4,10,26,0.5), rgba(4,10,26,0.95)), url(${wolfMoon})`,
      backgroundSize: "cover",
      backgroundPosition: "center bottom",
      opacity: 0.18,
      pointerEvents: "none",
    },
    mobile: {
      position: "relative",
      zIndex: 1,
      width: "100%",
      maxWidth: "480px",
      margin: "0 auto",
      minHeight: "100vh",
      borderLeft: "1px solid rgba(148,163,184,0.12)",
      borderRight: "1px solid rgba(148,163,184,0.12)",
      background: "linear-gradient(180deg, rgba(5,10,28,0.92), rgba(5,10,24,0.98))",
      boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
    },
    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "22px 20px 18px",
      borderBottom: "1px solid rgba(148,163,184,0.14)",
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      border: "1px solid rgba(148,163,184,0.18)",
      background: "rgba(255,255,255,0.03)",
      color: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    },
    screen: {
      padding: "20px",
    },
    headingXL: {
      fontSize: 52,
      lineHeight: 1,
      margin: "0 0 16px",
      fontWeight: 800,
      letterSpacing: "-0.04em",
    },
    headingLG: {
      fontSize: 24,
      fontWeight: 750,
      lineHeight: 1.15,
      margin: 0,
    },
    labelUpper: {
      fontSize: 12,
      letterSpacing: "0.28em",
      color: "#2f6bff",
      textTransform: "uppercase",
      fontWeight: 700,
    },
    subtitle: {
      color: "#94a3b8",
      fontSize: 17,
      lineHeight: 1.65,
      margin: 0,
    },
    glassCard: {
      background: "linear-gradient(180deg, rgba(18,26,48,0.92), rgba(10,17,35,0.95))",
      border: "1px solid rgba(74,95,148,0.32)",
      borderRadius: 24,
      padding: 20,
      boxShadow: "0 16px 40px rgba(2,8,23,0.45)",
    },
    softCard: {
      background: "linear-gradient(180deg, rgba(18,26,48,0.8), rgba(12,18,34,0.84))",
      border: "1px solid rgba(148,163,184,0.14)",
      borderRadius: 20,
      padding: 18,
    },
    primaryBtn: {
      width: "100%",
      minHeight: 58,
      borderRadius: 18,
      border: "none",
      background: "linear-gradient(180deg, #1f4dff, #1741d0)",
      color: "white",
      fontSize: 17,
      fontWeight: 800,
      letterSpacing: "0.01em",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      boxShadow: "0 14px 28px rgba(29,78,216,0.35)",
      cursor: "pointer",
    },
    secondaryBtn: {
      minHeight: 48,
      borderRadius: 16,
      border: "1px solid rgba(96,165,250,0.28)",
      background: "rgba(19,40,108,0.35)",
      color: "#dbeafe",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      cursor: "pointer",
      padding: "0 16px",
    },
    field: {
      width: "100%",
      height: 56,
      borderRadius: 16,
      border: "1px solid rgba(148,163,184,0.16)",
      background: "rgba(255,255,255,0.04)",
      color: "#f8fafc",
      fontSize: 17,
      padding: "0 16px",
      outline: "none",
      boxSizing: "border-box",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      border: "1px solid rgba(44,89,255,0.28)",
      color: "#2f6bff",
      background: "rgba(24,58,179,0.18)",
      padding: "10px 18px",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
    },
    sectionTitle: {
      margin: "0 0 14px",
      fontSize: 16,
      fontWeight: 800,
      color: "#cbd5e1",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    },
    bottomNav: {
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 32px)",
      maxWidth: 448,
      background: "rgba(14,20,36,0.95)",
      border: "1px solid rgba(148,163,184,0.14)",
      borderRadius: 26,
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      padding: 12,
      boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
      zIndex: 5,
      backdropFilter: "blur(10px)",
    },
    navItem: (active) => ({
      minHeight: 58,
      borderRadius: 18,
      border: "none",
      background: active ? "rgba(29,78,216,0.15)" : "transparent",
      color: active ? "#2563ff" : "#94a3b8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      textTransform: "uppercase",
    }),
  }

  function HomeScreen() {
    return (
      <div style={styles.screen}>
        <div style={{ ...styles.topBar, padding: "24px 0 12px", borderBottom: "none" }}>
          <button style={styles.iconBtn}>
            <Menu size={22} />
          </button>
          <button style={styles.iconBtn}>
            <Settings size={22} />
          </button>
        </div>

        <div style={{ textAlign: "center", padding: "14px 12px 26px" }}>
          <div style={styles.labelUpper}>The village awakes</div>
          <h1 style={{ ...styles.headingXL, marginTop: 18, marginBottom: 24 }}>Loup-<br />Garou</h1>
          <p style={{ ...styles.subtitle, fontSize: 18, maxWidth: 340, margin: "0 auto" }}>
            Trust no one. The night falls upon the village, and the hunt begins.
          </p>
        </div>

        <div style={{ display: "grid", gap: 20, marginTop: 26 }}>
          <button
            onClick={() => {
              setEntryMode("host")
              setMessage("")
            }}
            style={{ ...styles.glassCard, display: "flex", alignItems: "center", gap: 18, textAlign: "left", cursor: "pointer" }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(180deg,#1f4dff,#1b3fc8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(29,78,216,0.35)" }}>
              <Sparkles size={26} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Game Master</div>
              <div style={{ color: "#94a3b8", fontSize: 16 }}>Control the narrative and roles</div>
            </div>
            <ChevronRight size={28} color="#64748b" />
          </button>

          <button
            onClick={() => {
              setEntryMode("player")
              setMessage("")
            }}
            style={{ ...styles.glassCard, display: "flex", alignItems: "center", gap: 18, textAlign: "left", cursor: "pointer" }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(30,41,59,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={26} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Join as Player</div>
              <div style={{ color: "#94a3b8", fontSize: 16 }}>Survival depends on your wit</div>
            </div>
            <ChevronRight size={28} color="#64748b" />
          </button>
        </div>

        {message ? <MessageBox text={message} /> : null}

        <BottomNav
          items={[
            { key: "home", label: "Home", icon: Home, active: true },
            { key: "recent", label: "Recent", icon: RotateCcw },
            { key: "profile", label: "Profile", icon: User },
            { key: "trophy", label: "Wins", icon: Trophy },
          ]}
          onPress={() => {}}
        />
      </div>
    )
  }

  function HostEntryScreen() {
    return (
      <div style={styles.screen}>
        <HeaderBar title="Create as Host" onBack={goToHome} right={<Settings size={20} />} />

        <div style={{ paddingTop: 18, display: "grid", gap: 18 }}>
          <div>
            <div style={styles.labelUpper}>Game Master</div>
            <h2 style={{ ...styles.headingXL, fontSize: 42, marginTop: 14 }}>Create the room</h2>
          </div>

          <div style={styles.glassCard}>
            <div style={{ display: "grid", gap: 14 }}>
              <input
                type="text"
                placeholder="Host name"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                style={styles.field}
              />

              <input
                type="number"
                min="4"
                max="44"
                value={expectedPlayers}
                onChange={(e) => setExpectedPlayers(Math.min(44, Math.max(4, Number(e.target.value) || 4)))}
                style={styles.field}
              />

              <button onClick={createGameAsHost} style={styles.primaryBtn}>
                <Sparkles size={18} /> Create Game
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
      <div style={styles.screen}>
        <HeaderBar title="Join as Player" onBack={goToHome} right={<Settings size={20} />} />

        <div style={{ paddingTop: 18, display: "grid", gap: 18 }}>
          <div>
            <div style={styles.labelUpper}>Enter the hunt</div>
            <h2 style={{ ...styles.headingXL, fontSize: 42, marginTop: 14 }}>Join a room</h2>
          </div>

          <div style={styles.glassCard}>
            <div style={{ display: "grid", gap: 14 }}>
              <input
                type="text"
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={styles.field}
              />
              <input
                type="text"
                placeholder="Game code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={{ ...styles.field, letterSpacing: "0.18em", textTransform: "uppercase" }}
              />
              <button onClick={joinGameAsPlayer} style={styles.primaryBtn}>
                <Users size={18} /> Join Game
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
      <div style={styles.screen}>
        <HeaderBar title="Loup-Garou Lobby" onBack={goToHome} right={<Settings size={20} />} />

        <div style={{ textAlign: "center", paddingTop: 12, paddingBottom: 22 }}>
          <div style={{ fontSize: 62, fontWeight: 900, letterSpacing: "0.08em" }}>{currentGame.code}</div>
          <div style={{ ...styles.sectionTitle, marginTop: 10, marginBottom: 0 }}>Game Code</div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={styles.glassCard}>
            <div style={{ color: "#cbd5e1", fontSize: 15, marginBottom: 10 }}>Connected Players</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 54, fontWeight: 800 }}>{players.length}/{expectedPlayers}</div>
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
                    }}
                  >
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.glassCard}>
            <div style={{ color: "#cbd5e1", fontSize: 15, marginBottom: 12 }}>Total Players (4–44)</div>
            <input
              type="number"
              min="4"
              max="44"
              value={expectedPlayers}
              onChange={(e) => setExpectedPlayers(Math.min(44, Math.max(4, Number(e.target.value) || 4)))}
              style={styles.field}
            />
          </div>

          <div style={{ ...styles.glassCard, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Role Configuration</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    const suggested = generateSuggestedRoles(expectedPlayers)
                    setRoleConfig(suggested)
                    setMessage("Smart composition generated")
                  }}
                  style={styles.secondaryBtn}
                >
                  <Sparkles size={16} /> Smart Compose
                </button>
                <button
                  onClick={() => {
                    setRoleConfig({ ...EMPTY_ROLE_CONFIG })
                    setMessage("Roles reset")
                  }}
                  style={styles.secondaryBtn}
                >
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
            </div>

            <div>
              {Object.keys(roleConfig)
                .filter((roleKey) => roleConfig[roleKey] > 0 || ["loup", "voyante", "sorciere", "garde", "chasseur", "villageois"].includes(roleKey))
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
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: accent.bg, border: `1px solid ${accent.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: accent.text, fontWeight: 900 }}>
                          {ROLE_LABELS[roleKey].slice(0, 1)}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{ROLE_LABELS[roleKey]}</div>
                          <div style={{ color: "#7c8aa6", fontSize: 13 }}>{WOLF_ROLES.includes(roleKey) ? "Evil Team" : "Villagers"}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                          onClick={() => changeRoleCount(roleKey, -1)}
                          disabled={roleConfig[roleKey] <= 0}
                          style={{ ...styles.iconBtn, width: 40, height: 40, opacity: roleConfig[roleKey] <= 0 ? 0.4 : 1 }}
                        >
                          −
                        </button>
                        <div style={{ width: 24, textAlign: "center", fontSize: 24, fontWeight: 800 }}>{roleConfig[roleKey]}</div>
                        <button
                          onClick={() => changeRoleCount(roleKey, 1)}
                          disabled={roleConfig[roleKey] >= getRoleMaxCount(roleKey)}
                          style={{ ...styles.iconBtn, width: 40, height: 40, background: "linear-gradient(180deg, #1f4dff, #1741d0)", border: "none", opacity: roleConfig[roleKey] >= getRoleMaxCount(roleKey) ? 0.45 : 1 }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div style={{ padding: 20, borderTop: "1px solid rgba(148,163,184,0.1)", color: "#2f6bff", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
              <UserPlus size={18} /> Add More Roles
            </div>
          </div>

          <div>
            <div style={styles.sectionTitle}>Players in Lobby</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[{ name: currentGame.host_name, host: true }, ...players].map((player, index) => (
                <div key={`${player.name}-${index}`} style={{ borderRadius: 999, border: "1px solid rgba(59,130,246,0.32)", padding: "10px 14px", background: "rgba(15,23,42,0.6)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: "#22c55e", display: "inline-block" }} />
                  <span>{player.name}{player.host ? " (Host)" : ""}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <button onClick={saveHostConfiguration} style={{ ...styles.secondaryBtn, width: "100%", minHeight: 58 }}>
              Save Configuration
            </button>
            <button onClick={startGame} style={styles.primaryBtn}>
              <Play size={18} /> START GAME
            </button>
          </div>

          <div style={{ textAlign: "center", color: totalConfiguredRoles === expectedPlayers ? "#22c55e" : "#f59e0b", fontWeight: 700 }}>
            Roles configured: {totalConfiguredRoles} / {expectedPlayers}
          </div>

          {message ? <MessageBox text={message} /> : null}
        </div>
      </div>
    )
  }

  function HostGameScreen() {
    const ended = currentGame.status === "ended"
    const chipLabel = currentGame.phase === "night" ? `Night ${currentGame.night_number || 1}` : currentGame.phase === "day" ? `Day ${currentGame.day_number || 1}` : getPhaseLabel(currentGame.phase)

    return (
      <div style={styles.screen}>
        <div style={styles.topBar}>
          <button onClick={goToHome} style={styles.iconBtn}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Loup-Garou</div>
            <div style={{ color: "#2f6bff", fontWeight: 700 }}>ROOM: {currentGame.code}</div>
          </div>
          <div style={styles.badge}>{chipLabel}</div>
        </div>

        <div style={{ paddingTop: 24, display: "grid", gap: 22 }}>
          <div style={styles.glassCard}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 74, height: 74, borderRadius: 20, background: "linear-gradient(180deg,#1f4dff,#1741d0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(29,78,216,0.28)" }}>
                <Moon size={34} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{getPhaseHeadline(currentGame.phase)}</div>
                <div style={{ color: "#97a3b6", fontSize: 16, lineHeight: 1.55 }}>{getPhaseSubtext(currentGame.phase)}</div>
              </div>
            </div>

            {!ended ? (
              <button onClick={goToNextPhase} style={{ ...styles.primaryBtn, marginTop: 22 }}>
                Next Phase <ChevronRight size={18} />
              </button>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={styles.sectionTitle}>Players ({players.length})</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["all", "alive", "dead"].map((filterValue) => (
                <button
                  key={filterValue}
                  onClick={() => setPlayerFilter(filterValue)}
                  style={{
                    ...styles.secondaryBtn,
                    minHeight: 40,
                    padding: "0 12px",
                    background: playerFilter === filterValue ? "rgba(29,78,216,0.24)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  {filterValue}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {filteredPlayers.map((player) => {
              const accent = getRoleAccent(player.role)
              return (
                <div key={player.id} style={{ ...styles.softCard, display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 14 }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ width: 58, height: 58, borderRadius: 29, background: player.alive ? "linear-gradient(180deg,#dbeafe,#93c5fd)" : "linear-gradient(180deg,#475569,#1e293b)", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900 }}>
                        {player.name.slice(0, 1).toUpperCase()}
                      </div>
                      <span style={{ position: "absolute", right: -2, bottom: -2, width: 16, height: 16, borderRadius: 16, background: player.alive ? "#22c55e" : "#6b7280", border: "2px solid #0b1220" }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 18, fontWeight: 800, textDecoration: player.alive ? "none" : "line-through", opacity: player.alive ? 1 : 0.6 }}>{player.name}</span>
                        <span style={{ borderRadius: 8, padding: "5px 8px", background: accent.bg, color: accent.text, fontSize: 12, fontWeight: 800, border: `1px solid ${accent.border}` }}>
                          {ROLE_LABELS[player.role] || "Unknown"}
                        </span>
                      </div>
                      <div style={{ marginTop: 4, color: player.alive ? "#94a3b8" : "#ef4444", fontSize: 16 }}>{player.alive ? "Alive" : "Dead"}</div>
                    </div>
                  </div>

                  {!ended ? (
                    <button
                      onClick={() => markPlayerDead(player.id, !player.alive)}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        border: `1px solid ${player.alive ? "rgba(239,68,68,0.32)" : "rgba(34,197,94,0.32)"}`,
                        background: player.alive ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                        color: player.alive ? "#ff6b6b" : "#22c55e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
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
            <div style={styles.sectionTitle}>Manual End Game</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <WinnerButton icon={Home} label="Village" onClick={() => endGameManually("The village wins")} />
              <WinnerButton icon={Users} label="Wolves" onClick={() => endGameManually("The wolves win")} danger />
              <WinnerButton icon={Heart} label="Lovers" onClick={() => endGameManually("The lovers win")} />
              <WinnerButton icon={Flame} label="Pyromaniac" onClick={() => endGameManually("The pyromaniac wins")} />
            </div>
          </div>

          {ended ? (
            <div style={{ ...styles.glassCard, color: "#fca5a5", fontWeight: 800 }}>
              Game ended{currentGame.winner ? ` — ${currentGame.winner}` : ""}
            </div>
          ) : null}

          {message ? <MessageBox text={message} /> : null}
        </div>

        <BottomNav
          items={[
            { key: "game", label: "Game", icon: Moon, active: activeHostTab === "game" },
            { key: "roles", label: "Roles", icon: Shield, active: activeHostTab === "roles" },
            { key: "log", label: "Log", icon: RotateCcw, active: activeHostTab === "log" },
            { key: "setup", label: "Setup", icon: Settings, active: activeHostTab === "setup" },
          ]}
          onPress={setActiveHostTab}
        />
      </div>
    )
  }

  function PlayerLobbyScreen() {
    return (
      <div style={styles.screen}>
        <HeaderBar title="Loup-Garou" onBack={goToHome} right={<Settings size={20} />} />

        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <div style={styles.badge}>Game Lobby</div>
          <div style={{ fontSize: 58, fontWeight: 900, letterSpacing: "0.06em", marginTop: 20 }}>{currentGame.code}</div>
          <div style={{ marginTop: 10, color: "#94a3b8", fontSize: 18 }}>Host: <span style={{ color: "#2f6bff" }}>{currentGame.host_name}</span></div>
        </div>

        <div style={{ paddingTop: 20, display: "grid", gap: 18 }}>
          <div style={{ ...styles.glassCard, textAlign: "center", padding: 28 }}>
            <div style={{ width: 86, height: 86, borderRadius: 999, margin: "0 auto 20px", border: "6px solid rgba(29,78,216,0.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2f6bff" }}>
              <RotateCcw size={32} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4 }}>Waiting for the game to start...</div>
            <div style={{ color: "#94a3b8", fontSize: 18, lineHeight: 1.6, marginTop: 12 }}>
              The host will begin the session shortly. Get ready for the hunt.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Connected Players</div>
            <div style={{ ...styles.badge, padding: "8px 14px" }}>{players.length}/{currentGame.expected_players}</div>
          </div>

          <div style={{ ...styles.glassCard, padding: 0, overflow: "hidden" }}>
            {[{ name: currentGame.host_name, subtitle: "HOST", alive: true }, ...players].map((player, index) => (
              <div key={`${player.name}-${index}`} style={{ padding: "18px 20px", borderTop: index === 0 ? "none" : "1px solid rgba(148,163,184,0.1)", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 23, background: "rgba(30,64,175,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#93c5fd" }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{player.name}</div>
                    <div style={{ color: player.subtitle ? "#2563ff" : "#94a3b8", fontSize: 14 }}>{player.subtitle || "Ready"}</div>
                  </div>
                </div>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: "#22c55e", display: "inline-block" }} />
              </div>
            ))}
          </div>

          {isRealHost ? (
            <button onClick={startGame} style={styles.primaryBtn}>
              <Play size={18} /> START GAME
            </button>
          ) : (
            <button style={styles.primaryBtn} disabled>
              Waiting for host
            </button>
          )}

          <button style={{ ...styles.secondaryBtn, width: "100%", minHeight: 58 }}>Invite Friends</button>

          {message ? <MessageBox text={message} /> : null}
        </div>
      </div>
    )
  }

  function PlayerGameScreen() {
    const roleAccent = getRoleAccent(me?.role)
    const nightLabel = currentGame.phase === "night" ? `NIGHT ${currentGame.night_number || 1}` : currentGame.phase === "day" ? `DAY ${currentGame.day_number || 1}` : getPhaseLabel(currentGame.phase).toUpperCase()

    return (
      <div style={styles.screen}>
        <div style={{ ...styles.topBar, justifyContent: "center", position: "relative" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{nightLabel}</div>
            <div style={{ color: "#2f6bff", fontSize: 16, fontWeight: 700, marginTop: 4 }}>{getPhaseLabel(currentGame.phase).toUpperCase()} PHASE</div>
          </div>
          <div style={{ position: "absolute", left: 20 }}>
            <div style={{ width: 50, height: 50, borderRadius: 18, background: "rgba(29,78,216,0.14)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563ff" }}>
              <Moon size={24} />
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 26 }}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ ...styles.sectionTitle, marginBottom: 10 }}>Secret Identity</div>
            <h2 style={{ ...styles.headingXL, fontSize: 32, margin: 0 }}>Your Role</h2>
          </div>

          <div style={{ ...styles.glassCard, padding: 24 }}>
            <div style={{ borderRadius: 24, minHeight: 320, background: "linear-gradient(180deg, rgba(16,49,143,0.45), rgba(10,21,54,0.5))", border: "1px solid rgba(59,130,246,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 140 }}>
              {me?.role ? (WOLF_ROLES.includes(me.role) ? "🐺" : me.role === "voyante" ? "🔮" : me.role === "sorciere" ? "🧪" : me.role === "chasseur" ? "🏹" : me.role === "garde" ? "🛡️" : "🧑") : "🎭"}
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <div style={{ ...styles.labelUpper, color: roleAccent.text }}>The pack</div>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 14 }}>{ROLE_LABELS[me?.role] || "Unknown Role"}</div>
              <div style={{ width: 70, height: 2, background: "rgba(37,99,235,0.6)", margin: "18px auto 24px" }} />
              <p style={{ ...styles.subtitle, fontSize: 18 }}>{ROLE_DESCRIPTIONS[me?.role] || "Your destiny will be revealed soon."}</p>
            </div>

            <div style={{ marginTop: 24, borderRadius: 18, background: "rgba(11,20,43,0.7)", border: "1px solid rgba(59,130,246,0.16)", padding: 18 }}>
              <div style={{ ...styles.sectionTitle, marginBottom: 10, color: "#2f6bff" }}>Your objective</div>
              <div style={{ color: "#dbeafe", lineHeight: 1.7 }}>
                {WOLF_ROLES.includes(me?.role)
                  ? "Work with the wolves, survive suspicion, and remove the village until your side controls the game."
                  : me?.role === "pyromane"
                    ? "Outlast everyone and become the final survivor."
                    : "Help the village uncover hidden evil and survive until your side wins."}
              </div>
            </div>
          </div>

          <div style={{ ...styles.glassCard, marginTop: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Status</div>
            <div style={{ marginTop: 8, color: me?.alive ? "#4ade80" : "#f87171", fontWeight: 700 }}>
              You are currently {me?.alive ? "alive" : "dead"}
            </div>
            {currentGame.status === "ended" ? (
              <div style={{ marginTop: 10, color: "#fca5a5", fontWeight: 700 }}>
                Winner: {currentGame.winner || "Unknown"}
              </div>
            ) : null}
          </div>

          {message ? <MessageBox text={message} /> : null}
        </div>

        <BottomNav
          items={[
            { key: "profile", label: "Profile", icon: User, active: activePlayerTab === "profile" },
            { key: "history", label: "History", icon: Shield, active: activePlayerTab === "history" },
            { key: "graveyard", label: "Graveyard", icon: Skull, active: activePlayerTab === "graveyard" },
          ]}
          onPress={setActivePlayerTab}
          columns={3}
        />
      </div>
    )
  }

  function HeaderBar({ title, onBack, right }) {
    return (
      <div style={styles.topBar}>
        <button onClick={onBack} style={styles.iconBtn}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div>
        <button style={styles.iconBtn}>{right}</button>
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
          color: danger ? "#ff6464" : "#f8fafc",
        }}
      >
        <Icon size={30} />
        <span style={{ fontSize: 18, fontWeight: 800 }}>{label}</span>
      </button>
    )
  }

  function BottomNav({ items, onPress, columns = 4 }) {
    return (
      <div style={{ ...styles.bottomNav, gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {items.map(({ key, label, icon: Icon, active }) => (
          <button key={key} onClick={() => onPress(key)} style={styles.navItem(active)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    )
  }

  function MessageBox({ text }) {
    return (
      <div style={{ ...styles.glassCard, marginTop: 18, color: "#dbeafe", borderColor: "rgba(59,130,246,0.3)" }}>
        {text}
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
      <div style={styles.forestGlow} />
      <div style={styles.mobile}>{renderScreen()}</div>
    </div>
  )
}

export default App
