import React from 'react';
import { Button } from '../ui/Button';

export const AdminServiceModeration: React.FC = () => {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between p-3 bg-orange-50 rounded">
				<div>
					<div className="font-medium text-gray-900">Coupe homme premium</div>
					<div className="text-sm text-gray-500">En attente de validation</div>
				</div>
				<div className="space-x-2">
					<Button size="sm">Approuver</Button>
					<Button variant="outline" size="sm">Rejeter</Button>
				</div>
			</div>
		</div>
	);
};
