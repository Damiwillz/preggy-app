# Preggy App

# Preggers App

A responsive Expo Router iOS pregnancy companion app based on the supplied design screens.

## Included screens

Onboarding, private login, dashboard, calculator, due date result, weekly growth, pregnancy timeline, daily guidance articles, medication and supplements, symptom log, appointments, appointment details, appointment cancellation, and profile.

## Private login

Username: `Damilare`

Password: `1234567`

The eye icon in the password field shows or hides the password.

## Run

```bash
npm install --legacy-peer-deps
npx expo start --clear
```

Press `i` to open the iOS Simulator, or scan the QR code with Expo Go on an iPhone.

## Main folders

`app/` routes and screens

`components/` reusable UI and layout pieces

`constants/` colors, spacing, typography, and local login values

`assets/images/` exported visual assets from the supplied design screens

## Notes

The local credential check is suitable for personal testing only. A production release should authenticate through a secure backend and should not keep credentials in the client bundle.
