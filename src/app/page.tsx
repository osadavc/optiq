import { Assistant } from "@/components/assistant";

const Home = () => {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-hidden">
        <Assistant />
      </main>
    </div>
  );
};

export default Home;
