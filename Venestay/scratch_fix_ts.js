import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [regex, repl] of replacements) {
    content = content.replace(regex, repl);
  }
  if (content !== original) fs.writeFileSync(filePath, content);
}

const dir = process.cwd();

replaceInFile(path.join(dir, 'components', 'Chat.tsx'), [
  [/a\.createdAt\?\.seconds/g, '(a as { createdAt?: { seconds: number } }).createdAt?.seconds'],
  [/b\.createdAt\?\.seconds/g, '(b as { createdAt?: { seconds: number } }).createdAt?.seconds'],
  [/msg\.text/g, '(msg as { text?: string }).text'],
  [/msg\.imageUrl/g, '(msg as { imageUrl?: string }).imageUrl'],
  [/error\?\.code/g, '(error as { code?: string }).code'],
  [/error\?\.message/g, '(error as Error).message'],
]);

const authReplacements = [
  [/err\.message/g, '(err as Error).message'],
  [/error\?\.code/g, '(error as { code?: string }).code'],
  [/error\?\.message/g, '(error as Error).message'],
];
replaceInFile(path.join(dir, 'features', 'auth', 'components', 'AuthModal.tsx'), authReplacements);
replaceInFile(path.join(dir, 'features', 'auth', 'components', 'PasswordReset.tsx'), authReplacements);
replaceInFile(path.join(dir, 'features', 'auth', 'components', 'UserProfileSetup.tsx'), authReplacements);

replaceInFile(path.join(dir, 'features', 'bookings', 'components', 'MyTrips.tsx'), [
  [/a\.createdAt\?\.seconds/g, '(a as { createdAt?: { seconds: number } }).createdAt?.seconds'],
  [/b\.createdAt\?\.seconds/g, '(b as { createdAt?: { seconds: number } }).createdAt?.seconds'],
]);

replaceInFile(path.join(dir, 'features', 'checkout', 'components', 'CheckoutPage.tsx'), [
  [/state\?\.bookingData\?\.listingId/g, '(state?.bookingData as { listingId?: string })?.listingId'],
  [/state\?\.bookingData\?\.startDate/g, '(state?.bookingData as { startDate?: string })?.startDate'],
  [/state\?\.bookingData\?\.endDate/g, '(state?.bookingData as { endDate?: string })?.endDate'],
  [/state\?\.bookingData\?\.guests/g, '(state?.bookingData as { guests?: string })?.guests'],
  [/uploadError\?\.code/g, '(uploadError as { code?: string }).code'],
  [/uploadError\?\.message/g, '(uploadError as Error).message'],
]);

replaceInFile(path.join(dir, 'features', 'dashboard', 'components', 'AdminDashboard.tsx'), [
  [/a\.createdAt\?\.seconds/g, '(a as { createdAt?: { seconds: number } }).createdAt?.seconds'],
  [/b\.createdAt\?\.seconds/g, '(b as { createdAt?: { seconds: number } }).createdAt?.seconds'],
  [/error\?\.code/g, '(error as { code?: string }).code'],
  [/error\?\.message/g, '(error as Error).message'],
  [/const payload: unknown = \{/g, 'const payload: Record<string, unknown> = {'],
  [/const \{ id: _, \.\.\.updateData \} = payload;/g, 'const { id: _, ...updateData } = payload as Record<string, unknown>;'],
  [/payload\.createdAt/g, '(payload as Record<string, unknown>).createdAt'],
]);

replaceInFile(path.join(dir, 'firebase.ts'), [
  [/\(firebaseConfig as Record<string, unknown>\)\.firestoreDatabaseId \|\| '\(default\)'/g, '(firebaseConfig as Record<string, unknown>).firestoreDatabaseId as string || \'(default)\''],
  [/error\.code/g, '(error as { code?: string }).code'],
  [/error\.message/g, '(error as Error).message'],
]);

replaceInFile(path.join(dir, 'lib', 'utils.ts'), [
  [/const date = new Date\(dateStr\);/g, 'const date = new Date(dateStr as string | number | Date);'],
]);

console.log("TS fixed.");
