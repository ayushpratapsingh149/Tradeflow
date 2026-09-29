import Sidebar from './Sidebar';

const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-[#0f1117]">
    <Sidebar />
    <main className="flex-1 ml-60 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </div>
    </main>
  </div>
);

export default AppLayout;
