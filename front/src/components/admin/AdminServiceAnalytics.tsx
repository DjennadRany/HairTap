import React from 'react';

export const AdminServiceAnalytics: React.FC = () => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div className="p-4 bg-blue-50 rounded">
				<div className="text-sm text-gray-500">Services actifs</div>
				<div className="text-2xl font-bold">342</div>
			</div>
			<div className="p-4 bg-green-50 rounded">
				<div className="text-sm text-gray-500">Approuvés ce mois</div>
				<div className="text-2xl font-bold">58</div>
			</div>
			<div className="p-4 bg-purple-50 rounded">
				<div className="text-sm text-gray-500">Revenus (EUR)</div>
				<div className="text-2xl font-bold">12 450€</div>
			</div>
		</div>
	);
};











