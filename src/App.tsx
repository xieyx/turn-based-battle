import { GameProvider } from './context/GameContext';
import { BattleScreen } from './components/battle/BattleScreen';

function App() {
  return (
    <GameProvider>
      <BattleScreen />
    </GameProvider>
  );
}

export default App;
