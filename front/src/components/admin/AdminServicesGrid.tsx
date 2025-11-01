import React from 'react';
import { Card } from '../ui/card';

export const AdminServicesGrid: React.FC = () => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{Array.from({ length: 6 }).map((_, i) => (
				<Card key={i} className="p-4">
					<div className="h-32 bg-gray-200 rounded mb-3" />
					<div className="font-medium">Service #{i + 1}</div>
					<div className="text-sm text-gray-500">Coiffeur • Catégorie</div>
				</Card>
			))}
		</div>
	);
};











