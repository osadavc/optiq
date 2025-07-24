import { SidebarTrigger } from "@/components/ui/sidebar";
import { Assistant } from "@/components/assistant";

const Home = () => {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 p-4 border-b">
        <SidebarTrigger />
      </header>
      <main className="flex-1 overflow-hidden">
        <Assistant />
      </main>
    </div>
  );
};

export default Home;
