# FF Tournament Web (Starter Project)

A mobile-friendly Bengali Free Fire tournament website starter. Firebase configuration is intentionally left as placeholders.

## Included
- Responsive landing page and tournament cards (Solo / Duo / Squad)
- Firebase Email/Password sign-up and login
- Reads tournament documents from Firestore `tournaments` collection
- Basic player profile creation under `users/{uid}`
- Manual payment-submission UI scaffold (does not verify or process payments)
- Firebase Hosting config and example Firestore rules

## Before using
1. Create/open your Firebase project.
2. In Firebase Console → Project settings → Your apps → Web app → Config, copy the `firebaseConfig` values.
3. Open `public/firebase-config.js` and replace each `YOUR_...` placeholder.
4. Firebase Console → Authentication → Sign-in method: enable Email/Password.
5. Create Firestore database.
6. Review `firestore.rules` and publish rules in Firestore → Rules. Do not use open/public write rules.
7. Install Node.js and Firebase CLI on a computer/Termux, then run:
   ```sh
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only hosting
   ```
   If you want to deploy rules too, review them carefully and run `firebase deploy --only firestore:rules`.

## Add sample tournament
In Firestore, create collection `tournaments`, then add a document with fields:
- `name` (string): `Free Fire Solo`
- `mode` (string): `Solo`
- `entryFee` (number): `20`
- `prizePool` (number): `100`
- `status` (string): `upcoming`
- `slotsTotal` (number): `48`
- `slotsFilled` (number): `0`
- `description` (string): `Join the next match`

Repeat with mode `Duo` and `Squad` as needed.

## Important safety notes
- This starter is not a finished production tournament/payment platform.
- bKash/Nagad payments are NOT automatically processed or verified. The UI only demonstrates a manual submission flow. Verify payments through your official merchant process; never ask users for PIN/OTP.
- Admin/Owner roles must be assigned securely by a trusted server/Admin SDK or manually by a trusted project owner. Never place service-account private keys in frontend code.
- Do not give untrusted users write access to tournament/prize fields. Rules included here allow only signed-in users to read tournament listings and each user to read/write their own profile. Registration/payment workflows need a trusted backend before launch.
