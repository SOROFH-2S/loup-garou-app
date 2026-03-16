import { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabase"
import wolfMoon from "./assets/wolf-moon.png"

const ROLE_LABELS = {
  loup: "Loup-garou",
  sorciere: "Sorcière",
  voyante: "Voyante",
  chasseur: "Chasseur",
  petite_fille: "Petite fille",
  cupidon: "Cupidon",
  pyromane: "Pyromane",
  villageois: "Villageois",
}

const ROLE_DESCRIPTIONS = {
  loup: "Tu élimines les villageois la nuit avec les autres loups.",
  sorciere: "Tu disposes de pouvoirs spéciaux selon les règles du maître du jeu.",
  voyante: "Tu peux découvrir l’identité d’un joueur pendant la nuit.",
  chasseur: "Si tu meurs, tu peux agir selon les règles prévues.",
  petite_fille: "Tu as une capacité d’observation spéciale selon les règles.",
  cupidon: "Tu peux former un couple d’amoureux au début de la partie.",
  pyromane: "Tu joues seul selon les règles définies par le maître du jeu.",
  villageois: "Tu n’as pas de pouvoir spécial. Tu aides le village.",
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
}

const STORAGE_KEYS = {
  sessionId: "lg_session_id",
  gameId: "lg_game_id",
  entryMode: "lg_entry_mode",
  playerName: "lg_player_name",
  hostName: "lg_host_name",
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
  const [expectedPlayers, setExpectedPlayers] = useState(4)
  const [roleConfig, setRoleConfig] = useState({
    ...EMPTY_ROLE_CONFIG,
    loup: 1,
    villageois: 3,
  })

  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  function getSessionId() {
    let sessionId = localStorage.getItem(STORAGE_KEYS.sessionId)
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEYS.sessionId, sessionId)
    }
    return sessionId
  }

  function normalizeName(name) {
    return name.trim().toLowerCase()
  }

  function persistGameSession({ gameId, mode, playerNameValue = "", hostNameValue = "" }) {
    localStorage.setItem(STORAGE_KEYS.gameId, String(gameId))
    localStorage.setItem(STORAGE_KEYS.entryMode, mode)

    if (playerNameValue) {
      localStorage.setItem(STORAGE_KEYS.playerName, playerNameValue)
    } else {
      localStorage.removeItem(STORAGE_KEYS.playerName)
    }

    if (hostNameValue) {
      localStorage.setItem(STORAGE_KEYS.hostName, hostNameValue)
    } else {
      localStorage.removeItem(STORAGE_KEYS.hostName)
    }
  }

  function clearPersistedGameSession() {
    localStorage.removeItem(STORAGE_KEYS.gameId)
    localStorage.removeItem(STORAGE_KEYS.entryMode)
    localStorage.removeItem(STORAGE_KEYS.playerName)
    localStorage.removeItem(STORAGE_KEYS.hostName)
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
    setExpectedPlayers(4)
    setRoleConfig({
      ...EMPTY_ROLE_CONFIG,
      loup: 1,
      villageois: 3,
    })
  }

  const totalConfiguredRoles = useMemo(() => {
    return Object.values(roleConfig).reduce((sum, value) => sum + value, 0)
  }, [roleConfig])

  function changeRoleCount(roleKey, delta) {
    setRoleConfig((prev) => {
      const currentValue = prev[roleKey] || 0
      const nextValue = Math.max(0, currentValue + delta)
      return { ...prev, [roleKey]: nextValue }
    })
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
      config.loup = 2
      config.voyante = 1
      config.sorciere = 1
      config.villageois = playerCount - 4
      return config
    }

    if (playerCount <= 8) {
      config.loup = 2
      config.voyante = 1
      config.sorciere = 1
      config.chasseur = 1
      config.cupidon = 1
      config.villageois = playerCount - 6
      return config
    }

    config.loup = 3
    config.voyante = 1
    config.sorciere = 1
    config.chasseur = 1
    config.cupidon = 1
    config.petite_fille = 1
    config.villageois = Math.max(0, playerCount - 8)

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
    const wolves = alivePlayers.filter((p) => p.role === "loup")
    const nonWolves = alivePlayers.filter((p) => p.role !== "loup")
    const pyromane = alivePlayers.filter((p) => p.role === "pyromane")
    const cupidon = alivePlayers.filter((p) => p.role === "cupidon")

    if (pyromane.length === 1 && alivePlayers.length === 1) {
      return "Le pyromane gagne"
    }

    if (cupidon.length === 1 && alivePlayers.length === 1) {
      return "Cupidon gagne"
    }

    if (wolves.length === 0 && alivePlayers.length > 0) {
      return "Le village gagne"
    }

    if (wolves.length > 0 && wolves.length >= nonWolves.length) {
      return "Les loups gagnent"
    }

    return null
  }

  async function updateGameEnded(gameId, winner) {
    const { error } = await supabase
      .from("games")
      .update({
        status: "ended",
        winner,
        ended_at: new Date().toISOString(),
      })
      .eq("id", gameId)

    if (error) {
      console.error(error)
      setMessage("Erreur lors de la fin de partie")
    }
  }

  async function createGameAsHost() {
    setMessage("")

    if (!hostName.trim()) {
      setMessage("Entre le nom du maître du jeu")
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

    if (game.host_session_id && game.host_session_id === sessionId) {
      persistGameSession({
        gameId: game.id,
        mode: "host",
        hostNameValue: game.host_name || "",
      })

      setHostName(game.host_name || "")
      setEntryMode("host")
      setCurrentGame(game)
      setExpectedPlayers(game.expected_players || 4)
      setRoleConfig({
        ...EMPTY_ROLE_CONFIG,
        ...(game.role_config || {}),
      })
      setMessage("Session maître du jeu restaurée")
      await loadPlayers(game.id)
      return
    }

    if (game.status !== "lobby") {
      const { data: existingPlayerInStartedGame, error: startedPlayerError } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", game.id)
        .eq("session_id", sessionId)
        .maybeSingle()

      if (startedPlayerError) {
        console.error(startedPlayerError)
        setMessage("Erreur lors de la vérification de la session")
        return
      }

      if (existingPlayerInStartedGame) {
        persistGameSession({
          gameId: game.id,
          mode: "player",
          playerNameValue: existingPlayerInStartedGame.name,
        })

        setPlayerName(existingPlayerInStartedGame.name)
        setEntryMode("player")
        setCurrentGame(game)
        setExpectedPlayers(game.expected_players || 4)
        setRoleConfig({
          ...EMPTY_ROLE_CONFIG,
          ...(game.role_config || {}),
        })
        setMessage("Session restaurée dans la partie")
        await loadPlayers(game.id)
        return
      }

      setMessage("La partie a déjà commencé ou est terminée")
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

    const existingSameSessionPlayer = existingPlayers.find(
      (p) => p.session_id === sessionId
    )

    if (existingSameSessionPlayer) {
      persistGameSession({
        gameId: game.id,
        mode: "player",
        playerNameValue: existingSameSessionPlayer.name,
      })

      setPlayerName(existingSameSessionPlayer.name)
      setEntryMode("player")
      setCurrentGame(game)
      setExpectedPlayers(game.expected_players || 4)
      setRoleConfig({
        ...EMPTY_ROLE_CONFIG,
        ...(game.role_config || {}),
      })
      setMessage("Session restaurée dans la partie")
      await loadPlayers(game.id)
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

    const { error: playerError } = await supabase
      .from("players")
      .insert([
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
    setExpectedPlayers(game.expected_players || 4)
    setRoleConfig({
      ...EMPTY_ROLE_CONFIG,
      ...(game.role_config || {}),
    })
    setMessage("Tu as rejoint la partie avec succès")
    await loadPlayers(game.id)
  }

  async function saveHostConfiguration() {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Seul le maître du jeu peut modifier la configuration")
      return
    }

    if (expectedPlayers < 4) {
      setMessage("Le nombre minimum de joueurs est 4")
      return
    }

    if (totalConfiguredRoles !== expectedPlayers) {
      setMessage("Le total des rôles doit être égal au nombre de joueurs")
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
      setMessage("Erreur lors de la sauvegarde de la configuration")
      return
    }

    setCurrentGame(data)
    setMessage("Configuration sauvegardée")
  }

  async function startGame() {
    if (!currentGame) return

    if (currentGame.host_session_id !== mySessionId) {
      setMessage("Seul le maître du jeu peut lancer la partie")
      return
    }

    if (totalConfiguredRoles !== expectedPlayers) {
      setMessage("Le total des rôles doit être égal au nombre de joueurs")
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

    if (!playersData || playersData.length !== currentGame.expected_players) {
      setMessage("Le nombre de joueurs connectés doit être égal au nombre fixé")
      return
    }

    const config = currentGame.role_config || {}
    const roles = []

    Object.keys(config).forEach((roleKey) => {
      const count = config[roleKey] || 0
      for (let i = 0; i < count; i++) {
        roles.push(roleKey)
      }
    })

    if (roles.length !== currentGame.expected_players) {
      setMessage("La composition des rôles n’est pas valide")
      return
    }

    roles.sort(() => Math.random() - 0.5)

    for (let i = 0; i < playersData.length; i++) {
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
    setMessage("La partie a été lancée")
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
      const savedGameId = localStorage.getItem(STORAGE_KEYS.gameId)
      const savedEntryMode = localStorage.getItem(STORAGE_KEYS.entryMode)
      const savedPlayerName = localStorage.getItem(STORAGE_KEYS.playerName) || ""
      const savedHostName = localStorage.getItem(STORAGE_KEYS.hostName) || ""

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
        if (!game.host_session_id || game.host_session_id !== sessionId) {
          clearPersistedGameSession()
          return
        }

        setHostName(savedHostName || game.host_name || "")
        setEntryMode("host")
        setCurrentGame(game)
        setExpectedPlayers(game.expected_players || 4)
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
        setExpectedPlayers(game.expected_players || 4)
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
      .channel("room-" + currentGame.id)
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

  const me = players.find((p) => p.session_id === mySessionId)
  const isRealHost = !!currentGame && currentGame.host_session_id === mySessionId

  const pageStyle = {
    minHeight: "100vh",
    backgroundImage: `linear-gradient(rgba(5, 8, 20, 0.78), rgba(5, 8, 20, 0.88)), url(${wolfMoon})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    padding: "30px 16px",
    color: "white",
  }

  const panelStyle = {
    background: "rgba(10, 14, 30, 0.78)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "18px",
    padding: "24px",
    backdropFilter: "blur(5px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  }

  const inputStyle = {
    padding: "12px",
    width: "100%",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    outline: "none",
  }

  const buttonStyle = {
    padding: "12px 16px",
    cursor: "pointer",
    borderRadius: "10px",
    border: "none",
    background: "#8b5cf6",
    color: "white",
    fontWeight: "bold",
  }

  const secondaryButtonStyle = {
    padding: "12px 16px",
    cursor: "pointer",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: "bold",
  }

  if (currentGame) {
    const isLobby = currentGame.status === "lobby"
    const isStarted = currentGame.status === "started"
    const isEnded = currentGame.status === "ended"

    if (isRealHost && isLobby) {
      return (
        <div style={pageStyle}>
          <div style={{ maxWidth: "980px", margin: "0 auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>Loup-Garou</h1>

            <div style={panelStyle}>
              <h2>Salle d’attente maître du jeu</h2>

              <p><strong>Code de la partie :</strong> {currentGame.code}</p>
              <p><strong>Maître du jeu :</strong> {currentGame.host_name}</p>
              <p><strong>Joueurs connectés :</strong> {players.length} / {expectedPlayers}</p>

              <label>Nombre de joueurs</label>
              <input
                type="number"
                min="4"
                value={expectedPlayers}
                onChange={(e) => setExpectedPlayers(Number(e.target.value))}
                style={inputStyle}
              />

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "15px" }}>
                <button
                  onClick={() => {
                    const suggested = generateSuggestedRoles(expectedPlayers)
                    setRoleConfig(suggested)
                    setMessage("Composition suggérée générée")
                  }}
                  style={buttonStyle}
                >
                  Générer une composition intelligente
                </button>

                <button
                  onClick={() => {
                    setRoleConfig({ ...EMPTY_ROLE_CONFIG })
                    setMessage("Composition remise à zéro")
                  }}
                  style={secondaryButtonStyle}
                >
                  Réinitialiser les rôles
                </button>
              </div>

              <h3>Choix des rôles</h3>

              {Object.keys(roleConfig).map((roleKey) => (
                <div
                  key={roleKey}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: "12px",
                    padding: "12px",
                    marginBottom: "10px",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <span>{ROLE_LABELS[roleKey]}</span>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() => changeRoleCount(roleKey, -1)}
                      style={secondaryButtonStyle}
                    >
                      -
                    </button>

                    <strong>{roleConfig[roleKey]}</strong>

                    <button
                      onClick={() => changeRoleCount(roleKey, 1)}
                      style={buttonStyle}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              <p><strong>Total des rôles :</strong> {totalConfiguredRoles} / {expectedPlayers}</p>

              <div style={{ display: "flex", gap: "12px", marginTop: "15px", flexWrap: "wrap" }}>
                <button onClick={saveHostConfiguration} style={secondaryButtonStyle}>
                  Sauvegarder la configuration
                </button>

                <button onClick={startGame} style={buttonStyle}>
                  Lancer la partie
                </button>
              </div>

              <h3 style={{ marginTop: "25px" }}>Joueurs connectés</h3>
              {players.length === 0 ? (
                <p>Aucun joueur pour le moment.</p>
              ) : (
                <ul>
                  {players.map((player) => (
                    <li key={player.id}>{player.name}</li>
                  ))}
                </ul>
              )}

              {message && <p style={{ marginTop: "20px", fontWeight: "bold" }}>{message}</p>}
            </div>
          </div>
        </div>
      )
    }

    if (isRealHost && (isStarted || isEnded)) {
      return (
        <div style={pageStyle}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>Loup-Garou</h1>

            <div style={panelStyle}>
              <h2>Interface maître du jeu</h2>

              <p><strong>Code de la partie :</strong> {currentGame.code}</p>
              <p><strong>Statut :</strong> {currentGame.status}</p>
              <p><strong>Maître du jeu :</strong> {currentGame.host_name}</p>

              {isEnded && (
                <p style={{ marginTop: "20px", fontWeight: "bold", color: "#ff6b57" }}>
                  Partie terminée{currentGame.winner ? ` — ${currentGame.winner}` : ""}
                </p>
              )}

              <h3>Joueurs</h3>
              <ul>
                {players.map((player) => (
                  <li key={player.id} style={{ marginBottom: "10px" }}>
                    <span>
                      {player.name}
                      {` — rôle : ${ROLE_LABELS[player.role] || player.role || "non défini"}`}
                      {player.alive ? " — vivant" : " — mort"}
                    </span>

                    <button
                      onClick={() => markPlayerDead(player.id, !player.alive)}
                      style={{ ...secondaryButtonStyle, marginLeft: "12px" }}
                    >
                      {player.alive ? "Marquer mort" : "Rendre vivant"}
                    </button>
                  </li>
                ))}
              </ul>

              <h3>Fin manuelle</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={() => endGameManually("Le village gagne")} style={secondaryButtonStyle}>
                  Village gagne
                </button>
                <button onClick={() => endGameManually("Les loups gagnent")} style={secondaryButtonStyle}>
                  Loups gagnent
                </button>
                <button onClick={() => endGameManually("Cupidon gagne")} style={secondaryButtonStyle}>
                  Cupidon gagne
                </button>
                <button onClick={() => endGameManually("Le pyromane gagne")} style={secondaryButtonStyle}>
                  Pyromane gagne
                </button>
              </div>

              <div style={{ marginTop: "20px" }}>
                <button onClick={newGame} style={buttonStyle}>
                  Nouvelle partie
                </button>
              </div>

              {message && <p style={{ marginTop: "20px", fontWeight: "bold" }}>{message}</p>}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: "850px", margin: "0 auto" }}>
          <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>Loup-Garou</h1>

          <div style={panelStyle}>
            <h2>{isLobby ? "Salle d’attente" : "Interface joueur"}</h2>

            <p><strong>Code de la partie :</strong> {currentGame.code}</p>
            <p><strong>Statut :</strong> {currentGame.status}</p>
            <p><strong>Maître du jeu :</strong> {currentGame.host_name}</p>
            <p><strong>Joueurs connectés :</strong> {players.length} / {currentGame.expected_players}</p>

            {isEnded && (
              <p style={{ marginTop: "20px", fontWeight: "bold", color: "#ff6b57" }}>
                Partie terminée{currentGame.winner ? ` — ${currentGame.winner}` : ""}
              </p>
            )}

            <h3>Joueurs connectés</h3>
            <ul>
              {players.map((player) => (
                <li key={player.id}>
                  {player.name} {player.alive ? "— vivant" : "— mort"}
                </li>
              ))}
            </ul>

            {me?.role && (
              <div style={{ marginTop: "20px" }}>
                <p style={{ fontWeight: "bold" }}>
                  Ton rôle : {ROLE_LABELS[me.role] || me.role}
                </p>
                <p>{ROLE_DESCRIPTIONS[me.role] || ""}</p>
              </div>
            )}

            {me && (
              <p style={{ marginTop: "10px", fontWeight: "bold", color: me.alive ? "lightgreen" : "#ff6b57" }}>
                Tu es {me.alive ? "vivant" : "mort"}
              </p>
            )}

            {isStarted && (
              <p style={{ marginTop: "20px", fontWeight: "bold", color: "limegreen" }}>
                La partie a commencé
              </p>
            )}

            {isEnded && (
              <div style={{ marginTop: "20px" }}>
                <button onClick={goToHome} style={buttonStyle}>
                  Nouvelle partie
                </button>
              </div>
            )}

            {message && <p style={{ marginTop: "20px", fontWeight: "bold" }}>{message}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (entryMode === "host") {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>Loup-Garou</h1>

          <div style={panelStyle}>
            <h2>Entrer comme maître du jeu</h2>

            <input
              type="text"
              placeholder="Nom du maître du jeu"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              style={inputStyle}
            />

            <button onClick={createGameAsHost} style={buttonStyle}>
              Créer la partie
            </button>

            <button
              onClick={goToHome}
              style={{ ...secondaryButtonStyle, marginLeft: "10px" }}
            >
              Retour
            </button>
          </div>

          {message && <p style={{ marginTop: "20px", fontWeight: "bold" }}>{message}</p>}
        </div>
      </div>
    )
  }

  if (entryMode === "player") {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>Loup-Garou</h1>

          <div style={panelStyle}>
            <h2>Entrer comme joueur</h2>

            <input
              type="text"
              placeholder="Ton nom"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Code de la partie"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              style={inputStyle}
            />

            <button onClick={joinGameAsPlayer} style={buttonStyle}>
              Rejoindre
            </button>

            <button
              onClick={goToHome}
              style={{ ...secondaryButtonStyle, marginLeft: "10px" }}
            >
              Retour
            </button>
          </div>

          {message && <p style={{ marginTop: "20px", fontWeight: "bold" }}>{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "72px", marginBottom: "24px" }}>Loup-Garou</h1>

        <div style={panelStyle}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <button
              onClick={() => {
                setEntryMode("host")
                setMessage("")
              }}
              style={{ ...buttonStyle, fontSize: "18px" }}
            >
              Entrer comme maître du jeu
            </button>

            <button
              onClick={() => {
                setEntryMode("player")
                setMessage("")
              }}
              style={{ ...secondaryButtonStyle, fontSize: "18px" }}
            >
              Entrer comme joueur
            </button>
          </div>
        </div>

        {message && <p style={{ marginTop: "20px", fontWeight: "bold" }}>{message}</p>}
      </div>
    </div>
  )
}

export default App