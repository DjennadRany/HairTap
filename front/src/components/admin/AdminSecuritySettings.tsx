import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { useNotification } from '../ui/NotificationManager';

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
  };
  ipWhitelist: string[];
}

export const AdminSecuritySettings: React.FC = () => {
  const { showNotification } = useNotification();
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorAuth: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true,
    },
    ipWhitelist: ['127.0.0.1', '::1'],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SecuritySettings>(settings);

  // Charger les paramètres au montage du composant
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Simulation d'un appel API - remplacer par la vraie API
      const response = await fetch('/api/admin/security-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setOriginalSettings(data);
      } else {
        // Utiliser les paramètres par défaut si l'API échoue
        showNotification('Utilisation des paramètres par défaut', 'warning');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      showNotification('Erreur lors du chargement des paramètres', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validation des paramètres
      if (settings.sessionTimeout < 5 || settings.sessionTimeout > 120) {
        showNotification('Le timeout de session doit être entre 5 et 120 minutes', 'error');
        return;
      }
      
      if (settings.maxLoginAttempts < 3 || settings.maxLoginAttempts > 10) {
        showNotification('Le nombre de tentatives doit être entre 3 et 10', 'error');
        return;
      }

      // Appel API pour sauvegarder
      const response = await fetch('/api/admin/security-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setOriginalSettings(settings);
        setIsEditing(false);
        showNotification('Paramètres de sécurité sauvegardés avec succès', 'success');
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showNotification('Erreur lors de la sauvegarde des paramètres', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Paramètres de sécurité</h3>
        <div className="space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Modifier
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} variant="default" disabled={loading}>
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={loading}>
                Annuler
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authentification à deux facteurs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Authentification à deux facteurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="2fa"
                checked={settings.twoFactorAuth}
                onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                disabled={!isEditing}
                className="rounded border-gray-300"
              />
              <label htmlFor="2fa" className="text-sm text-gray-700">
                Activer la 2FA pour tous les utilisateurs
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Timeout de session */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeout de session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                disabled={!isEditing}
                min="5"
                max="120"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-600">minutes</span>
            </div>
          </CardContent>
        </Card>

        {/* Tentatives de connexion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tentatives de connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                disabled={!isEditing}
                min="3"
                max="10"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-600">tentatives avant blocage</span>
            </div>
          </CardContent>
        </Card>

        {/* Politique de mots de passe */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Politique de mots de passe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordPolicy: { ...settings.passwordPolicy, minLength: parseInt(e.target.value) }
                })}
                disabled={!isEditing}
                min="6"
                max="20"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-600">caractères minimum</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireSpecialChars}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: { ...settings.passwordPolicy, requireSpecialChars: e.target.checked }
                  })}
                  disabled={!isEditing}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Caractères spéciaux requis</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireNumbers}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: { ...settings.passwordPolicy, requireNumbers: e.target.checked }
                  })}
                  disabled={!isEditing}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Chiffres requis</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireUppercase}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: { ...settings.passwordPolicy, requireUppercase: e.target.checked }
                  })}
                  disabled={!isEditing}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Majuscules requises</label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste blanche IP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste blanche IP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Adresses IP autorisées à accéder aux fonctionnalités d'administration
            </p>
            <div className="space-y-2">
              {settings.ipWhitelist.map((ip, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={ip}
                    onChange={(e) => {
                      const newList = [...settings.ipWhitelist];
                      newList[index] = e.target.value;
                      setSettings({ ...settings, ipWhitelist: newList });
                    }}
                    disabled={!isEditing}
                    className="px-3 py-1 border border-gray-300 rounded text-sm font-mono"
                    placeholder="127.0.0.1"
                  />
                  {isEditing && (
                    <Button
                      onClick={() => {
                        const newList = settings.ipWhitelist.filter((_, i) => i !== index);
                        setSettings({ ...settings, ipWhitelist: newList });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              ))}
              {isEditing && (
                <Button
                  onClick={() => setSettings({
                    ...settings,
                    ipWhitelist: [...settings.ipWhitelist, '']
                  })}
                  variant="outline"
                  size="sm"
                >
                  Ajouter IP
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};