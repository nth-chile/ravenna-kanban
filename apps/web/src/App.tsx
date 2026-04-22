import { Board } from './components/Board.js';
import { Toaster } from './components/Toaster.js';

export function App() {
  return (
    <main className="h-screen bg-bg text-fg">
      <Board />
      <Toaster />
    </main>
  );
}
