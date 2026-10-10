import { SetupScreen } from './components/SetupScreen'
import { PlayScreen } from './components/PlayScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { GameProvider, useGame } from './game/GameContext'

function AppRoutes() {
  const { state } = useGame()

  return (
    <div data-theme={state.screen === 'setup' ? 'walnut' : state.resolvedTheme}>
      {state.screen === 'setup' && <SetupScreen />}
      {state.screen === 'play' && <PlayScreen />}
      {state.screen === 'results' && <ResultsScreen />}
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppRoutes />
    </GameProvider>
  )
}
