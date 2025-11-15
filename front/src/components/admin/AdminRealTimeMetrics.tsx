import React from 'react';

export const AdminRealTimeMetrics: React.FC = () => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div className="p-4 bg-blue-50 rounded">
				<div className="text-sm text-gray-500">Visiteurs en ligne</div>
				<div className="text-2xl font-bold">56</div>
			</div>
			<div className="p-4 bg-green-50 rounded">
				<div className="text-sm text-gray-500">Réservations en cours</div>
				<div className="text-2xl font-bold">12</div>
			</div>
			<div className="p-4 bg-purple-50 rounded">
				<div className="text-sm text-gray-500">Taux de conversion</div>
				<div className="text-2xl font-bold">3.4%</div>
			</div>
		</div>
	);
};












