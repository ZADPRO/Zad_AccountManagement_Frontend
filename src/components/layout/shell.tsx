import React from 'react';
import Sidebar from './Sidebar';
import Header from './header'; // Import your new Header component

interface ShellProps {
  children: React.ReactNode;
}

const Shell = ({ children }: ShellProps) => {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* Sidebar: Fixed width (w-64) */}
      <Sidebar /> 

      {/* Main Content Area: 
          ml-64 ensures it doesn't hide behind the sidebar.
          flex-col allows the Header to sit on top of the children.
      */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen animate-in fade-in duration-500">
        
        {/* Header: Placed inside main so it aligns to the right of Sidebar */}
        <Header />

        {/* Content Section: max-width for readability and padding */}
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