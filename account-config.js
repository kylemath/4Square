/* account-config.js: the ONE place to switch on online accounts + shared leaderboards. Read ACCOUNTS.md first.
 *
 * Leave this as null and the game runs in LOCAL mode: a random player id kept on this device, a leaderboard of this
 * device's players, Google sign-in shown but disabled. Nothing leaves the device.
 *
 * To go online, create a Firebase project (ACCOUNTS.md has every step), then replace null with the web config from
 * Firebase console > Project settings > Your apps > Web app. These values are public identifiers, not secrets
 * (access is controlled by firestore.rules and the authorized-domain list), so committing them is normal.
 *
 * window.FTH_FIREBASE = {
 *   apiKey: 'AIza...',
 *   authDomain: 'YOUR-PROJECT.firebaseapp.com',
 *   projectId: 'YOUR-PROJECT',
 *   appId: '1:123456789:web:abcdef',
 * };
 */
window.FTH_FIREBASE = null;
