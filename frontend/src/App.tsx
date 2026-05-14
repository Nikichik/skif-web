import Header from './components/Header';
import LinacSection from './components/LinacSection';
import BoosterSection from './components/BoosterSection';
import { useSSE } from './hooks/useSSE';

export default function App() {
  const { data, connected } = useSSE();

  return (
    <div className="min-h-screen bg-panel-bg">
      <Header connected={connected} />
      <main className="max-w-[1920px] mx-auto">
        <LinacSection data={data?.linac || null} booster={data?.booster || null} />
        <BoosterSection data={data?.booster || null} />
      </main>
    </div>
  );
}
