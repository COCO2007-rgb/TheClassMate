import React from 'react';
import { motion } from 'framer-motion';

const KPICard = ({ title, value, icon: Icon, description, trend, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className={`p-6 rounded-xl bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between transition-shadow duration-300 hover:shadow-md cursor-pointer ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-accent">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
        {description && (
          <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
            {trend && (
              <span className={`mr-1 font-semibold ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {trend}
              </span>
            )}
            <span>{description}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KPICard;
