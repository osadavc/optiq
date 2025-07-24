import { SidebarTrigger } from "@/components/ui/sidebar";

const Home = () => {
  return (
    <div className="p-4">
      <header className="flex items-center gap-4 mb-6">
        <SidebarTrigger />
      </header>
    </div>
  );
};

export default Home;
