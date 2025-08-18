import React from 'react';

export const AdminAnalyticsOverview: React.FC = () => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
			<div className="p-4 bg-blue-50 rounded">
				<div className="text-sm text-gray-500">Utilisateurs</div>
				<div className="text-2xl font-bold">1 247</div>
			</div>
			<div className="p-4 bg-green-50 rounded">
				<div className="text-sm text-gray-500">Coiffeurs</div>
				<div className="text-2xl font-bold">89</div>
			</div>
			<div className="p-4 bg-purple-50 rounded">
				<div className="text-sm text-gray-500">Réservations</div>
				<div className="text-2xl font-bold">3 421</div>
			</div>
			<div className="p-4 bg-yellow-50 rounded">
				<div className="text-sm text-gray-500">Revenus</div>
				<div className="text-2xl font-bold">45 678€</div>
			</div>
		</div>
	);
};
