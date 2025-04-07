import { useState } from "react";
import { Menu, Bell, HelpCircle } from 'lucide-react';

type HeaderProps = {
  user: any;
};

export default function Header({ user }: HeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
    const sidebar = document.querySelector('.sidebar');
    sidebar?.classList.toggle('hidden');
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center px-6 sticky top-0 z-10">
      <button 
        className="md:hidden text-gray-900 mr-4 p-1 rounded hover:bg-gray-100"
        onClick={toggleMobileMenu}
      >
        <Menu className="w-5 h-5" />
      </button>
      
      <div className="flex-1">
        <h2 className="text-lg font-semibold">Westfield Development Project</h2>
        <p className="text-sm text-gray-500">Contract Ref: NEC4-2020-1234</p>
      </div>
      
      <div className="flex items-center space-x-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-600"></span>
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
