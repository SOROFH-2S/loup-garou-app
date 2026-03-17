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
  renard: "Renard",
  corbeau: "Corbeau",
  ancien: "L'Ancien",
  enfant_sauvage: "Enfant sauvage",
  petit_chaperon_rouge: "Petit chaperon rouge",
  ange_dechu: "Ange déchu",
  chevalier_epee_rouillee: "Chevalier à l'épée rouillée",
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
  loup: "Tu élimines les villageois la nuit avec les autres loups.",
  sorciere:
    "Tu disposes de deux potions dont une potion de vie et une potion de mort utilisable une fois chacune durant toute la partie. Tu ne peux les utiliser que pendant la nuit.",
  voyante: "Tu peux découvrir l’identité d’un joueur pendant la nuit.",
  chasseur:
    "Si tu meurs, tu emportes une personne avec toi. Le joueur désigné meurt automatiquement et est éliminé de partie.",
  petite_fille:
    "Tu peux observer les loups durant la nuit pendant qu'ils votent pour désigner une victime. Mais de manière discrète sinon tu seras la victime des loups.",
  cupidon:
    "Tu formes un couple d’amoureux au début de la partie. Les amoureux devront s'arranger à gagner ensemble si l'un des amoureux meurt durant la partie l'autre meurt automatiquement de chagrin d'amour.",
  pyromane:
    "Tu joues seul. Tu peux huiler ou bruler une personne durant la nuit. Pour bruler il faut que la ou les personnes aient déjà été huilées.",
  villageois:
    "Tu n’as pas de pouvoir spécial. Tu aides le village à démasquer les loups durant la journée.",
  renard:
    "Tu désigne une personne durant la nuit. Si aucun loup n’est détecté parmi la personne désignée et ses voisins de gauches et de droite, tu perds ton pouvoir.",
  corbeau:
    "Chaque nuit, tu peux désigner un joueur qui recevra deux voix supplémentaires au prochain vote.",
  ancien:
    "Tu résistes à une première attaque des loups. Si tu meurts au cosonseil du village tous les villageois perdent automatiquement leurs pouvoirs.",
  enfant_sauvage:
    "Tu choisis un modèle au début de la partie. Si ce modèle meurt, tu deviens loup.",
  petit_chaperon_rouge:
    "Tu immunisé contre les loups tant que le chasseur n'est pas encore mort.",
  ange_dechu:
    "Tu gagnes en début de partie si tu réussis à te faire tué par le village au premier conseil. Sinon tu deviens simple villageois une fois le premier conseil du village passé.",
  chevalier_epee_rouillee:
    "Le premier loup à ta gauche meurt dès que tu meurts.",
  loup_blanc:
    "Tu es un loup spécial avec un objectif personnel, souvent de finir seul survivant.",
  loup_infecte:
    "Tu peux transformer une victime en loup au lieu de simplement l’éliminer. Tu ne peux utiliser qu'une seule fois ce pouvoir durant toute la partie.",
  grand_mechant_loup:
    "Tu peux tuer un loup chaque deux nuits si c'est un villageois qui meurt au premier conseil.",
  garde:
    "Chaque nuit, tu peux protéger une personne chaque nuit contre toute attaque. Tu peux te protéger également. Mais tu ne peux pas protéger le meme joueur deux nuits consécutives.",
  frere_1:
    "Tu fais partie des frères. Les frères se connaissent entre eux et jouent pour le village.",
  frere_2:
    "Tu fais partie des frères. Les frères se connaissent entre eux et jouent pour le village.",
  soeur_1:
    "Tu fais partie des soeurs. Les soeurs se connaissent entre elles et jouent pour le village.",
  soeur_2:
    "Tu fais partie des soeurs. Les soeurs se connaissent entre elles et jouent pour le village.",
  soeur_3:
    "Tu fais partie des soeurs. Les soeurs se connaissent entre elles et jouent pour le village.",
  loup_bavard:
    "Tu fais partie du camp des loups et tu suis une règle spéciale de communication selon la variante choisie.",
  vagabond:
    "Tu joues avec un rôle spécial ou indépendant selon les règles définies par le maître du jeu.",
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

  function getRoleMaxCount(roleKey) {
    if (roleKey === "loup" || roleKey === "villageois") {
      return 10
    }

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
    const wolfRoles = ["loup", "loup_blanc", "loup_infecte", "grand_mechant_loup", "loup_bavard"]

    const wolves = alivePlayers.filter((p) => wolfRoles.includes(p.role))
    const nonWolves = alivePlayers.filter((p) => !wolfRoles.includes(p.role))
    const pyromane = alivePlayers.filter((p) => p.role === "pyromane")
    const cupidon = alivePlayers.filter((p) => p.role === "cupidon")
    const angeDechu = alivePlayers.filter((p) => p.role === "ange_dechu")
    const vagabond = alivePlayers.filter((p) => p.role === "vagabond")

    if (pyromane.length === 1 && alivePlayers.length === 1) {
      return "Le pyromane gagne"
    }

    if (cupidon.length === 1 && alivePlayers.length === 1) {
      return "Cupidon gagne"
    }

    if (angeDechu.length === 1 && alivePlayers.length === 1) {
      return "L’ange déchu gagne"
    }

    if (vagabond.length === 1 && alivePlayers.length === 1) {
      return "Le vagabond gagne"
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
      .eq("host_session_id", mySessionId)

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
    setExpectedPlayers(game.expected_players || 4)
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
            <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>
              Loup-Garou
            </h1>

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
                  <span>
                    {ROLE_LABELS[roleKey]} (max {getRoleMaxCount(roleKey)})
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() => changeRoleCount(roleKey, -1)}
                      disabled={roleConfig[roleKey] <= 0}
                      style={{
                        ...secondaryButtonStyle,
                        opacity: roleConfig[roleKey] <= 0 ? 0.5 : 1,
                        cursor: roleConfig[roleKey] <= 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      -
                    </button>

                    <strong>{roleConfig[roleKey]}</strong>

                    <button
                      onClick={() => changeRoleCount(roleKey, 1)}
                      disabled={roleConfig[roleKey] >= getRoleMaxCount(roleKey)}
                      style={{
                        ...buttonStyle,
                        opacity: roleConfig[roleKey] >= getRoleMaxCount(roleKey) ? 0.5 : 1,
                        cursor:
                          roleConfig[roleKey] >= getRoleMaxCount(roleKey)
                            ? "not-allowed"
                            : "pointer",
                      }}
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
            <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>
              Loup-Garou
            </h1>

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
                <button onClick={() => endGameManually("L’ange déchu gagne")} style={secondaryButtonStyle}>
                  Ange déchu gagne
                </button>
                <button onClick={() => endGameManually("Le vagabond gagne")} style={secondaryButtonStyle}>
                  Vagabond gagne
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
          <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>
            Loup-Garou
          </h1>

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
              <p
                style={{
                  marginTop: "10px",
                  fontWeight: "bold",
                  color: me.alive ? "lightgreen" : "#ff6b57",
                }}
              >
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
          <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>
            Loup-Garou
          </h1>

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
          <h1 style={{ textAlign: "center", fontSize: "64px", marginBottom: "24px" }}>
            Loup-Garou
          </h1>

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