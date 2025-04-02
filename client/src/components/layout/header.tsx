import { useState } from "react";

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
    <header className="bg-white shadow-sm h-16 flex items-center px-6 col-start-2 row-start-1">
      <button 
        className="md:hidden text-gray-900 mr-4"
        onClick={toggleMobileMenu}
      >
        <span className="material-icons">menu</span>
      </button>
      
      <div className="flex-1">
        <h2 className="text-lg font-semibold">Westfield Development Project</h2>
        <p className="text-sm text-gray-500">Contract Ref: NEC4-2020-1234</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-1 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
          <span className="material-icons">notifications</span>
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-600"></span>
        </button>
        <button className="p-1 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
          <span className="material-icons">help_outline</span>
        </button>
      </div>
    </header>
  );
}
