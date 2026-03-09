import React from 'react';
import { Link } from 'react-router-dom';

interface MenuCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
}

const MenuCard: React.FC<MenuCardProps> = ({ title, description, icon, link }) => {
  return (
    <Link to={link} className="block group">
      <div className="card-glass p-8 flex flex-col items-center text-center h-full group-hover:border-primary-200 group-hover:translate-y-[-4px]">
        <div className="text-5xl mb-6 transform transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};

export default MenuCard;