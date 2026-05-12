import React from 'react';
import Sidebar from './Sidebar';
import Header from './header'; 

interface ShellProps {
  children: React.ReactNode;
}

const Shell = ({ children }: ShellProps) => {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
       <Sidebar /> 
    <main className="flex-1 ml-64 flex flex-col min-h-screen animate-in fade-in duration-500">
      <Header />
        <div className="flex-1 lg:px-8 lg:pt-2 overflow-y-auto">
          <div className="max-w-350 mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Shell;